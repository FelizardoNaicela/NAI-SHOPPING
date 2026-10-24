import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { api } from "../services/api";

import styles from "./NationalRankingManagementPage.module.css";

import {
  COUNTRIES,
} from "../shared/regions";

import ProductImageUploader from "../components/product/ProductImageUploader";
import ProductImagePreview from "../components/product/ProductImagePreview";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Gavel,
  Globe,
  Info,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Store as StoreIcon,
  Trophy,
  X,
} from "lucide-react";

import PanelSection from "../components/panel/PanelSection";

type AdminProfile = {
  user: {
    id: string;
    name?: string | null;
    email: string;
    countryCode?: string | null;
  };

  adminRole:
    | "SUPER_ADMIN"
    | "REGIONAL_ADMIN";

  status: string;

  region?: string | null;

  canManageRanking: boolean;
};

type RankingStore = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  verificationType?:
    | "BASIC"
    | "PREMIUM"
    | null;
  isActive?: boolean;
  countryCode?: string | null;

  nationalRankingPositions?: Array<{
    id: string;
    position: number;
    countryCode: string;
  }>;
};

type RankingAuctionProduct = {
  id: string;
  countryCode?: string;
  position?: number;
  name: string;
  type: "AUCTION";
  imageUrl?: string | null;
  price?: number | null;
  auctionStartPrice?: number | null;
  currentBid?: number | null;
  minimumIncrement?: number | null;
  reservePrice?: number | null;
  auctionStartsAt?: string | null;
  auctionEndsAt?: string | null;
  auctionClosed?: boolean;
  closedAt?: string | null;
  finalPrice?: number | null;
  winnerStoreId?: string | null;
};

type RankingPosition = {
  position: number;

  store?: RankingStore | null;

  auctionProduct?: RankingAuctionProduct | null;

  assignedBy?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

type StoreSearchResponse =
  RankingStore[];

type ImageItem = {
  file: File;
  preview: string;
  isCover: boolean;
};

type AuctionForm = {
  name: string;
  startPrice: string;
  minimumIncrement: string;
  reservePrice: string;
  startsAt: string;
  endsAt: string;
};

type BackendAuction = {
  id: string;
  countryCode?: string;
  position?: number;
  name: string;
  imageUrl?: string | null;
  startPrice: number;
  currentBid?: number | null;
  minimumIncrement?: number | null;
  reservePrice?: number | null;
  startsAt: string;
  endsAt: string;
  closed?: boolean;
  closedAt?: string | null;
  finalPrice?: number | null;
  winnerStoreId?: string | null;
};

const EMPTY_POSITIONS: RankingPosition[] =
  Array.from(
    { length: 10 },
    (_, index) => ({
      position: index + 1,
      store: null,
      auctionProduct: null,
    }),
  );

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000";

function getAvatarUrl(
  avatarUrl?: string | null,
) {
  if (!avatarUrl) {
    return null;
  }

  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://")
  ) {
    return avatarUrl;
  }

  return `${API_URL}${
    avatarUrl.startsWith("/")
      ? ""
      : "/"
  }${avatarUrl}`;
}

function getPositionLabel(
  position: number,
) {
  switch (position) {
    case 1:
      return "🥇";

    case 2:
      return "🥈";

    case 3:
      return "🥉";

    default:
      return `${position}º`;
  }
}

function getStoreRankingPosition(
  store: RankingStore,
) {
  return (
    store.nationalRankingPositions?.[0]
      ?.position ?? null
  );
}

function formatPrice(
  value?: number | null,
) {
  if (
    value === undefined ||
    value === null
  ) {
    return "—";
  }

  return `${Number(value).toLocaleString(
    "pt-MZ",
  )} MT`;
}

/**
 * Converte uma data ISO recebida do backend
 * para o formato aceito pelo input datetime-local.
 */
