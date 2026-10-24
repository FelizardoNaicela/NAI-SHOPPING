import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Megaphone,
  Package,
  PackagePlus,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

import { api } from "../services/api";

import {
  listProducts,
  listStoreDiscounts,
  createDiscount,
  activateDiscount,
  pauseDiscount,
  cancelDiscount,
} from "../services/products";

import styles from "./StorePanelPage.module.css";
import FloatingDrawers from "../components/drawer/FloatingDrawers";
import { type PaymentMethod } from "./pagamentos/PaymentMethodSelector";
import VerificationPaymentModal from "../components/panel/VerificationPaymentModal";

import PanelSection, {
  QuickAction,
  QuickActionGrid,
} from "../components/panel/PanelSection";

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  type?: "NORMAL" | "AUCTION";
  stock?: number;
};

type Discount = {
  id: string;
  name?: string | null;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  status?: string;
  productIds?: string[];
  products?: Product[];
};

type DiscountForm = {
  name: string;
  discountPercent: string;
  startsAt: string;
  endsAt: string;
};

// =========================================================
// VERIFICAÇÃO
// =========================================================

type VerificationType =
  | "BASIC"
  | "PREMIUM";

type VerificationRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

type VerificationRequest = {
  id: string;
  storeId: string;
  requestedType: VerificationType;
  status: VerificationRequestStatus;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
};

// =========================================================
// PAGAMENTOS DE VERIFICAÇÃO
// =========================================================

type VerificationPaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

type VerificationProcessStatus =
  | "PENDING_REVIEW"
  | "REJECTED"
  | "CANCELLED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "COMPLETED";

type VerificationPayment = {
  id: string;
  type: string;
  status: VerificationPaymentStatus;
  amount: number;
  currency: string;
  description?: string | null;
  reference?: string | null;
  provider?: string | null;
  paidAt?: string | null;
  createdAt: string;
  metadata?: unknown;

  verificationRequestId?: string | null;
  storeId?: string | null;
};

type VerificationStatusResponse = {
  request: {
    id: string;
    status: VerificationRequestStatus;
    requestedType: VerificationType;
    rejectionReason?: string | null;
    createdAt: string;
    reviewedAt?: string | null;
  };

  store: {
    id: string;
    name: string;
    ownerId: string;
    verified: boolean;
    verificationType?: VerificationType | null;
    countryCode?: string | null;
    region?: string | null;
  };

  payment: VerificationPayment | null;

  verificationStatus: VerificationProcessStatus;

  isCompleted: boolean;
};