function toDateTimeLocal(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset * 60 * 1000,
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

/**
 * Converte o objeto "auction" retornado
 * pelo backend para o formato antigo
 * usado nesta página como "auctionProduct".
 *
 * O backend NÃO chama isto de Product.
 * É apenas um nome de compatibilidade
 * usado pelo frontend.
 */
function normalizeAuction(
  auction?: BackendAuction | null,
): RankingAuctionProduct | null {
  if (!auction) {
    return null;
  }

  return {
    id: auction.id,
    countryCode:
      auction.countryCode,
    position:
      auction.position,
    name:
      auction.name,
    type: "AUCTION",
    imageUrl:
      auction.imageUrl,
    price:
      auction.startPrice,
    auctionStartPrice:
      auction.startPrice,
    currentBid:
      auction.currentBid,
    minimumIncrement:
      auction.minimumIncrement,
    reservePrice:
      auction.reservePrice,
    auctionStartsAt:
      auction.startsAt,
    auctionEndsAt:
      auction.endsAt,
    auctionClosed:
      auction.closed,
    closedAt:
      auction.closedAt,
    finalPrice:
      auction.finalPrice,
    winnerStoreId:
      auction.winnerStoreId,
  };
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("pt-MZ", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getAuctionState(auction: RankingAuctionProduct) {
  if (auction.auctionClosed) {
    return { label: "Encerrado", tone: styles.toneClosed };
  }

  const now = Date.now();

  const start = auction.auctionStartsAt
    ? new Date(auction.auctionStartsAt).getTime()
    : NaN;

  const end = auction.auctionEndsAt
    ? new Date(auction.auctionEndsAt).getTime()
    : NaN;

  if (!Number.isNaN(start) && now < start) {
    return { label: "Agendado", tone: styles.toneScheduled };
  }

  if (!Number.isNaN(end) && now > end) {
    return { label: "Terminado", tone: styles.toneEnded };
  }

  return { label: "A decorrer", tone: styles.toneRunning };
}

export default function NationalRankingManagementPage() {
  const navigate = useNavigate();

  // =========================================
  // ADMIN
  // =========================================

  const [profile, setProfile] =
    useState<AdminProfile | null>(
      null,
    );

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  // =========================================
  // RANKING
  // =========================================

  const [positions, setPositions] =
    useState<RankingPosition[]>(
      EMPTY_POSITIONS,
    );

  const [loadingRanking, setLoadingRanking] =
    useState(false);

  // =========================================
  // PAÍS
  // =========================================

  const [countryCode, setCountryCode] =
    useState("MZ");

  // =========================================
  // PESQUISA DE LOJAS
  // =========================================

  const [search, setSearch] =
    useState("");

  const [stores, setStores] =
    useState<StoreSearchResponse>([]);

  const [searchingStores, setSearchingStores] =
    useState(false);

  // =========================================
  // ESTADO DA OPERAÇÃO
  // =========================================

  const [savingPosition, setSavingPosition] =
    useState<number | null>(null);

  const [removingPosition, setRemovingPosition] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================
  // LEILÃO
  // =========================================

  const [auctionModalOpen, setAuctionModalOpen] =
    useState(false);

  const [auctionPosition, setAuctionPosition] =
    useState<number | null>(null);

  const [editingAuction, setEditingAuction] =
    useState<RankingAuctionProduct | null>(
      null,
    );

  const [auctionForm, setAuctionForm] =
    useState<AuctionForm>({
      name: "",
      startPrice: "",
      minimumIncrement: "",
      reservePrice: "",
      startsAt: "",
      endsAt: "",
    });

  const [auctionImages, setAuctionImages] =
    useState<ImageItem[]>([]);

  const [savingAuction, setSavingAuction] =
    useState(false);

  // =========================================
  // DATA/HORA MÍNIMA
  // =========================================

  const now = new Date()
    .toISOString()
    .slice(0, 16);

  // =========================================
  // BUSCAR PERFIL ADMIN
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoadingProfile(true);
        setError("");

        const res =
          await api.get(
            "/admin/me",
          );

        if (cancelled) {
          return;
        }

        const adminProfile =
          res.data as AdminProfile;

        setProfile(
          adminProfile,
        );

        const adminCountry =
          adminProfile.user
            ?.countryCode
            ?.trim()
            .toUpperCase();

        if (adminCountry) {
          setCountryCode(
            adminCountry,
          );
        }

      } catch (err) {

        if (!cancelled) {
          setError(
            "Não foi possível carregar o perfil administrativo.",
          );
        }

      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================
  // BUSCAR RANKING
  // =========================================

  async function loadRanking(
    requestedCountry =
      countryCode,
  ) {
    const normalizedCountry =
      requestedCountry
        .trim()
        .toUpperCase();

    if (!normalizedCountry) {
      return;
    }

    try {
      setLoadingRanking(true);
      setError("");

      const res =
        await api.get(
          "/admin/ranking/national",
          {
            params: {
              countryCode:
                normalizedCountry,
            },
          },
        );

      const received =
        Array.isArray(res.data)
          ? res.data
          : [];

      /**
       * IMPORTANTE:
       *
       * O backend retorna:
       *
       * {
       *   position: 1,
       *   store: {...},
       *   auction: {...}
       * }
       *
       * Enquanto o frontend antigo usava:
       *
       * auctionProduct
       *
       * Aqui fazemos a conversão.
       */
      const normalized =
        Array.from(
          { length: 10 },
          (_, index) => {
            const position =
              index + 1;

            const found =
              received.find(
                (
                  item: any,
                ) =>
                  item.position ===
                  position,
              );

            if (!found) {
              return {
                position,
                store: null,
                auctionProduct:
                  null,
              };
            }

            return {
              position,
              store:
                found.store ??
                null,

              auctionProduct:
                normalizeAuction(
                  found.auction ??
                  found.auctionProduct ??
                  null,
                ),

              assignedBy:
                found.assignedBy ??
                null,
            };
          },
        );

      setPositions(
        normalized,
      );

    } catch (err) {

      setError(
        "Não foi possível carregar o ranking nacional.",
      );

    } finally {
      setLoadingRanking(false);
    }
  }

  useEffect(() => {
    if (
      loadingProfile ||
      !profile
    ) {
      return;
    }

    if (
      profile.adminRole !==
        "SUPER_ADMIN" &&
      !profile.canManageRanking
    ) {
      return;
    }

    loadRanking(
      countryCode,
    );
  }, [
    loadingProfile,
    profile,
    countryCode,
  ]);

  useEffect(() => {
  if (!success) {
    return;
  }

  const timer = window.setTimeout(() => setSuccess(""), 4000);

  return () => window.clearTimeout(timer);
}, [success]);

  // =========================================
  // PESQUISAR LOJAS
  // =========================================

  async function searchStores() {
    const normalizedSearch =
      search.trim();

    if (
      !countryCode.trim()
    ) {
      setError(
        "Informe o país do ranking.",
      );

      return;
    }

    try {
      setSearchingStores(
        true,
      );

      setError("");

      const res =
        await api.get(
          "/admin/ranking/national/stores",
          {
            params: {
              countryCode:
                countryCode
                  .trim()
                  .toUpperCase(),

              q: normalizedSearch,
            },
          },
        );

      const received =
        Array.isArray(res.data)
          ? res.data
          : [];

      setStores(
        received,
      );

    } catch (err) {

      setError(
        "Não foi possível pesquisar as lojas.",
      );

    } finally {
      setSearchingStores(
        false,
      );
    }
  }

  // =========================================
  // ATRIBUIR LOJA
  // =========================================

  async function assignStore(
    position: number,
    storeId: string,
  ) {
    try {
      setSavingPosition(
        position,
      );

      setError("");
      setSuccess("");

      await api.post(
        "/admin/ranking/national",
        {
          countryCode:
            countryCode
              .trim()
              .toUpperCase(),

          storeId,

          position,
        },
      );

      await loadRanking(
        countryCode,
      );

      await searchStores();

      setSuccess(
        `Loja atribuída à posição ${position} com sucesso.`,
      );

    } catch (err) {


      setError(
        "Não foi possível atribuir esta loja à posição.",
      );

    } finally {
      setSavingPosition(
        null,
      );
    }
  }

  // =========================================
  // REMOVER LOJA
  // =========================================

  async function removeStore(
    position: number,
  ) {
    try {
      setRemovingPosition(
        position,
      );

      setError("");
      setSuccess("");

      await api.patch(
        `/admin/ranking/national/${position}/remove`,
        null,
        {
          params: {
            countryCode:
              countryCode
                .trim()
                .toUpperCase(),
          },
        },
      );

      await loadRanking(
        countryCode,
      );

      await searchStores();

      setSuccess(
        `Loja removida da posição ${position}.`,
      );

    } catch (err) {


      setError(
        "Não foi possível remover a loja da posição.",
      );

    } finally {
      setRemovingPosition(
        null,
      );
    }
  }

  // =========================================
  // ABRIR MODAL DE LEILÃO
  // =========================================

  function openCreateAuction(
    position: number,
  ) {
    setAuctionPosition(
      position,
    );

    setEditingAuction(
      null,
    );

    setAuctionForm({
      name: `Leilão da posição ${position} — Ranking Nacional`,
      startPrice: "",
      minimumIncrement: "",
      reservePrice: "",
      startsAt: now,
      endsAt: "",
    });

    setAuctionImages([]);

    setError("");
    setSuccess("");

    setAuctionModalOpen(
      true,
    );
  }

  // =========================================
  // ABRIR EDIÇÃO DE LEILÃO
  // =========================================

  function openEditAuction(
    position: number,
    auction: RankingAuctionProduct,
  ) {
    setAuctionPosition(
      position,
    );

    setEditingAuction(
      auction,
    );

    setAuctionForm({
      name:
        auction.name ??
        `Leilão da posição ${position} — Ranking Nacional`,

      startPrice:
        auction.auctionStartPrice !=
        null
          ? String(
              auction.auctionStartPrice,
            )
          : "",

      minimumIncrement:
        auction.minimumIncrement !=
        null
          ? String(
              auction.minimumIncrement,
            )
          : "",

      reservePrice:
        auction.reservePrice !=
        null
          ? String(
              auction.reservePrice,
            )
          : "",

      startsAt:
        toDateTimeLocal(
          auction.auctionStartsAt,
        ),

      endsAt:
        toDateTimeLocal(
          auction.auctionEndsAt,
        ),
    });

    /**
     * Não colocamos a imagem existente
     * no ProductImagePreview porque ele
     * trabalha com File.
     *
     * A imagem atual é mostrada separadamente
     * no modal.
     */
    setAuctionImages([]);

    setError("");
    setSuccess("");

    setAuctionModalOpen(
      true,
    );
  }

  // =========================================
  // FECHAR MODAL
  // =========================================

  function closeAuctionModal() {
    if (savingAuction) {
      return;
    }

    setAuctionModalOpen(
      false,
    );

    setAuctionPosition(
      null,
    );

    setEditingAuction(
      null,
    );

    setAuctionImages([]);
  }

  // =========================================
  // ALTERAR FORMULÁRIO DO LEILÃO
  // =========================================

  function updateAuctionField(
    field: keyof AuctionForm,
    value: string,
  ) {
    setAuctionForm(
      previous => ({
        ...previous,
        [field]: value,
      }),
    );
  }

  // =========================================
  // IMAGENS DO LEILÃO
  // =========================================

  function addAuctionFiles(
    files: File[],
  ) {
    const newImages =
      files.map(
        (file, index) => ({
          file,
          preview:
            URL.createObjectURL(
              file,
            ),
          isCover:
            auctionImages.length ===
              0 &&
            index === 0,
        }),
      );

    setAuctionImages(
      previous => [
        ...previous,
        ...newImages,
      ],
    );
  }

  function removeAuctionImage(
    index: number,
  ) {
    setAuctionImages(
      previous =>
        previous.filter(
          (_, i) =>
            i !== index,
        ),
    );
  }

  function setAuctionCover(
    index: number,
  ) {
    setAuctionImages(
      previous =>
        previous.map(
          (image, i) => ({
            ...image,
            isCover:
              i === index,
          }),
        ),
    );
  }

  // =========================================
  // UPLOAD DA IMAGEM DO LEILÃO
  // =========================================

  async function uploadAuctionImage() {
    if (
      !auctionImages.length
    ) {
      return null;
    }

    const formData =
      new FormData();

    auctionImages.forEach(
      image => {
        formData.append(
          "files",
          image.file,
        );
      },
    );

    const response =
      await api.post(
        "/upload/images",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
      );

    const uploaded =
      response.data;

    if (
      !Array.isArray(
        uploaded,
      ) ||
      !uploaded.length
    ) {
      return null;
    }

    /**
     * Para o leilão precisamos apenas
     * de uma imagem.
     *
     * Usamos a primeira imagem enviada.
     */
    return (
      uploaded[0]
        ?.largeUrl ??
      uploaded[0]
        ?.url ??
      null
    );
  }

  // =========================================
  // SALVAR LEILÃO
  // =========================================

  async function saveAuction(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (
      auctionPosition === null
    ) {
      return;
    }

    const normalizedCountry =
      countryCode
        .trim()
        .toUpperCase();

    const normalizedName =
      auctionForm.name.trim();

    const startPrice =
      Number(
        auctionForm.startPrice,
      );

    const minimumIncrement =
      auctionForm.minimumIncrement
        ? Number(
            auctionForm.minimumIncrement,
          )
        : undefined;

    const reservePrice =
      auctionForm.reservePrice
        ? Number(
            auctionForm.reservePrice,
          )
        : undefined;

    if (!normalizedName) {
      setError(
        "Informe o nome do leilão.",
      );

      return;
    }

    if (
      !Number.isFinite(
        startPrice,
      ) ||
      startPrice < 0
    ) {
      setError(
        "Informe um preço inicial válido.",
      );

      return;
    }

    if (
      minimumIncrement !==
        undefined &&
      (
        !Number.isFinite(
          minimumIncrement,
        ) ||
        minimumIncrement <= 0
      )
    ) {
      setError(
        "Informe um incremento mínimo válido.",
      );

      return;
    }

    if (
      reservePrice !==
        undefined &&
      (
        !Number.isFinite(
          reservePrice,
        ) ||
        reservePrice < 0
      )
    ) {
      setError(
        "Informe um preço de reserva válido.",
      );

      return;
    }

    if (
      reservePrice !==
        undefined &&
      reservePrice <
        startPrice
    ) {
      setError(
        "O preço de reserva não pode ser inferior ao preço inicial.",
      );

      return;
    }

    if (
      !auctionForm.startsAt ||
      !auctionForm.endsAt
    ) {
      setError(
        "Informe a data de início e a data de término do leilão.",
      );

      return;
    }

    const startsAt =
      new Date(
        auctionForm.startsAt,
      );

    const endsAt =
      new Date(
        auctionForm.endsAt,
      );

    if (
      Number.isNaN(
        startsAt.getTime(),
      ) ||
      Number.isNaN(
        endsAt.getTime(),
      )
    ) {
      setError(
        "As datas do leilão são inválidas.",
      );

      return;
    }

    if (
      endsAt <= startsAt
    ) {
      setError(
        "A data de término deve ser posterior à data de início.",
      );

      return;
    }

    try {
      setSavingAuction(
        true,
      );

      setError("");
      setSuccess("");

      /**
       * Se o administrador escolheu
       * uma nova imagem, fazemos o upload.
       *
       * Se estiver editando e não escolheu
       * nova imagem, mantemos a existente.
       */
      let imageUrl =
        editingAuction?.imageUrl ??
        null;

      if (
        auctionImages.length >
        0
      ) {
        const uploadedImage =
          await uploadAuctionImage();

        if (uploadedImage) {
          imageUrl =
            uploadedImage;
        }
      }

      await api.patch(
        `/admin/ranking/national/${auctionPosition}/auction`,
        {
          name:
            normalizedName,

          imageUrl,

          startPrice,

          minimumIncrement,

          reservePrice,

          startsAt:
            startsAt.toISOString(),

          endsAt:
            endsAt.toISOString(),
        },
        {
          params: {
            countryCode:
              normalizedCountry,
          },
        },
      );

      await loadRanking(
        normalizedCountry,
      );

      setSuccess(
        editingAuction
          ? `Leilão da posição ${auctionPosition} atualizado com sucesso.`
          : `Leilão da posição ${auctionPosition} criado com sucesso.`,
      );

      closeAuctionModal();

    } catch (err) {

      setError(
        "Não foi possível salvar o leilão.",
      );

    } finally {
      setSavingAuction(
        false,
      );
    }
  }

  // =========================================
  // PERMISSÃO
  // =========================================

  const isSuperAdmin =
    profile?.adminRole ===
    "SUPER_ADMIN";

  const canManageRanking =
    isSuperAdmin ||
    profile?.canManageRanking ===
      true;

  // =========================================
  // LOADING
  // =========================================

    // =========================================
  // RESUMO
  // =========================================

  const occupiedCount = positions.filter(item => item.store).length;

  const auctionsCount = positions.filter(
    item => item.auctionProduct,
  ).length;

  const runningAuctions = positions.filter(item => {
    const auction = item.auctionProduct;

    return (
      auction &&
      getAuctionState(auction).label === "A decorrer"
    );
  }).length;

  // =========================================
  // LOADING
  // =========================================

  if (loadingProfile) {
    return (
      <div className={styles.page}>
        <div className={styles.state}>
          A carregar gestão do ranking...
        </div>
      </div>
    );
  }

  // =========================================
  // SEM PERMISSÃO
  // =========================================

  if (!profile || !canManageRanking) {
    return (
      <div className={styles.page}>
        <div className={styles.state}>
          <Lock size={42} />

          <h2>Acesso não autorizado</h2>

          <p>Não possui permissão para gerir o Ranking Nacional.</p>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => navigate("/admin")}
          >
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* CABEÇALHO */}

        <header className={styles.header}>
          <div>
            <button
              type="button"
              className={styles.backLink}
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft size={16} />
              Voltar ao painel
            </button>

            <h1 className={styles.title}>Gestão do Ranking Nacional</h1>

            <p className={styles.subtitle}>
              Gira as 10 posições nacionais, configure os leilões e
              atribua lojas autorizadas.
            </p>
          </div>

          <div className={styles.adminBadge}>
            <strong>
              {isSuperAdmin ? "SUPER ADMIN" : "ADMIN REGIONAL"}
            </strong>

            <span>{profile.user.email}</span>
          </div>
        </header>

        {/* AVISOS */}

        {error && (
          <div role="alert" className={`${styles.alert} ${styles.alertError}`}>
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        {success && (
          <div role="status" className={`${styles.alert} ${styles.alertSuccess}`}>
            <CheckCircle2 size={17} />
            {success}
          </div>
        )}

        {/* PAÍS */}

        <section className={styles.toolbar}>
          <div className={styles.toolbarInfo}>
            <span className={styles.toolbarIcon}>
              <Globe size={20} />
            </span>

            <div>
              <strong>País do ranking</strong>

              <span>
                {isSuperAdmin
                  ? "O ranking é separado por país."
                  : "O administrador regional só gere o ranking do seu país."}
              </span>
            </div>
          </div>

          <div className={styles.toolbarControls}>
            <select
              className={styles.select}
              value={countryCode}
              onChange={event => setCountryCode(event.target.value)}
              disabled={!isSuperAdmin}
            >
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.btn}
              onClick={() => loadRanking(countryCode)}
              disabled={loadingRanking}
            >
              <RefreshCw size={15} />
              {loadingRanking ? "A atualizar..." : "Atualizar"}
            </button>
          </div>
        </section>

        {/* RESUMO */}

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Posições ocupadas</span>
            <strong className={styles.statValue}>
              {occupiedCount} <small>/ 10</small>
            </strong>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Leilões configurados</span>
            <strong className={styles.statValue}>
              {auctionsCount} <small>/ 10</small>
            </strong>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Leilões a decorrer</span>
            <strong className={styles.statValue}>{runningAuctions}</strong>
          </div>
        </section>

        {/* POSIÇÕES */}

        <PanelSection
          title="Posições nacionais"
          description="Existem exatamente 10 posições neste ranking."
          icon={<Trophy size={20} strokeWidth={1.9} />}
          storageKey="rankingAdmin:positions"
          summary={<span className={styles.countryBadge}>{countryCode}</span>}
        >
          <div className={styles.positions}>
            {positions.map(item => {
              const store = item.store;
              const auction = item.auctionProduct;
              const auctionState = auction ? getAuctionState(auction) : null;

              return (
                <article key={item.position} className={styles.position}>
                  <div className={styles.positionRank}>
                    {getPositionLabel(item.position)}
                  </div>

                  <div className={styles.positionBody}>
                    {/* BANCA */}

                    <div className={styles.block}>
                      <span className={styles.blockLabel}>Banca</span>

                      {store ? (
                        <>
                          <button
                            type="button"
                            className={styles.storeLink}
                            onClick={() => navigate(`/stores/${store.id}`)}
                            aria-label={`Abrir banca ${store.name}`}
                          >
                            {store.avatarUrl ? (
                              <img
                                src={getAvatarUrl(store.avatarUrl) ?? undefined}
                                alt={store.name}
                                className={styles.avatar}
                              />
                            ) : (
                              <span className={styles.avatarFallback}>
                                <StoreIcon size={20} />
                              </span>
                            )}

                            <span className={styles.storeText}>
                              <strong>{store.name}</strong>

                              <span
                                className={`${styles.tag} ${
                                  store.verificationType === "PREMIUM"
                                    ? styles.tagPremium
                                    : ""
                                }`}
                              >
                                {store.verificationType === "PREMIUM"
                                  ? "★ Premium"
                                  : "✓ Verificada"}
                              </span>
                            </span>
                          </button>

                          <button
                            type="button"
                            className={`${styles.btnDanger} ${styles.btnSmall}`}
                            disabled={removingPosition === item.position}
                            onClick={() => removeStore(item.position)}
                            style={{ alignSelf: "flex-start" }}
                          >
                            {removingPosition === item.position
                              ? "A remover..."
                              : "Remover loja"}
                          </button>
                        </>
                      ) : (
                        <div className={styles.empty}>
                          <strong>Posição disponível</strong>
                          <span>Nenhuma loja atribuída.</span>
                        </div>
                      )}
                    </div>

                    {/* LEILÃO */}

                    <div className={styles.block}>
                      <span className={styles.blockLabel}>Leilão</span>

                      {auction && auctionState ? (
                        <>
                          <div className={styles.auctionHead}>
                            <span className={styles.auctionName}>
                              {auction.name}
                            </span>

                            <span
                              className={`${styles.pill} ${auctionState.tone}`}
                            >
                              {auctionState.label}
                            </span>
                          </div>

                          <div className={styles.facts}>
                            <div className={styles.fact}>
                              <span>Inicial</span>
                              <strong>
                                {formatPrice(auction.auctionStartPrice)}
                              </strong>
                            </div>

                            <div className={styles.fact}>
                              <span>Atual</span>
                              <strong>
                                {formatPrice(
                                  auction.currentBid ??
                                    auction.auctionStartPrice,
                                )}
                              </strong>
                            </div>

                            <div className={styles.fact}>
                              <span>Incremento</span>
                              <strong>
                                {formatPrice(auction.minimumIncrement)}
                              </strong>
                            </div>

                            <div className={styles.fact}>
                              <span>Reserva</span>
                              <strong>
                                {formatPrice(auction.reservePrice)}
                              </strong>
                            </div>
                          </div>

                          <div className={styles.dates}>
                            <span>
                              Início: {formatDateTime(auction.auctionStartsAt)}
                            </span>

                            <span>
                              Fim: {formatDateTime(auction.auctionEndsAt)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnSmall}`}
                            style={{ alignSelf: "flex-start" }}
                            onClick={() =>
                              openEditAuction(item.position, auction)
                            }
                          >
                            <Pencil size={14} />
                            Editar leilão
                          </button>
                        </>
                      ) : (
                        <div className={styles.emptyRow}>
                          <div className={styles.empty}>
                            <strong>Sem leilão</strong>
                            <span>Nenhum leilão associado.</span>
                          </div>

                          <button
                            type="button"
                            className={`${styles.btnPrimary} ${styles.btnSmall}`}
                            onClick={() => openCreateAuction(item.position)}
                          >
                            <Plus size={14} />
                            Criar leilão
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </PanelSection>

        {/* ATRIBUIR LOJA */}

        <PanelSection
          title="Atribuir loja a uma posição"
          description="Apenas lojas elegíveis devolvidas pelo servidor podem ser atribuídas."
          icon={<Search size={20} strokeWidth={1.9} />}
          storageKey="rankingAdmin:assign"
          summary={
            stores.length > 0
              ? `${stores.length} resultado${stores.length === 1 ? "" : "s"}`
              : undefined
          }
        >
          <div className={styles.searchControls}>
            <input
              className={styles.input}
              value={search}
              onChange={event => setSearch(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  searchStores();
                }
              }}
              placeholder="Pesquisar banca..."
            />

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={searchStores}
              disabled={searchingStores}
            >
              <Search size={15} />
              {searchingStores ? "A pesquisar..." : "Pesquisar"}
            </button>
          </div>

          {stores.length > 0 && (
            <div className={styles.results}>
              {stores.map(store => {
                const currentPosition = getStoreRankingPosition(store);

                return (
                  <div key={store.id} className={styles.result}>
                    <button
                      type="button"
                      className={styles.storeLink}
                      style={{ width: "auto", flex: 1 }}
                      onClick={() => navigate(`/stores/${store.id}`)}
                      aria-label={`Abrir banca ${store.name}`}
                    >
                      {store.avatarUrl ? (
                        <img
                          src={getAvatarUrl(store.avatarUrl) ?? undefined}
                          alt={store.name}
                          className={styles.avatar}
                        />
                      ) : (
                        <span className={styles.avatarFallback}>
                          <StoreIcon size={20} />
                        </span>
                      )}

                      <span className={styles.storeText}>
                        <strong>{store.name}</strong>

                        <span
                          className={`${styles.tag} ${
                            store.verificationType === "PREMIUM"
                              ? styles.tagPremium
                              : ""
                          }`}
                        >
                          {store.verificationType === "PREMIUM"
                            ? "★ Premium"
                            : "✓ Verificada"}
                        </span>
                      </span>
                    </button>

                    <div className={styles.assign}>
                      {currentPosition && (
                        <span className={styles.current}>
                          Atualmente: {getPositionLabel(currentPosition)}
                        </span>
                      )}

                      <select
                        className={styles.select}
                        defaultValue=""
                        disabled={savingPosition !== null}
                        onChange={event => {
                          const position = Number(event.target.value);

                          if (!position) {
                            return;
                          }

                          assignStore(position, store.id);

                          event.target.value = "";
                        }}
                      >
                        <option value="">Atribuir à posição...</option>

                        {Array.from({ length: 10 }, (_, index) => {
                          const position = index + 1;

                          const occupied = positions.find(
                            item =>
                              item.position === position &&
                              item.store !== null &&
                              item.store?.id !== store.id,
                          );

                          return (
                            <option key={position} value={position}>
                              {getPositionLabel(position)}{" "}
                              {occupied
                                ? "— substituir loja"
                                : "— disponível"}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!searchingStores && search.trim() && stores.length === 0 && (
            <div className={styles.noResults}>
              Nenhuma loja elegível encontrada.
            </div>
          )}
        </PanelSection>

        {/* NOTAS */}

        <PanelSection
          title="Notas importantes"
          description="Como funcionam as posições, as lojas e os leilões."
          icon={<Info size={20} strokeWidth={1.9} />}
          storageKey="rankingAdmin:notes"
          defaultOpen={false}
        >
          <div className={styles.notes}>
            <div className={styles.note}>
              <AlertTriangle size={16} />
              Remover uma loja do ranking não remove a posição nem o
              leilão associado. A posição continua disponível para uma
              nova atribuição.
            </div>

            <div className={styles.note}>
              <AlertTriangle size={16} />
              O leilão e a atribuição da banca são operações
              independentes. Criar ou editar um leilão não atribui
              automaticamente nenhuma banca à posição.
            </div>
          </div>
        </PanelSection>
      </div>

      {/* MODAL DO LEILÃO */}

      {auctionModalOpen && auctionPosition !== null && (
        <div
          className={styles.overlay}
          onClick={event => {
            if (event.target === event.currentTarget) {
              closeAuctionModal();
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={editingAuction ? "Editar leilão" : "Criar leilão"}
          >
            <div className={styles.modalHead}>
              <div>
                <span className={styles.eyebrow}>
                  <Gavel size={13} />
                  RANKING NACIONAL
                </span>

                <h2>{editingAuction ? "Editar leilão" : "Criar leilão"}</h2>

                <p>
                  Posição{" "}
                  <strong>
                    {getPositionLabel(auctionPosition)} #{auctionPosition}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                className={styles.close}
                onClick={closeAuctionModal}
                disabled={savingAuction}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalNote}>
              <Info size={16} />

              <span>
                Este leilão representa apenas a disputa pela posição #
                {auctionPosition}. O vencedor não é colocado
                automaticamente no ranking.
              </span>
            </div>

            <form className={styles.form} onSubmit={saveAuction}>
              <label className={styles.field}>
                Nome do leilão
                <input
                  className={styles.input}
                  type="text"
                  value={auctionForm.name}
                  onChange={event =>
                    updateAuctionField("name", event.target.value)
                  }
                  placeholder="Ex.: Leilão da posição #1"
                  required
                />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  Preço inicial (MT)
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={auctionForm.startPrice}
                    onChange={event =>
                      updateAuctionField("startPrice", event.target.value)
                    }
                    placeholder="Ex.: 50000"
                    required
                  />
                </label>

                <label className={styles.field}>
                  Incremento mínimo (MT)
                  <input
                    className={styles.input}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={auctionForm.minimumIncrement}
                    onChange={event =>
                      updateAuctionField(
                        "minimumIncrement",
                        event.target.value,
                      )
                    }
                    placeholder="Ex.: 5000"
                    required
                  />
                </label>
              </div>

              <label className={styles.field}>
                Preço de reserva (MT)
                <small>Opcional</small>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={auctionForm.reservePrice}
                  onChange={event =>
                    updateAuctionField("reservePrice", event.target.value)
                  }
                  placeholder="Ex.: 80000"
                />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  Início do leilão
                  <input
                    className={styles.input}
                    type="datetime-local"
                    value={auctionForm.startsAt}
                    min={now}
                    onChange={event =>
                      updateAuctionField("startsAt", event.target.value)
                    }
                    required
                  />
                </label>

                <label className={styles.field}>
                  Término do leilão
                  <input
                    className={styles.input}
                    type="datetime-local"
                    value={auctionForm.endsAt}
                    min={auctionForm.startsAt || now}
                    onChange={event =>
                      updateAuctionField("endsAt", event.target.value)
                    }
                    required
                  />
                </label>
              </div>

              {editingAuction?.imageUrl && (
                <div className={styles.field}>
                  Imagem atual

                  <img
                    className={styles.currentImage}
                    src={editingAuction.imageUrl}
                    alt="Imagem atual do leilão"
                  />

                  <small>
                    Se escolher uma nova imagem abaixo, ela substitui esta.
                  </small>
                </div>
              )}

              <div className={styles.field}>
                {editingAuction ? "Substituir imagem" : "Imagem do leilão"}

                <ProductImageUploader onFilesSelected={addAuctionFiles} />

                {auctionImages.length > 0 && (
                  <ProductImagePreview
                    images={auctionImages}
                    onRemove={removeAuctionImage}
                    onSetCover={setAuctionCover}
                  />
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={closeAuctionModal}
                  disabled={savingAuction}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={savingAuction}
                >
                  {savingAuction
                    ? "A guardar..."
                    : editingAuction
                      ? "Guardar alterações"
                      : "Criar leilão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}