type VerificationPaymentsResponse = {
  payments: VerificationPayment[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function StorePanelPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const storeId = id as string;

  // =========================================================
  // ESTADO DA BANCA
  // =========================================================

  const [store, setStore] =
    useState<any | null>(null);

  // =========================================================
  // PRODUTOS
  // =========================================================

  const [products, setProducts] =
    useState<Product[]>([]);

  // =========================================================
  // DESCONTOS
  // =========================================================

  const [discounts, setDiscounts] =
    useState<Discount[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [productsLoading, setProductsLoading] =
    useState(false);

  const [discountsLoading, setDiscountsLoading] =
    useState(false);

  const [showCreateDiscount, setShowCreateDiscount] =
    useState(false);

  const [selectedProducts, setSelectedProducts] =
    useState<string[]>([]);

  const [productSearch, setProductSearch] =
    useState("");

  const [form, setForm] =
    useState<DiscountForm>({
      name: "",
      discountPercent: "",
      startsAt: "",
      endsAt: "",
    });

  const [saving, setSaving] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  // =========================================================
  // VERIFICAÇÃO
  // =========================================================

  const [
    verificationRequests,
    setVerificationRequests,
  ] = useState<VerificationRequest[]>([]);

  const [
    verificationLoading,
    setVerificationLoading,
  ] = useState(false);

  const [
    verificationActionLoading,
    setVerificationActionLoading,
  ] = useState(false);

  const [
    verificationError,
    setVerificationError,
  ] = useState("");

  // =========================================================
  // STATUS DETALHADO DOS PEDIDOS
  // =========================================================

  const [
    verificationStatuses,
    setVerificationStatuses,
  ] = useState<
    Record<string, VerificationStatusResponse>
  >({});

  const [
    verificationStatusLoading,
    setVerificationStatusLoading,
  ] = useState(false);

  const [
    verificationRefreshLoading,
    setVerificationRefreshLoading,
  ] = useState(false);

  // =========================================================
  // PAGAMENTOS DE VERIFICAÇÃO
  // =========================================================

  const [
    verificationPayments,
    setVerificationPayments,
  ] = useState<VerificationPayment[]>([]);

  const [
    verificationPaymentsLoading,
    setVerificationPaymentsLoading,
  ] = useState(false);

  const [
  verificationPaymentMethod,
  setVerificationPaymentMethod,
] = useState<PaymentMethod>("MOCK");

const [
  verificationPaymentModalOpen,
  setVerificationPaymentModalOpen,
] = useState(false);

  // =========================================================
  // HISTÓRICO
  // =========================================================

  const [
    verificationHistoryExpanded,
    setVerificationHistoryExpanded,
  ] = useState(false);

  // =========================================================
  // CARREGAR BANCA
  // =========================================================

  async function loadStore() {
    if (!storeId) return;

    try {
      setLoading(true);

      const res =
        await api.get(
          `/stores/${storeId}/page`,
        );

      setStore(res.data);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!storeId) return;

    loadStore();
  }, [storeId]);

  // =========================================================
  // CARREGAR PRODUTOS
  // =========================================================

  async function loadProducts() {
    if (!storeId) return;

    try {
      setProductsLoading(true);

      const result =
        await listProducts({
          storeId,
          limit: 100,
          sort: "recent",
        });

      setProducts(
        Array.isArray(result?.items)
          ? result.items
          : [],
      );
    } catch (error) {


      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }

  // =========================================================
  // CARREGAR DESCONTOS
  // =========================================================

  async function loadDiscounts() {
    if (!storeId) return;

    try {
      setDiscountsLoading(true);

      const result =
        await listStoreDiscounts(
          storeId,
        );

      const list =
        Array.isArray(result)
          ? result
          : Array.isArray(result?.items)
          ? result.items
          : [];

      setDiscounts(list);
    } catch (error) {


      setDiscounts([]);
    } finally {
      setDiscountsLoading(false);
    }
  }

  useEffect(() => {
    if (!storeId) return;

    loadProducts();
    loadDiscounts();
  }, [storeId]);

  // =========================================================
  // CARREGAR STATUS DETALHADO
  // =========================================================
  //
  // Esta função consulta:
  //
  // GET /verification/:requestId/status
  //
  // para cada pedido.
  //
  // É ela que nos diz se o pedido está:
  //
  // PENDING_REVIEW
  // AWAITING_PAYMENT
  // PAYMENT_CONFIRMED
  // COMPLETED
  // REJECTED
  // CANCELLED
  //
  // =========================================================

  async function loadVerificationStatuses(
    requests: VerificationRequest[],
  ) {
    if (!requests.length) {
      setVerificationStatuses({});
      return;
    }

    setVerificationStatusLoading(true);

    try {
      const entries =
        await Promise.all(
          requests.map(
            async request => {
              try {
                const response =
                  await api.get(
                    `/verification/${request.id}/status`,
                  );

                return [
                  request.id,
                  response.data as VerificationStatusResponse,
                ] as const;
              } catch (error) {

                return null;
              }
            },
          ),
        );

      const nextStatuses: Record<
        string,
        VerificationStatusResponse
      > = {};

      for (const entry of entries) {
        if (!entry) continue;

        const [
          requestId,
          status,
        ] = entry;

        nextStatuses[
          requestId
        ] = status;
      }

      setVerificationStatuses(
        nextStatuses,
      );
    } finally {
      setVerificationStatusLoading(
        false,
      );
    }
  }

  // =========================================================
  // CARREGAR PEDIDOS DE VERIFICAÇÃO
  // =========================================================

  async function loadVerificationRequests() {
    if (!storeId) return;

    try {
      setVerificationLoading(true);
      setVerificationError("");

      const res =
        await api.get(
          "/verification/my",
          {
            params: {
              storeId,
            },
          },
        );

      const data: VerificationRequest[] =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(
              res.data?.items,
            )
          ? res.data.items
          : [];

      setVerificationRequests(
        data,
      );

      await loadVerificationStatuses(
        data,
      );

      setVerificationHistoryExpanded(
        false,
      );
    } catch (error: any) {


      const message =
        error?.response?.data?.message;

      setVerificationError(
        Array.isArray(message)
          ? message.join("\n")
          : message ||
              "Não foi possível carregar os pedidos de verificação.",
      );

      setVerificationRequests(
        [],
      );

      setVerificationStatuses(
        {},
      );
    } finally {
      setVerificationLoading(
        false,
      );
    }
  }

  // =========================================================
  // CARREGAR PAGAMENTOS DE VERIFICAÇÃO
  // =========================================================

  async function loadVerificationPayments() {
    if (!storeId) return;

    try {
      setVerificationPaymentsLoading(
        true,
      );

      const res =
        await api.get<VerificationPaymentsResponse>(
          "/payments/mine",
          {
            params: {
              type: "VERIFICATION",
              limit: 100,
            },
          },
        );

      const payments =
        Array.isArray(
          res.data?.payments,
        )
          ? res.data.payments
          : [];

      const storePayments =
        payments.filter(
          payment =>
            payment.storeId ===
            storeId,
        );

      setVerificationPayments(
        storePayments,
      );
    } catch (error) {


      setVerificationPayments(
        [],
      );
    } finally {
      setVerificationPaymentsLoading(
        false,
      );
    }
  }

  // =========================================================
// ESCOLHER MÉTODO DE PAGAMENTO DA VERIFICAÇÃO
// =========================================================

function openVerificationPayment() {
  if (!pendingVerificationPayment) {
    setVerificationError(
      "A fatura de verificação ainda não está disponível.",
    );

    return;
  }

  setVerificationPaymentMethod("MOCK");

  setVerificationPaymentModalOpen(true);
}

  // =========================================================
  // CARREGAR TODA A INFORMAÇÃO DE VERIFICAÇÃO
  // =========================================================

  async function refreshVerificationData() {
    if (!storeId) return;

    try {
      setVerificationRefreshLoading(
        true,
      );

      setVerificationError("");

      // Atualiza o estado atual da banca
      await loadStore();

      // Atualiza pedidos + status detalhado
      await loadVerificationRequests();

      // Mantemos também o carregamento
      // dos pagamentos existentes.
      await loadVerificationPayments();
    } catch (error) {

      setVerificationError(
        "Não foi possível atualizar o pedido. Tente novamente.",
      );
    } finally {
      setVerificationRefreshLoading(
        false,
      );
    }
  }

  useEffect(() => {
    if (!storeId) return;

    loadVerificationRequests();
    loadVerificationPayments();
  }, [storeId]);

  // =========================================================
  // DADOS ATUAIS DA VERIFICAÇÃO
  // =========================================================

  const storeData =
    store?.store ??
    store;

  const currentVerificationType:
    | VerificationType
    | null =
    storeData?.verificationType ===
      "BASIC" ||
    storeData?.verificationType ===
      "PREMIUM"
      ? storeData.verificationType
      : null;

  const currentVerified =
    Boolean(
      storeData?.verified,
    );

  // =========================================================
  // PEDIDO REALMENTE PENDENTE
  // =========================================================
  //
  // Aqui NÃO usamos APPROVED.
  //
  // Um pedido APPROVED pode ser:
  //
  // 1. pagamento pendente
  // 2. pagamento confirmado
  // 3. verificação já concluída
  // 4. histórico de uma verificação que
  //    posteriormente foi revogada
  //
  // Portanto o que interessa para bloquear
  // novos pedidos é AWAITING_PAYMENT.
  //
  // =========================================================

  const pendingVerification =
    verificationRequests.find(
      request =>
        verificationStatuses[
          request.id
        ]?.verificationStatus ===
        "PENDING_REVIEW",
    ) ?? null;

  const pendingPaymentRequest =
    verificationRequests.find(
      request =>
        verificationStatuses[
          request.id
        ]?.verificationStatus ===
        "AWAITING_PAYMENT",
    ) ?? null;

  const pendingPaymentStatus =
    pendingPaymentRequest
      ? verificationStatuses[
          pendingPaymentRequest.id
        ]
      : null;

  const pendingVerificationPayment =
    pendingPaymentStatus?.payment ??
    null;

  const hasPendingVerificationPayment =
    Boolean(
      pendingPaymentRequest,
    );

  // =========================================================
  // PEDIDOS HISTÓRICOS
  // =========================================================

  const visibleVerificationRequests =
    verificationHistoryExpanded
      ? verificationRequests
      : verificationRequests.slice(
          0,
          1,
        );

  const hasMoreVerificationHistory =
    verificationRequests.length > 1;

  // =========================================================
  // PEDIR VERIFICAÇÃO
  // =========================================================

  async function requestVerification(
    type: VerificationType,
  ) {
    if (
      !storeId ||
      verificationActionLoading
    ) {
      return;
    }

    // -------------------------------------------------------
    // Existe análise pendente?
    // -------------------------------------------------------

    if (pendingVerification) {
      setVerificationError(
        "Já existe um pedido de verificação pendente para esta banca.",
      );

      return;
    }

    // -------------------------------------------------------
    // Existe pagamento pendente?
    // -------------------------------------------------------

    if (
      hasPendingVerificationPayment
    ) {
      setVerificationError(
        "Já existe um pedido de verificação aprovado aguardando a conclusão do pagamento.",
      );

      return;
    }

    // -------------------------------------------------------
    // Já possui essa verificação?
    // -------------------------------------------------------

    if (
      currentVerified &&
      currentVerificationType ===
        type
    ) {
      setVerificationError(
        `A sua banca já possui verificação ${verificationTypeLabel(
          type,
        )}.`,
      );

      return;
    }

    // -------------------------------------------------------
// Uma banca já verificada não pode voltar para Básica
// -------------------------------------------------------

if (
  type === "BASIC" &&
  currentVerified
) {
  setVerificationError(
    `A sua banca já possui verificação ${verificationTypeLabel(
      currentVerificationType!,
    )}. Não é possível solicitar uma nova verificação Básica enquanto existe uma verificação ativa.`,
  );

  return;
}

// -------------------------------------------------------
// Premium só pode ser solicitada por banca BASIC
// -------------------------------------------------------

if (
  type === "PREMIUM" &&
  (
    !currentVerified ||
    currentVerificationType !== "BASIC"
  )
) {
  setVerificationError(
    "A verificação Premium só pode ser solicitada quando a banca possui atualmente a verificação Básica.",
  );

  return;
}

    try {
      setVerificationActionLoading(
        true,
      );

      setVerificationError("");

      await api.post(
        "/verification/request",
        {
          storeId,
          requestedType: type,
        },
      );

      await loadVerificationRequests();

      await loadVerificationPayments();

      await loadStore();
    } catch (error: any) {

      const message =
        error?.response?.data?.message;

      setVerificationError(
        Array.isArray(message)
          ? message.join("\n")
          : message ||
              "Não foi possível enviar o pedido de verificação.",
      );
    } finally {
      setVerificationActionLoading(
        false,
      );
    }
  }

  // =========================================================
  // CANCELAR PEDIDO
  // =========================================================

  async function cancelVerificationRequest(
    requestId: string,
  ) {
    if (
      !requestId ||
      verificationActionLoading
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Tem certeza que deseja cancelar este pedido de verificação?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setVerificationActionLoading(
        true,
      );

      setVerificationError("");

      await api.patch(
        `/verification/requests/${requestId}/cancel`,
      );

      await loadVerificationRequests();

      await loadVerificationPayments();
    } catch (error: any) {


      const message =
        error?.response?.data?.message;

      setVerificationError(
        Array.isArray(message)
          ? message.join("\n")
          : message ||
              "Não foi possível cancelar o pedido de verificação.",
      );
    } finally {
      setVerificationActionLoading(
        false,
      );
    }
  }

  // =========================================================
  // LABELS DA VERIFICAÇÃO
  // =========================================================

  function verificationTypeLabel(
    type: VerificationType,
  ) {
    switch (type) {
      case "BASIC":
        return "Básica";

      case "PREMIUM":
        return "Premium";

      default:
        return type;
    }
  }

  function verificationStatusLabel(
  status: VerificationRequestStatus,
  request?: VerificationRequest,
) {
  switch (status) {
    case "PENDING":
      return "Pendente";

    case "APPROVED":
      return "Aprovado";

    case "REJECTED":
      if (
        request?.rejectionReason
          ?.toLowerCase()
          .includes("revog")
      ) {
        return "Revogado";
      }

      return "Rejeitado";

    case "CANCELLED":
      return "Cancelado";

    default:
      return status;
  }
}

  function verificationPaymentStatusLabel(
    status: VerificationPaymentStatus,
  ) {
    switch (status) {
      case "PENDING":
        return "Pagamento pendente";

      case "PAID":
        return "Pagamento confirmado";

      case "FAILED":
        return "Pagamento falhou";

      case "CANCELLED":
        return "Pagamento cancelado";

      case "REFUNDED":
        return "Pagamento reembolsado";

      default:
        return status;
    }
  }

  function verificationProcessStatusLabel(
    status: VerificationProcessStatus,
  ) {
    switch (status) {
      case "PENDING_REVIEW":
        return "Em análise";

      case "AWAITING_PAYMENT":
        return "Aguardando pagamento";

      case "PAYMENT_CONFIRMED":
        return "Pagamento confirmado";

      case "COMPLETED":
        return "Concluído";

      case "REJECTED":
        return "Rejeitado";

      case "CANCELLED":
        return "Cancelado";

      default:
        return status;
    }
  }

  function formatVerificationPaymentAmount(
    amount: number,
    currency: string,
  ) {
    return `${amount.toLocaleString(
      "pt-MZ",
    )} ${currency}`;
  }

  function verificationStatusClass(
  status: VerificationRequestStatus,
  request?: VerificationRequest,
) {
  switch (status) {
    case "PENDING":
      return styles.verificationStatusPending;

    case "APPROVED":
      return styles.verificationStatusApproved;

    case "REJECTED":
      if (
        request?.rejectionReason
          ?.toLowerCase()
          .includes("revog")
      ) {
        return styles.verificationStatusCancelled;
      }

      return styles.verificationStatusRejected;

    case "CANCELLED":
      return styles.verificationStatusCancelled;

    default:
      return "";
  }
}

  function formatVerificationDate(
    value?: string | null,
  ) {
    if (!value) {
      return "—";
    }

    return new Date(
      value,
    ).toLocaleString(
      "pt-MZ",
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    );
  }

  // =========================================================
  // PRODUTOS NORMAIS
  // =========================================================

  const normalProducts =
    useMemo(() => {
      return products.filter(
        product =>
          product.type !==
          "AUCTION",
      );
    }, [products]);

  // =========================================================
  // PESQUISA
  // =========================================================

  const filteredProducts =
    useMemo(() => {
      const search =
        productSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return normalProducts;
      }

      return normalProducts.filter(
        product =>
          product.name
            .toLowerCase()
            .includes(search),
      );
    }, [
      normalProducts,
      productSearch,
    ]);

  // =========================================================
  // SELEÇÃO
  // =========================================================

  function toggleProduct(
    productId: string,
  ) {
    setSelectedProducts(prev => {
      if (
        prev.includes(productId)
      ) {
        return prev.filter(
          id => id !== productId,
        );
      }

      return [
        ...prev,
        productId,
      ];
    });
  }

  function selectAllVisible() {
    const visibleIds =
      filteredProducts.map(
        product => product.id,
      );

    setSelectedProducts(prev => {
      const set = new Set(prev);

      visibleIds.forEach(id =>
        set.add(id),
      );

      return Array.from(set);
    });
  }

  function clearSelection() {
    setSelectedProducts([]);
  }

  // =========================================================
  // CRIAR DESCONTO
  // =========================================================

  async function handleCreateDiscount(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!storeId) return;

    const percent =
      Number(
        form.discountPercent,
      );

    if (
      !Number.isFinite(percent) ||
      percent <= 0 ||
      percent >= 100
    ) {
      alert(
        "O desconto deve estar entre 1% e 99%.",
      );

      return;
    }

    if (
      !form.startsAt ||
      !form.endsAt
    ) {
      alert(
        "Escolha a data de início e fim.",
      );

      return;
    }

    if (
      new Date(form.endsAt) <=
      new Date(form.startsAt)
    ) {
      alert(
        "A data de término deve ser posterior à data de início.",
      );

      return;
    }

    if (
      !selectedProducts.length
    ) {
      alert(
        "Selecione pelo menos um produto.",
      );

      return;
    }

    try {
      setSaving(true);

      await createDiscount({
        storeId,
        name:
          form.name.trim() ||
          undefined,
        discountPercent:
          percent,
        startsAt:
          form.startsAt,
        endsAt:
          form.endsAt,
        productIds:
          selectedProducts,
      });

      alert(
        "Desconto criado com sucesso.",
      );

      setShowCreateDiscount(
        false,
      );

      setSelectedProducts([]);

      setProductSearch("");

      setForm({
        name: "",
        discountPercent: "",
        startsAt: "",
        endsAt: "",
      });

      await loadDiscounts();
    } catch (error: any) {

      const message =
        error?.response?.data?.message;

      alert(
        Array.isArray(message)
          ? message.join("\n")
          : message ||
              "Não foi possível criar o desconto.",
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // AÇÕES DOS DESCONTOS
  // =========================================================

  async function handleDiscountAction(
    discountId: string,
    action:
      | "activate"
      | "pause"
      | "cancel",
  ) {
    try {
      setActionId(discountId);

      if (
        action ===
        "activate"
      ) {
        await activateDiscount(
          discountId,
        );
      }

      if (
        action ===
        "pause"
      ) {
        await pauseDiscount(
          discountId,
        );
      }

      if (
        action ===
        "cancel"
      ) {
        const confirmed =
          window.confirm(
            "Tem certeza que deseja cancelar este desconto?",
          );

        if (!confirmed) {
          return;
        }

        await cancelDiscount(
          discountId,
        );
      }

      await loadDiscounts();
    } catch (error: any) {

      const message =
        error?.response?.data?.message;

      alert(
        Array.isArray(message)
          ? message.join("\n")
          : message ||
              "Não foi possível alterar o desconto.",
      );
    } finally {
      setActionId(null);
    }
  }

  // =========================================================
  // DATA
  // =========================================================

  function formatDate(
    value: string,
  ) {
    if (!value) return "—";

    return new Date(
      value,
    ).toLocaleString(
      "pt-PT",
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    );
  }

  function getDiscountStatus(
    discount: Discount,
  ) {
    const now = new Date();

    const starts =
      new Date(
        discount.startsAt,
      );

    const ends =
      new Date(
        discount.endsAt,
      );

    if (
      discount.status ===
      "CANCELLED"
    ) {
      return "CANCELLED";
    }

    if (
      discount.status ===
      "PAUSED"
    ) {
      return "PAUSED";
    }

    if (ends <= now) {
      return "EXPIRED";
    }

    if (
      discount.status ===
        "DRAFT" ||
      discount.status ===
        "PENDING"
    ) {
      return "PENDING";
    }

    if (
      discount.status ===
      "ACTIVE"
    ) {
      return "ACTIVE";
    }

    if (now < starts) {
      return "PENDING";
    }

    return "ACTIVE";
  }

  function statusLabel(
    status: string,
  ) {
    switch (status) {
      case "ACTIVE":
        return "Ativo";

      case "PAUSED":
        return "Pausado";

      case "CANCELLED":
        return "Cancelado";

      case "PENDING":
        return "Agendado";

      case "EXPIRED":
        return "Expirado";

      default:
        return status;
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className={
          styles.loading
        }
      >
        <p>
          Carregando painel...
        </p>
      </div>
    );
  }

  if (
    !store ||
    store.viewer?.isOwner ===
      false
  ) {
    return (
      <div
        className={
          styles.denied
        }
      >
        <h2>
          Acesso não permitido
        </h2>

        <p>
          Apenas o proprietário
          da banca pode acessar
          este painel.
        </p>

        <button
          onClick={() =>
            navigate(
              `/stores/${storeId}`,
            )
          }
        >
          <ArrowLeft
            size={17}
            strokeWidth={2}
          />

          Voltar para a banca
        </button>
      </div>
    );
  }

  const activeCount =
    discounts.filter(
      discount =>
        getDiscountStatus(
          discount,
        ) === "ACTIVE",
    ).length;

  return (
    <div
      className={
        styles.page
      }
    >
      <FloatingDrawers />

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header
        className={
          styles.header
        }
      >
        <div>
          <button
            className={
              styles.backButton
            }
            onClick={() =>
              navigate(
                `/stores/${storeId}`,
              )
            }
          >
            <ArrowLeft
              size={17}
              strokeWidth={2}
            />

            Voltar
          </button>

          <h1>
            Painel da banca
          </h1>

          <p>
            {store.store?.name ||
              store.name ||
              "Minha banca"}
          </p>
        </div>
      </header>

      {/* ================================================= */}
      {/* AÇÕES RÁPIDAS */}
      {/* ================================================= */}

      <PanelSection
  title="Ações rápidas"
  description="Gerencie os principais recursos da sua banca."
  icon={<Settings size={20} strokeWidth={1.9} />}
  storageKey={`storePanel:${storeId}:quick`}
>
  <QuickActionGrid>
    <QuickAction
      icon={<PackagePlus size={21} strokeWidth={2} />}
      title="Novo produto"
      description="Adicionar produto à banca"
      onClick={() => navigate(`/stores/${storeId}/products/new`)}
    />

    <QuickAction
      highlight
      icon={<Megaphone size={21} strokeWidth={2} />}
      title="Promover produtos"
      description="Aumentar a visibilidade"
      onClick={() => navigate(`/stores/${storeId}/promote`)}
    />

    <QuickAction
      icon={<ArrowLeft size={21} strokeWidth={2} />}
      title="Ver minha banca"
      description="Voltar para a página pública"
      onClick={() => navigate(`/stores/${storeId}`)}
    />
  </QuickActionGrid>
</PanelSection>

      {/* ================================================= */}
      {/* STATS */}
      {/* ================================================= */}

      <section
        className={
          styles.stats
        }
      >
        <div
          className={
            styles.statCard
          }
        >
          <span>
            Produtos
          </span>

          <strong>
            {
              normalProducts.length
            }
          </strong>
        </div>

        <div
          className={
            styles.statCard
          }
        >
          <span>
            Descontos
          </span>

          <strong>
            {discounts.length}
          </strong>
        </div>

        <div
          className={
            styles.statCard
          }
        >
          <span>
            Descontos ativos
          </span>

          <strong>
            {activeCount}
          </strong>
        </div>
      </section>

      {/* ================================================= */}
      {/* VERIFICAÇÃO */}
      {/* ================================================= */}
        <PanelSection
  title="Verificação"
  description="Solicite a verificação da sua banca e acompanhe o estado dos seus pedidos."
  icon={<ShieldCheck size={20} strokeWidth={1.9} />}
  storageKey={`storePanel:${storeId}:verification`}
  summary={
    <span
      className={`${styles.verificationBadge} ${
        currentVerificationType === "PREMIUM"
          ? styles.verificationBadgePremium
          : currentVerificationType === "BASIC"
          ? styles.verificationBadgeBasic
          : styles.verificationBadgeNone
      }`}
    >
      {currentVerified && currentVerificationType
        ? verificationTypeLabel(currentVerificationType)
        : "Não verificada"}
    </span>
  }
  actions={
    <button
      type="button"
      className={styles.secondaryButton}
      disabled={verificationRefreshLoading || verificationStatusLoading}
      onClick={refreshVerificationData}
    >
      {verificationRefreshLoading ? "A atualizar..." : "Atualizar pedido"}
    </button>
  }
>
  {/* tudo o que estava depois do sectionHeader fica aqui, sem alterações:
      ESTADO ATUAL, PEDIDO EM ANÁLISE, PAGAMENTO PENDENTE,
      PAGAMENTO CONFIRMADO, ERRO, AÇÕES, texto de ajuda e HISTÓRICO */}


        {/* ESTADO ATUAL */}

        <div
          className={
            styles.verificationCurrent
          }
        >
          <div
            className={
              styles.verificationCurrentInfo
            }
          >
            <strong
              className={
                styles.verificationCurrentTitle
              }
            >
              Estado atual
            </strong>

            <span
              className={
                styles.verificationCurrentDescription
              }
            >
              {currentVerified &&
              currentVerificationType
                ? `A sua banca possui verificação ${verificationTypeLabel(
                    currentVerificationType,
                  )}.`
                : "A sua banca ainda não possui uma verificação."}
            </span>
          </div>

          <span
            className={`${styles.verificationBadge} ${
              currentVerificationType ===
              "PREMIUM"
                ? styles.verificationBadgePremium
                : currentVerificationType ===
                  "BASIC"
                ? styles.verificationBadgeBasic
                : styles.verificationBadgeNone
            }`}
          >
            {currentVerified &&
            currentVerificationType
              ? verificationTypeLabel(
                  currentVerificationType,
                )
              : "Não verificada"}
          </span>
        </div>

        {/* ================================================= */}
        {/* PEDIDO EM ANÁLISE */}
        {/* ================================================= */}

        {pendingVerification && (
          <div
            className={
              styles.verificationNotice
            }
          >
            <div>
              <strong>
                Pedido pendente
              </strong>

              <span>
                O seu pedido de
                verificação{" "}
                <strong>
                  {verificationTypeLabel(
                    pendingVerification.requestedType,
                  )}
                </strong>{" "}
                está a ser analisado pelos
                administradores.
              </span>
            </div>

            <button
              type="button"
              className={
    styles.secondaryButton
  }
              disabled={
                verificationActionLoading
              }
              onClick={() =>
                cancelVerificationRequest(
                  pendingVerification.id,
                )
              }
            >
              {verificationActionLoading
                ? "A cancelar..."
                : "Cancelar pedido"}
            </button>
          </div>
        )}

        {/* ================================================= */}
        {/* PAGAMENTO PENDENTE */}
        {/* ================================================= */}

        {!pendingVerification &&
          pendingPaymentRequest && (
            <div
              className={
                styles.verificationNotice
              }
            >
              <div>
                <strong>
                  Pedido aprovado
                </strong>

                <span>
                  A sua solicitação de
                  verificação{" "}
                  <strong>
                    {verificationTypeLabel(
                      pendingPaymentRequest.requestedType,
                    )}
                  </strong>{" "}
                  foi aprovada. O próximo passo
                  é concluir o pagamento.
                </span>

                {verificationPaymentsLoading ||
                verificationStatusLoading ? (
                  <span>
                    A carregar informações do
                    pagamento...
                  </span>
                ) : !pendingVerificationPayment ? (
                  <span>
                    O pagamento ainda não foi
                    disponibilizado. Clique em
                    "Atualizar pedido" para
                    consultar novamente.
                  </span>
                ) : (
                  <div
                    className={
                      styles.verificationReason
                    }
                    style={{
                      marginTop: 12,
                    }}
                  >
                    <span>
                      <strong>
                        Estado do pagamento:
                      </strong>{" "}
                      {verificationPaymentStatusLabel(
                        pendingVerificationPayment.status,
                      )}
                    </span>

                    <span>
                      <strong>
                        Valor:
                      </strong>{" "}
                      {formatVerificationPaymentAmount(
                        pendingVerificationPayment.amount,
                        pendingVerificationPayment.currency,
                      )}
                    </span>

                    <span>
                      <strong>
                        Referência:
                      </strong>{" "}
                      <span
                        style={{
                          fontFamily:
                            "monospace",
                          fontWeight: 700,
                          wordBreak:
                            "break-all",
                        }}
                      >
                        {pendingVerificationPayment.reference ||
                          "A aguardar referência"}
                      </span>
                    </span>

                    <span>
                      <strong>
                        Provedor:
                      </strong>{" "}
                      {pendingVerificationPayment.provider ||
                        "—"}
                    </span>

                    <span>
                      Utilize a referência acima
                      para concluir o pagamento.
                    </span>

                    <button
  type="button"
  className={styles.primaryButton}
  style={{
    marginTop: 12,
    alignSelf: "flex-start",
  }}
  disabled={
    pendingVerificationPayment.status ===
    "PAID"
  }
  onClick={
    openVerificationPayment
  }
>
  {pendingVerificationPayment.status ===
  "PAID"
    ? "Pagamento confirmado"
    : "Pagar verificação"}
</button>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ================================================= */}
        {/* PAGAMENTO CONFIRMADO / HISTÓRICO */}
        {/* ================================================= */}

        {!pendingVerification &&
          !pendingPaymentRequest &&
          verificationRequests.some(
            request =>
              verificationStatuses[
                request.id
              ]?.verificationStatus ===
              "PAYMENT_CONFIRMED",
          ) &&
          !currentVerified && (
            <div
              className={
                styles.verificationNotice
              }
            >
              <div>
                <strong>
                  Pagamento confirmado
                </strong>

                <span>
                  Existe um pedido anterior cujo
                  pagamento já foi confirmado.
                  Atualmente a banca está sem
                  verificação ativa.
                </span>

                <span>
                  Esse pedido histórico não
                  bloqueia uma nova solicitação.
                </span>
              </div>
            </div>
          )}

        {/* ================================================= */}
        {/* ERRO */}
        {/* ================================================= */}

        {verificationError && (
          <div
            className={
              styles.verificationError
            }
          >
            {verificationError}
          </div>
        )}

        {/* ================================================= */}
        {/* AÇÕES */}
        {/* ================================================= */}

        <div
          className={
            styles.verificationActions
          }
        >
          <button
  type="button"
  className={
    styles.primaryButton
  }
  disabled={
    verificationActionLoading ||
    verificationLoading ||
    Boolean(
      pendingVerification,
    ) ||
    hasPendingVerificationPayment ||
    currentVerified
  }
  onClick={() =>
    requestVerification(
      "BASIC",
    )
  }
>
  {verificationActionLoading
    ? "Aguarde..."
    : "Solicitar Básica"}
</button>

          <button
  type="button"
  className={
    styles.secondaryButton
  }
  disabled={
    verificationActionLoading ||
    verificationLoading ||
    Boolean(
      pendingVerification,
    ) ||
    hasPendingVerificationPayment ||
    !(
      currentVerified &&
      currentVerificationType ===
        "BASIC"
    )
  }
  onClick={() =>
    requestVerification(
      "PREMIUM",
    )
  }
>
  {verificationActionLoading
    ? "Aguarde..."
    : "Solicitar Premium"}
</button>
        </div>

        <p
          className={
            styles.verificationHelp
          }
        >
          A verificação Básica pode
          ser analisada pelos
          administradores autorizados
          da região. A verificação
          Premium requer aprovação
          do Super Admin.
        </p>

        {/* ================================================= */}
        {/* HISTÓRICO */}
        {/* ================================================= */}

        <div
          className={
            styles.verificationHistory
          }
        >
          <div>
            <h3>
              Histórico de pedidos
            </h3>
          </div>

          {verificationLoading ? (
            <div
              className={
                styles.verificationEmpty
              }
            >
              A carregar pedidos...
            </div>
          ) : verificationRequests.length ===
            0 ? (
            <div
              className={
                styles.verificationEmpty
              }
            >
              Ainda não existem
              pedidos de verificação.
            </div>
          ) : (
            <div
              className={
                styles.verificationHistoryList
              }
            >
              {visibleVerificationRequests.map(
                request => {
                  const status =
                    verificationStatuses[
                      request.id
                    ];

                  const payment =
                    status?.payment ??
                    verificationPayments.find(
                      item =>
                        item.verificationRequestId ===
                        request.id,
                    ) ??
                    null;

                  return (
                    <article
                      key={
                        request.id
                      }
                      className={
                        styles.verificationHistoryItem
                      }
                    >
                      <div
                        className={
                          styles.verificationHistoryTop
                        }
                      >
                        <div>
                          <strong>
                            Verificação{" "}
                            {verificationTypeLabel(
                              request.requestedType,
                            )}
                          </strong>

                          <span
                            className={`${styles.verificationStatus} ${verificationStatusClass(
  request.status,
  request,
)}`}
                          >
                            {verificationStatusLabel(
  request.status,
  request,
)}
                          </span>
                        </div>

                        <span
                          className={
                            styles.verificationHistoryMeta
                          }
                        >
                          {formatVerificationDate(
                            request.createdAt,
                          )}
                        </span>
                      </div>

                      {/* --------------------------------- */}
                      {/* STATUS DETALHADO */}
                      {/* --------------------------------- */}

                      {status && (
                        <div
                          className={
                            styles.verificationReason
                          }
                        >
                          <span>
                            <strong>
                              Estado do processo:
                            </strong>{" "}
                            {verificationProcessStatusLabel(
                              status.verificationStatus,
                            )}
                          </span>
                        </div>
                      )}

                      {/* --------------------------------- */}
                      {/* REJEITADO */}
                      {/* --------------------------------- */}

                      {request.status ===
                        "REJECTED" &&
                        request.rejectionReason && (
                          <div
                            className={
                              styles.verificationReason
                            }
                          >
                            <strong>
                              Motivo da rejeição:
                            </strong>

                            <span>
                              {
                                request.rejectionReason
                              }
                            </span>
                          </div>
                        )}

                      {/* --------------------------------- */}
                      {/* APROVADO */}
                      {/* --------------------------------- */}

                      {request.status ===
                        "APPROVED" && (
                        <div
                          className={
                            styles.verificationReason
                          }
                        >
                          <span>
                            {request.reviewedAt
                              ? `Aprovado em ${formatVerificationDate(
                                  request.reviewedAt,
                                )}.`
                              : "Pedido aprovado."}
                          </span>

                          {payment && (
                            <div
                              style={{
                                marginTop: 8,
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap: 4,
                              }}
                            >
                              <span>
                                <strong>
                                  Pagamento:
                                </strong>{" "}
                                {verificationPaymentStatusLabel(
                                  payment.status,
                                )}
                              </span>

                              <span>
                                <strong>
                                  Valor:
                                </strong>{" "}
                                {formatVerificationPaymentAmount(
                                  payment.amount,
                                  payment.currency,
                                )}
                              </span>

                              <span>
                                <strong>
                                  Referência:
                                </strong>{" "}
                                <span
                                  style={{
                                    fontFamily:
                                      "monospace",
                                    fontWeight: 700,
                                    wordBreak:
                                      "break-all",
                                  }}
                                >
                                  {payment.reference ||
                                    "—"}
                                </span>
                              </span>

                              <span>
                                <strong>
                                  Provedor:
                                </strong>{" "}
                                {payment.provider ||
                                  "—"}
                              </span>

                              {payment.paidAt && (
                                <span>
                                  <strong>
                                    Pago em:
                                  </strong>{" "}
                                  {formatVerificationDate(
                                    payment.paidAt,
                                  )}
                                </span>
                              )}
                            </div>
                          )}

                          {!payment && (
                            <span>
                              Informações de
                              pagamento ainda
                              não disponíveis.
                            </span>
                          )}
                        </div>
                      )}

                      {/* --------------------------------- */}
                      {/* CANCELADO */}
                      {/* --------------------------------- */}

                      {request.status ===
                        "CANCELLED" && (
                        <div
                          className={
                            styles.verificationReason
                          }
                        >
                          <span>
                            Este pedido foi
                            cancelado.
                          </span>
                        </div>
                      )}

                      {/* --------------------------------- */}
                      {/* PENDENTE */}
                      {/* --------------------------------- */}

                      {request.status ===
                        "PENDING" && (
                        <div
                          className={
                            styles.verificationHistoryActions
                          }
                        >
                          <button
                            type="button"
                            className={
    styles.secondaryButton
  }
                            disabled={
                              verificationActionLoading
                            }
                            onClick={() =>
                              cancelVerificationRequest(
                                request.id,
                              )
                            }
                          >
                            {verificationActionLoading
                              ? "A cancelar..."
                              : "Cancelar pedido"}
                          </button>
                        </div>
                      )}

                      {/* --------------------------------- */}
                      {/* REVOGAÇÃO */}
                      {/* --------------------------------- */}

                      {request.status ===
                        "REJECTED" &&
                        request.rejectionReason?.toLowerCase().includes(
                          "revog",
                        ) && (
                          <div
                            className={
                              styles.verificationReason
                            }
                          >
                            <span>
                              Esta entrada representa
                              uma revogação de uma
                              verificação anterior.
                            </span>
                          </div>
                        )}
                    </article>
                  );
                },
              )}
            </div>
          )}

          {hasMoreVerificationHistory && (
            <div
              className={
                styles.verificationHistoryControls
              }
            >
              <div
                className={
                  styles.verificationHistoryControlsInfo
                }
              >
                A mostrar{" "}
                <strong>
                  {
                    visibleVerificationRequests.length
                  }
                </strong>{" "}
                de{" "}
                <strong>
                  {verificationRequests.length}
                </strong>{" "}
                pedidos
              </div>

              <div
                className={
                  styles.verificationHistoryControlsButtons
                }
              >
                {verificationHistoryExpanded ? (
                  <button
                    type="button"
                    className={
                      styles.verificationHistoryCollapseButton
                    }
                    onClick={() =>
                      setVerificationHistoryExpanded(
                        false,
                      )
                    }
                  >
                    <ChevronUp
                      size={16}
                    />

                    Recolher
                  </button>
                ) : (
                  <button
                    type="button"
                    className={
                      styles.verificationHistoryExpandButton
                    }
                    onClick={() =>
                      setVerificationHistoryExpanded(
                        true,
                      )
                    }
                  >
                    <ChevronDown
                      size={16}
                    />

                    Expandir todos
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        </PanelSection>

      {/* ================================================= */}
      {/* DESCONTOS */}
      {/* ================================================= */}

        <PanelSection
  title="Descontos"
  description="Crie e gerencie promoções dos seus produtos."
  icon={<Percent size={20} strokeWidth={1.9} />}
  storageKey={`storePanel:${storeId}:discounts`}
  summary={`${activeCount} ativo${activeCount === 1 ? "" : "s"} · ${discounts.length} no total`}
  actions={
    <button
      className={styles.primaryButton}
      onClick={() => setShowCreateDiscount(true)}
    >
      + Criar desconto
    </button>
  }
>
  {/* o bloco {discountsLoading ? ... : discounts.length === 0 ? ... : (...)}
      fica exatamente igual */}


        {discountsLoading ? (
          <div
            className={
              styles.emptyState
            }
          >
            A carregar descontos...
          </div>
        ) : discounts.length ===
          0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <strong>
              Ainda não existem
              descontos
            </strong>

            <span>
              Crie a primeira
              promoção da sua banca.
            </span>
          </div>
        ) : (
          <div
            className={
              styles.discountList
            }
          >
            {discounts.map(
              discount => {
                const status =
                  getDiscountStatus(
                    discount,
                  );

                return (
                  <article
                    key={
                      discount.id
                    }
                    className={
                      styles.discountCard
                    }
                  >
                    <div
                      className={
                        styles.discountTop
                      }
                    >
                      <div>
                        <h3>
                          {discount.name ||
                            "Promoção"}
                        </h3>

                        <span
                          className={
                            `${styles.status} ${
                              styles[
                                `status${status}`
                              ] ||
                              ""
                            }`
                          }
                        >
                          {statusLabel(
                            status,
                          )}
                        </span>
                      </div>

                      <strong
                        className={
                          styles.percent
                        }
                      >
                        -
                        {
                          discount.discountPercent
                        }
                        %
                      </strong>
                    </div>

                    <div
                      className={
                        styles.discountInfo
                      }
                    >
                      <div>
                        <span>
                          Início
                        </span>

                        <strong>
                          {formatDate(
                            discount.startsAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Fim
                        </span>

                        <strong>
                          {formatDate(
                            discount.endsAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Produtos
                        </span>

                        <strong>
                          {discount.products
                            ?.length ??
                            discount
                              .productIds
                              ?.length ??
                            0}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.actions
                      }
                    >
                      {status ===
                        "PENDING" && (
                        <button
                          disabled={
                            actionId ===
                            discount.id
                          }
                          onClick={() =>
                            handleDiscountAction(
                              discount.id,
                              "activate",
                            )
                          }
                        >
                          Ativar
                        </button>
                      )}

                      {status ===
                        "ACTIVE" && (
                        <button
                          disabled={
                            actionId ===
                            discount.id
                          }
                          onClick={() =>
                            handleDiscountAction(
                              discount.id,
                              "pause",
                            )
                          }
                        >
                          Pausar
                        </button>
                      )}

                      {status ===
                        "PAUSED" && (
                        <button
                          disabled={
                            actionId ===
                            discount.id
                          }
                          onClick={() =>
                            handleDiscountAction(
                              discount.id,
                              "activate",
                            )
                          }
                        >
                          Retomar
                        </button>
                      )}

                      {status !==
                        "CANCELLED" &&
                        status !==
                          "EXPIRED" && (
                          <button
                            className={
                              styles.dangerButton
                            }
                            disabled={
                              actionId ===
                              discount.id
                            }
                            onClick={() =>
                              handleDiscountAction(
                                discount.id,
                                "cancel",
                              )
                            }
                          >
                            Cancelar
                          </button>
                        )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}

        </PanelSection>

      {/* ================================================= */}
      {/* MODAL DE DESCONTO */}
      {/* ================================================= */}

      {showCreateDiscount && (
        <div
          className={
            styles.modalOverlay
          }
          onClick={() =>
            !saving &&
            setShowCreateDiscount(
              false,
            )
          }
        >
          <div
            className={
              styles.modal
            }
            onClick={e =>
              e.stopPropagation()
            }
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <h2>
                  Criar desconto
                </h2>

                <p>
                  Escolha os produtos e
                  defina o período da
                  promoção.
                </p>
              </div>

              <button
                className={
                  styles.closeButton
                }
                disabled={saving}
                onClick={() =>
                  setShowCreateDiscount(
                    false,
                  )
                }
              >
                <X
                  size={20}
                  strokeWidth={2}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateDiscount
              }
            >
              <div
                className={
                  styles.formGrid
                }
              >
                <label>
                  <span>
                    Nome da promoção
                  </span>

                  <input
                    value={
                      form.name
                    }
                    onChange={e =>
                      setForm(
                        prev => ({
                          ...prev,
                          name:
                            e.target
                              .value,
                        }),
                      )
                    }
                    placeholder="Ex.: Promoção de fim de semana"
                  />
                </label>

                <label>
                  <span>
                    Desconto
                  </span>

                  <div
                    className={
                      styles.percentInput
                    }
                  >
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={
                        form.discountPercent
                      }
                      onChange={e =>
                        setForm(
                          prev => ({
                            ...prev,
                            discountPercent:
                              e.target
                                .value,
                          }),
                        )
                      }
                      placeholder="20"
                      required
                    />

                    <span>
                      %
                    </span>
                  </div>
                </label>

                <label>
                  <span>
                    Início
                  </span>

                  <input
                    type="datetime-local"
                    value={
                      form.startsAt
                    }
                    onChange={e =>
                      setForm(
                        prev => ({
                          ...prev,
                          startsAt:
                            e.target
                              .value,
                        }),
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    Fim
                  </span>

                  <input
                    type="datetime-local"
                    min={
                      form.startsAt ||
                      undefined
                    }
                    value={
                      form.endsAt
                    }
                    onChange={e =>
                      setForm(
                        prev => ({
                          ...prev,
                          endsAt:
                            e.target
                              .value,
                        }),
                      )
                    }
                    required
                  />
                </label>
              </div>

              {/* PRODUTOS */}

              <div
                className={
                  styles.productSelector
                }
              >
                <div
                  className={
                    styles.selectorHeader
                  }
                >
                  <div>
                    <h3>
                      Produtos
                    </h3>

                    <span>
                      {
                        selectedProducts.length
                      }{" "}
                      selecionado
                      {selectedProducts.length ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>

                  <div
                    className={
                      styles.selectorActions
                    }
                  >
                    <button
                      type="button"
                      onClick={
                        selectAllVisible
                      }
                    >
                      Selecionar todos
                    </button>

                    <button
                      type="button"
                      onClick={
                        clearSelection
                      }
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    position:
                      "relative",
                    marginBottom: 12,
                  }}
                >
                  <Search
                    size={17}
                    strokeWidth={2}
                    style={{
                      position:
                        "absolute",
                      left: 12,
                      top: "50%",
                      transform:
                        "translateY(-50%)",
                      color:
                        "var(--text-soft)",
                      pointerEvents:
                        "none",
                    }}
                  />

                  <input
                    className={
                      styles.searchInput
                    }
                    style={{
                      paddingLeft: 40,
                    }}
                    value={
                      productSearch
                    }
                    onChange={e =>
                      setProductSearch(
                        e.target.value,
                      )
                    }
                    placeholder="Pesquisar produto..."
                  />
                </div>

                {productsLoading ? (
                  <div
                    className={
                      styles.productsLoading
                    }
                  >
                    A carregar
                    produtos...
                  </div>
                ) : filteredProducts.length ===
                  0 ? (
                  <div
                    className={
                      styles.productsLoading
                    }
                  >
                    Nenhum produto
                    normal encontrado.
                  </div>
                ) : (
                  <div
                    className={
                      styles.productList
                    }
                  >
                    {filteredProducts.map(
                      product => {
                        const selected =
                          selectedProducts.includes(
                            product.id,
                          );

                        return (
                          <button
                            key={
                              product.id
                            }
                            type="button"
                            className={
                              `${styles.productItem} ${
                                selected
                                  ? styles.productSelected
                                  : ""
                              }`
                            }
                            onClick={() =>
                              toggleProduct(
                                product.id,
                              )
                            }
                          >
                            <div
                              className={
                                styles.checkbox
                              }
                            >
                              {selected ? (
                                <Check
                                  size={15}
                                  strokeWidth={2.5}
                                />
                              ) : null}
                            </div>

                            <div
                              className={
                                styles.productImage
                              }
                            >
                              {product.imageUrl ? (
                                <img
                                  src={
                                    product.imageUrl
                                  }
                                  alt={
                                    product.name
                                  }
                                />
                              ) : (
                                <Package
                                  size={25}
                                  strokeWidth={1.7}
                                />
                              )}
                            </div>

                            <div
                              className={
                                styles.productDetails
                              }
                            >
                              <strong>
                                {
                                  product.name
                                }
                              </strong>

                              <span>
                                {
                                  product.price
                                }{" "}
                                MT
                              </span>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>

              <div
                className={
                  styles.modalFooter
                }
              >
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  disabled={saving}
                  onClick={() =>
                    setShowCreateDiscount(
                      false,
                    )
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={
                    styles.primaryButton
                  }
                  disabled={
                    saving ||
                    selectedProducts.length ===
                      0
                  }
                >
                  {saving
                    ? "Criando..."
                    : "Criar desconto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
{/* MODAL DE PAGAMENTO DA VERIFICAÇÃO */}
{/* ================================================= */}

{pendingVerificationPayment && (
  <VerificationPaymentModal
    open={verificationPaymentModalOpen}
    onClose={() => setVerificationPaymentModalOpen(false)}
    verificationLabel={
      pendingPaymentRequest
        ? `Verificação ${verificationTypeLabel(
            pendingPaymentRequest.requestedType,
          )}`
        : "Verificação"
    }
    reference={pendingVerificationPayment.reference || ""}
    amount={formatVerificationPaymentAmount(
      pendingVerificationPayment.amount,
      pendingVerificationPayment.currency,
    )}
    method={verificationPaymentMethod}
    onMethodChange={setVerificationPaymentMethod}
    onContinue={() => setVerificationPaymentModalOpen(false)}
  />
)}
    </div>
  );
}