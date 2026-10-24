import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

import FloatingDrawers from "../components/drawer/FloatingDrawers";
import { api } from "../services/api";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  Flame,
  Trash2,
  Package,
  Pause,
  Play,
  RefreshCw,
  Search,
  Tag,
  XCircle,
  Pencil,
  Rocket,
  Store,
  Wallet,
} from "lucide-react";

import {
  activatePromotion,
  pausePromotion,
  cancelPromotion,
  getPromotionPackages,
  changePromotionPackage,
  deletePromotionHistoryItem,
  deleteAllPromotionHistory,
  createPromotionPayment,
  getPromotionPayment,
  type PromotionPayment,
} from "../services/promotions";

import SmartImage from "../components/SmartImage";

import { type PaymentMethod } from "./pagamentos/PaymentMethodSelector";
import VerificationPaymentModal from "../components/panel/VerificationPaymentModal";
import styles from "./PromotionHistoryPage.module.css";
type PromotionStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "EXPIRED"
  | "COMPLETED"
  | "CANCELLED";

type PromotionPlacement =
  | "FEED"
  | "SEARCH"
  | "CATEGORY";

type PromotionPackage = {
  id: string;
  impressions: number;
  price: number;
  isActive: boolean;
};

type PromotionProduct = {
  id: string;
  productId: string;
  order: number;

  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
};

type PromotionPlacementItem = {
  id: string;
  placement: PromotionPlacement;
};

type Promotion = {
  id: string;
  name: string;
  status: PromotionStatus;

  startsAt: string;
  endsAt: string;

  impressionLimit: number;
  impressionsUsed: number;

  priority: number;

  createdAt: string;
  updatedAt: string;

  package?: PromotionPackage | null;

  products: PromotionProduct[];

  placements: PromotionPlacementItem[];

  store: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    verified: boolean;
  };

  payments: PromotionPayment[];
};

const statusInfo: Record<
  PromotionStatus,
  {
    label: string;
    icon: React.ReactNode;
  }
> = {
  DRAFT: {
    label: "Em espera",
    icon: <Pencil size={15} />,
  },

  ACTIVE: {
    label: "Ativa",
    icon: <CheckCircle2 size={15} />,
  },

  PAUSED: {
    label: "Pausada",
    icon: <Pause size={15} />,
  },

  EXPIRED: {
    label: "Expirada",
    icon: <Clock3 size={15} />,
  },

  COMPLETED: {
    label: "Concluída",
    icon: <CheckCircle2 size={15} />,
  },

  CANCELLED: {
    label: "Cancelada",
    icon: <XCircle size={15} />,
  },
};

const placementInfo: Record<
  PromotionPlacement,
  {
    label: string;
    icon: ReactNode;
  }
> = {
  FEED: {
    label: "Feed",
    icon: <Flame size={15} />,
  },

  SEARCH: {
    label: "Pesquisa",
    icon: <Search size={15} />,
  },

  CATEGORY: {
    label: "Categorias",
    icon: <Tag size={15} />,
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-MZ").format(value);
}

function formatPrice(value: number) {
  return `${formatNumber(value)} MT`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getProgress(
  used: number,
  limit: number,
) {
  if (limit <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (used / limit) * 100,
    ),
  );
}

function hasTimeRemaining(
  promotion: Promotion,
) {
  const endsAt = new Date(
    promotion.endsAt,
  ).getTime();

  if (Number.isNaN(endsAt)) {
    return false;
  }

  return endsAt > Date.now();
}

function hasImpressionsRemaining(
  promotion: Promotion,
) {
  return (
    promotion.impressionsUsed <
    promotion.impressionLimit
  );
}

function getDisplayStatus(
  promotion: Promotion,
): PromotionStatus {
  if (
    promotion.status === "ACTIVE" &&
    !hasTimeRemaining(promotion)
  ) {
    return "EXPIRED";
  }

  if (
    promotion.status === "PAUSED" &&
    !hasTimeRemaining(promotion)
  ) {
    return "EXPIRED";
  }

  return promotion.status;
}

function canContinuePaused(
  promotion: Promotion,
) {
  return (
    promotion.status === "PAUSED" &&
    hasTimeRemaining(promotion) &&
    hasImpressionsRemaining(
      promotion,
    )
  );
}

export default function PromotionHistoryPage() {
  const navigate = useNavigate();

  const [promotions, setPromotions] =
    useState<Promotion[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

     const [promotionPackages, setPromotionPackages] =
    useState<PromotionPackage[]>([]);

  const [changingPackageId, setChangingPackageId] =
    useState<string | null>(null);

  const [selectingPackageId, setSelectingPackageId] =
    useState<string | null>(null);

    const [paymentMethod, setPaymentMethod] =
  useState<PaymentMethod>("MOCK");

  const [paymentPromotion, setPaymentPromotion] =
  useState<Promotion | null>(null);

const [paymentModalOpen, setPaymentModalOpen] =
  useState(false);

    const [activeTab, setActiveTab] = useState<
  "active" | "history"
>("active");

const [creatingPaymentId, setCreatingPaymentId] =
  useState<string | null>(null);

const [checkingPaymentId, setCheckingPaymentId] =
  useState<string | null>(null);

const [activeCheckout, setActiveCheckout] =
  useState<{
    promotionId: string;
    amount: number;
    currency: string;
    provider: string;
    reference: string;
    checkoutUrl?: string | null;
    instructions?: string | null;
    status: "PENDING" | "PAID" | "FAILED";
  } | null>(null);

  const [spent, setSpent] = useState<number | null>(null);

  async function loadPromotions() {
    try {
      setLoading(true);
      setError(null);

      const response =
        await api.get(
          "/promotions/mine",
        );

      setPromotions(
        Array.isArray(
          response.data,
        )
          ? response.data
          : [],
      );
    } catch (err) {


      setError(
        "Não foi possível carregar suas promoções.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPromotionPackages() {
  try {
    const data = await getPromotionPackages();

    const activePackages = Array.isArray(data)
      ? data.filter(
          (promotionPackage: PromotionPackage) =>
            promotionPackage &&
            promotionPackage.isActive !== false,
        )
      : [];

    setPromotionPackages(activePackages);
  } catch (err) {

  }
}

async function loadSpent() {
  try {
    const response = await api.get("/payments/mine/summary");

    setSpent(Number(response.data?.byType?.promotions) || 0);
  } catch (err) {
  }
}

function refreshAll() {
  loadPromotions();
  loadSpent();
}

function closePaymentModal() {
  setPaymentModalOpen(false);
  setPaymentPromotion(null);
}

  useEffect(() => {
  loadPromotions();
  loadPromotionPackages();
  loadSpent();
}, []);

  async function activateCampaign(
    promotion: Promotion,
  ) {
    try {
      setError(null);

      await activatePromotion(
        promotion.id,
      );

      await loadPromotions();
    } catch (err) {


      setError(
        "Não foi possível ativar a promoção.",
      );
    }
  }

  async function continuePausedCampaign(
    promotion: Promotion,
  ) {
    if (
      !canContinuePaused(
        promotion,
      )
    ) {
      setError(
        "Esta campanha já não pode ser continuada porque terminou ou atingiu o limite de impressões.",
      );

      return;
    }

    try {
      setError(null);

      await activatePromotion(
        promotion.id,
      );

      await loadPromotions();
    } catch (err) {


      setError(
        "Não foi possível continuar a campanha.",
      );
    }
  }

  async function reactivateWithNewPackage(
  promotion: Promotion,
  packageId: string,
) {
  if (!packageId) {
    return;
  }

  if (!canReactivate(promotion)) {
    setError(
      "Esta campanha não pode ser reativada.",
    );

    return;
  }

  try {
    setChangingPackageId(
      promotion.id,
    );

    setError(null);

    // Apenas contratar/trocar o pacote.
    // A campanha continuará em DRAFT.
    await changePromotionPackage(
      promotion.id,
      packageId,
    );

    setSelectingPackageId(null);

    await loadPromotions();
  } catch (error: any) {


  alert(
    error?.response?.data?.message ??
      "Erro ao escolher novo pacote.",
  );
} finally {
    setChangingPackageId(null);
  }
}

function canReactivate(
  promotion: Promotion,
) {
  const displayStatus =
    getDisplayStatus(promotion);

  return (
    (
      displayStatus === "EXPIRED" ||
      displayStatus === "COMPLETED"
    ) &&
    promotion.products.length > 0
  );
}

  async function pauseCampaign(
    promotion: Promotion,
  ) {
    try {
      setError(null);

      await pausePromotion(
        promotion.id,
      );

      await loadPromotions();
    } catch (err) {


      setError(
        "Não foi possível pausar a promoção.",
      );
    }
  }

  async function cancelCampaign(
    promotion: Promotion,
  ) {
    const confirmed =
      window.confirm(
        `Tem certeza que deseja cancelar a campanha "${promotion.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await cancelPromotion(
        promotion.id,
      );

      await loadPromotions();
    } catch (err) {


      setError(
        "Não foi possível cancelar a promoção.",
      );
    }
  }

  async function deleteHistoryItem(
  promotion: Promotion,
) {
  const confirmed = window.confirm(
    `Tem certeza que deseja apagar "${promotion.name}" do histórico?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    setError(null);

    await deletePromotionHistoryItem(
      promotion.id,
    );

    await loadPromotions();
  } catch (err) {

    setError(
      "Não foi possível apagar esta promoção do histórico.",
    );
  }
}

async function deleteAllHistory() {
  if (historyPromotions.length === 0) {
    return;
  }

  const confirmed = window.confirm(
    "Tem certeza que deseja apagar todo o histórico de promoções? Esta ação não pode ser desfeita.",
  );

  if (!confirmed) {
    return;
  }

  try {
    setError(null);

    await deleteAllPromotionHistory();

    await loadPromotions();
  } catch (err) {


    setError(
      "Não foi possível apagar o histórico de promoções.",
    );
  }
}

function openPromotionPayment(
  promotion: Promotion,
) {
  if (!promotion.package) {
    setError(
      "Esta promoção não possui um pacote contratado.",
    );

    return;
  }

  setPaymentPromotion(promotion);
  setPaymentMethod("MOCK");
  setPaymentModalOpen(true);
}

async function requestPromotionPayment(
  promotion: Promotion,
) {
  if (!promotion.package) {
    setError(
      "Esta promoção não possui um pacote contratado.",
    );

    return;
  }

  try {
    setCreatingPaymentId(
      promotion.id,
    );

    setError(null);
    setPaymentModalOpen(false);
setPaymentPromotion(null);

    const result =
      await createPromotionPayment(
        promotion.id,
      );

    /*
     * Se o backend já confirmou o pagamento,
     * não precisamos de abrir um novo checkout.
     */
    if (result.alreadyPaid) {
      await loadPromotions();
      return;
    }

    /*
     * O backend pode devolver um checkout novo
     * ou não devolver checkout quando já existe
     * um pagamento pendente.
     */
    if (result.checkout) {
      setActiveCheckout({
        promotionId: promotion.id,
        amount: result.payment.amount,
        currency: result.payment.currency,
        provider: result.checkout.provider,
        reference: result.checkout.reference,
        checkoutUrl:
          result.checkout.checkoutUrl ?? null,
        instructions:
          result.checkout.instructions ?? null,
        status: result.checkout.status,
      });
    } else if (
      result.alreadyPending &&
      result.payment.reference
    ) {
      /*
       * Se já existe um pagamento pendente,
       * mostramos os dados que estão guardados
       * no próprio SitePayment.
       */
      setActiveCheckout({
        promotionId: promotion.id,
        amount: result.payment.amount,
        currency: result.payment.currency,
        provider:
          result.payment.provider ?? "Não informado",
        reference: result.payment.reference,
        checkoutUrl: null,
        instructions:
          "Este pagamento já foi iniciado. Utilize a referência apresentada e aguarde a confirmação.",
        status: "PENDING",
      });
    }

    await loadPromotions();
  } catch (err) {


    setError(
      "Não foi possível iniciar o pagamento da promoção.",
    );
  } finally {
    setCreatingPaymentId(null);
  }
}

async function checkPromotionPayment(
  promotion: Promotion,
) {
  try {
    setCheckingPaymentId(
      promotion.id,
    );

    setError(null);

    const result =
      await getPromotionPayment(
        promotion.id,
      );

    const payments =
      Array.isArray(result?.payments)
        ? result.payments
        : [];

    /*
     * Atualiza os pagamentos da promoção
     * na lista principal.
     */
    setPromotions(
      currentPromotions =>
        currentPromotions.map(
          currentPromotion =>
            currentPromotion.id ===
            promotion.id
              ? {
                  ...currentPromotion,
                  payments,
                }
              : currentPromotion,
        ),
    );

    loadSpent();

    /*
     * Procura um pagamento confirmado
     * relacionado com o pacote atual.
     */
    const currentPackageId =
      promotion.package?.id ?? null;

    const paidPayment =
      currentPackageId
        ? payments.find(
            payment =>
              payment.status === "PAID" &&
              payment.metadata?.packageId ===
                currentPackageId,
          )
        : undefined;

    /*
     * Procura um pagamento pendente
     * relacionado com o pacote atual.
     */
    const pendingPayment =
      currentPackageId
        ? payments.find(
            payment =>
              payment.status === "PENDING" &&
              payment.metadata?.packageId ===
                currentPackageId,
          )
        : undefined;

    /*
     * Se o checkout aberto pertence
     * a esta promoção, sincroniza o seu estado.
     */
    if (
      activeCheckout &&
      activeCheckout.promotionId ===
        promotion.id
    ) {
      if (paidPayment) {
        setActiveCheckout(
          currentCheckout =>
            currentCheckout
              ? {
                  ...currentCheckout,
                  status: "PAID",
                  reference:
                    paidPayment.reference ??
                    currentCheckout.reference,
                }
              : null,
        );
      } else if (pendingPayment) {
        setActiveCheckout(
          currentCheckout =>
            currentCheckout
              ? {
                  ...currentCheckout,
                  status: "PENDING",
                  reference:
                    pendingPayment.reference ??
                    currentCheckout.reference,
                }
              : null,
        );
      }
    }
  } catch (err) {

    setError(
      "Não foi possível consultar o estado do pagamento.",
    );
  } finally {
    setCheckingPaymentId(null);
  }
}

const activePromotions = promotions.filter(
  (promotion) => {
    const displayStatus =
      getDisplayStatus(promotion);

    return (
      displayStatus === "DRAFT" ||
      displayStatus === "ACTIVE" ||
      displayStatus === "PAUSED"
    );
  },
);

const historyPromotions = promotions.filter(
  (promotion) => {
    const displayStatus =
      getDisplayStatus(promotion);

    return (
      displayStatus === "EXPIRED" ||
      displayStatus === "COMPLETED" ||
      displayStatus === "CANCELLED"
    );
  },
);

const visiblePromotions =
  activeTab === "active"
    ? activePromotions
    : historyPromotions;

    if (loading) {
    return (
      <div className={styles.page}>
        <FloatingDrawers />

        <div className={styles.container}>
          <h1 className={styles.title}>Minhas promoções</h1>
          <p className={styles.subtitle}>A carregar as suas campanhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <FloatingDrawers />

      {/* MODAL DE PAGAMENTO (o mesmo da verificação) */}

      {paymentPromotion && (
        <VerificationPaymentModal
          open={paymentModalOpen}
          title="Pagar promoção"
          onClose={closePaymentModal}
          verificationLabel={
            paymentPromotion.package
              ? `${paymentPromotion.name} · ${formatNumber(
                  paymentPromotion.package.impressions,
                )} impressões`
              : paymentPromotion.name
          }
          amount={
            paymentPromotion.package
              ? formatPrice(paymentPromotion.package.price)
              : "-"
          }
          method={paymentMethod}
          onMethodChange={setPaymentMethod}
          loading={creatingPaymentId === paymentPromotion.id}
          onContinue={() => requestPromotionPayment(paymentPromotion)}
        />
      )}

      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {/* CABEÇALHO */}

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Minhas promoções</h1>
            <p className={styles.subtitle}>
              Consulte as suas campanhas, rascunhos e resultados.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button type="button" className={styles.btn} onClick={refreshAll}>
              <RefreshCw size={16} />
              Atualizar
            </button>

            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={deleteAllHistory}
              disabled={historyPromotions.length === 0}
            >
              <Trash2 size={16} />
              Apagar histórico
            </button>
          </div>
        </header>

        {/* RESUMO */}

        <section className={styles.stats}>
          <div className={`${styles.statCard} ${styles.statHighlight}`}>
            <span className={styles.statIcon}>
              <Wallet size={20} />
            </span>

            <div>
              <span className={styles.statLabel}>Total investido</span>
              <strong className={styles.statValue}>
                {spent === null ? "—" : formatPrice(spent)}
              </strong>
              <small className={styles.statHint}>
                Apenas pagamentos confirmados
              </small>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statIcon}>
              <Rocket size={20} />
            </span>

            <div>
              <span className={styles.statLabel}>Em andamento</span>
              <strong className={styles.statValue}>
                {activePromotions.length}
              </strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statIcon}>
              <Clock3 size={20} />
            </span>

            <div>
              <span className={styles.statLabel}>Histórico</span>
              <strong className={styles.statValue}>
                {historyPromotions.length}
              </strong>
            </div>
          </div>
        </section>

        {/* ERRO */}

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorText}>
              <AlertTriangle size={17} />
              {error}
            </span>

            <button type="button" className={styles.btn} onClick={refreshAll}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* SEM PROMOÇÕES */}

        {!error && promotions.length === 0 && (
          <section className={styles.empty}>
            <Rocket size={40} />

            <h2>Ainda não existem promoções</h2>

            <p>Quando criar uma campanha, ela aparecerá aqui.</p>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate(-1)}
            >
              Criar promoção
            </button>
          </section>
        )}

        {/* LISTA */}

        {!error && promotions.length > 0 && (
          <>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${
                  activeTab === "active" ? styles.tabActive : ""
                }`}
                onClick={() => setActiveTab("active")}
              >
                Em andamento ({activePromotions.length})
              </button>

              <button
                type="button"
                className={`${styles.tab} ${
                  activeTab === "history" ? styles.tabActive : ""
                }`}
                onClick={() => setActiveTab("history")}
              >
                Histórico ({historyPromotions.length})
              </button>
            </div>

            {visiblePromotions.length === 0 ? (
              <section className={styles.empty}>
                <Rocket size={36} />

                <h2>
                  {activeTab === "active"
                    ? "Nenhuma promoção em andamento"
                    : "O histórico está vazio"}
                </h2>

                <p>
                  {activeTab === "active"
                    ? "As campanhas em espera, ativas ou pausadas aparecerão aqui."
                    : "As campanhas expiradas, concluídas ou canceladas aparecerão aqui."}
                </p>
              </section>
            ) : (
              <div className={styles.list}>
                {visiblePromotions.map(promotion => {
                  const displayStatus = getDisplayStatus(promotion);
                  const status = statusInfo[displayStatus];

                  const promotionPayments = Array.isArray(promotion.payments)
                    ? promotion.payments
                    : [];

                  const currentPackageId = promotion.package?.id ?? null;

                  const findPayment = (
                    paymentStatus: "PAID" | "PENDING" | "FAILED",
                  ) =>
                    currentPackageId
                      ? promotionPayments.find(
                          payment =>
                            payment.status === paymentStatus &&
                            payment.metadata?.packageId === currentPackageId,
                        )
                      : undefined;

                  const paidPayment = findPayment("PAID");
                  const pendingPayment = findPayment("PENDING");
                  const failedPayment = findPayment("FAILED");

                  const progress = getProgress(
                    promotion.impressionsUsed,
                    promotion.impressionLimit,
                  );

                  const pausedCanContinue = canContinuePaused(promotion);
                  const impressionsRemaining =
                    hasImpressionsRemaining(promotion);
                  const timeRemaining = hasTimeRemaining(promotion);

                  const cannotActivate =
                    !paidPayment || !impressionsRemaining || !timeRemaining;

                  const isClosed =
                    displayStatus === "EXPIRED" ||
                    displayStatus === "COMPLETED" ||
                    displayStatus === "CANCELLED";

                  return (
                    <article key={promotion.id} className={styles.card}>
                      <div className={styles.cardBody}>
                        {/* TOPO */}

                        <div className={styles.cardHead}>
                          <div className={styles.cardTitle}>
                            <div className={styles.badges}>
                              <span
                                className={`${styles.badge} ${
                                  styles[`status${displayStatus}`] ?? ""
                                }`}
                              >
                                {status.icon}
                                {status.label}
                              </span>

                              <span className={styles.date}>
                                Criada em {formatDate(promotion.createdAt)}
                              </span>
                            </div>

                            <h2>{promotion.name}</h2>
                          </div>

                          <div className={styles.impressions}>
                            <span>
                              <Eye size={14} />
                              Impressões
                            </span>

                            <strong>
                              {formatNumber(promotion.impressionsUsed)} /{" "}
                              {formatNumber(promotion.impressionLimit)}
                            </strong>
                          </div>
                        </div>

                        {/* PROGRESSO */}

                        <div>
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progressFill}
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className={styles.progressMeta}>
                            <span>{progress.toFixed(0)}% utilizado</span>

                            <span>
                              {formatNumber(
                                Math.max(
                                  0,
                                  promotion.impressionLimit -
                                    promotion.impressionsUsed,
                                ),
                              )}{" "}
                              restantes
                            </span>
                          </div>
                        </div>

                        {/* INFORMAÇÕES */}

                        <div className={styles.infoGrid}>
                          <InfoItem
                            label="Pacote"
                            value={`${formatNumber(
                              promotion.package?.impressions ??
                                promotion.impressionLimit,
                            )} impressões`}
                          />

                          {promotion.package && (
                            <InfoItem
                              label="Valor"
                              value={formatPrice(promotion.package.price)}
                            />
                          )}

                          <InfoItem
                            label="Início"
                            value={formatDate(promotion.startsAt)}
                          />

                          <InfoItem
                            label="Fim"
                            value={formatDate(promotion.endsAt)}
                          />

                          <InfoItem
                            label="Prioridade"
                            value={String(promotion.priority)}
                          />

                          <InfoItem
                            label="Produtos"
                            value={String(promotion.products.length)}
                          />
                        </div>

                        {/* PAUSADA */}

                        {promotion.status === "PAUSED" &&
                          displayStatus === "PAUSED" && (
                            <div className={styles.notice}>
                              {pausedCanContinue ? (
                                <>
                                  <Pause size={15} />
                                  Pausada. Pode continuar sem novo pacote.
                                </>
                              ) : !timeRemaining ? (
                                <>
                                  <Clock3 size={15} />O período desta
                                  campanha terminou.
                                </>
                              ) : !impressionsRemaining ? (
                                <>
                                  <Eye size={15} />O limite de impressões foi
                                  atingido.
                                </>
                              ) : null}
                            </div>
                          )}

                        {/* PAGAMENTO */}

                        {promotion.status === "DRAFT" && (
                          <div className={styles.payBox}>
                            <div className={styles.payHead}>
                              <div>
                                <strong>Pagamento</strong>
                                <span>Pague para poder ativar a campanha.</span>
                              </div>

                              <strong className={styles.payAmount}>
                                {promotion.package
                                  ? formatPrice(promotion.package.price)
                                  : "-"}
                              </strong>
                            </div>

                            {paidPayment ? (
                              <div
                                className={`${styles.payState} ${styles.payPaid}`}
                              >
                                <span className={styles.payStateTitle}>
                                  <CheckCircle2 size={17} />
                                  Pagamento confirmado
                                </span>
                              </div>
                            ) : pendingPayment ? (
                              <div className={styles.payState}>
                                <span className={styles.payStateTitle}>
                                  <Clock3 size={17} />
                                  Aguardando confirmação
                                </span>

                                {pendingPayment.reference && (
                                  <div className={styles.refBox}>
                                    {pendingPayment.reference}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  className={`${styles.btn} ${styles.payActions}`}
                                  disabled={checkingPaymentId === promotion.id}
                                  onClick={() =>
                                    checkPromotionPayment(promotion)
                                  }
                                >
                                  <RefreshCw size={15} />
                                  {checkingPaymentId === promotion.id
                                    ? "A verificar..."
                                    : "Verificar pagamento"}
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className={`${styles.btnPrimary} ${styles.payActions}`}
                                  disabled={creatingPaymentId === promotion.id}
                                  onClick={() =>
                                    openPromotionPayment(promotion)
                                  }
                                >
                                  <Rocket size={16} />
                                  Pagar promoção
                                </button>

                                {failedPayment && (
                                  <span className={styles.payFailed}>
                                    O último pagamento não foi concluído.
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* LOCAIS */}

                        {promotion.placements.length > 0 && (
                          <div>
                            <div className={styles.sectionLabel}>
                              Locais de exibição
                            </div>

                            <div className={styles.chips}>
                              {promotion.placements.map(placement => {
                                const info =
                                  placementInfo[placement.placement];

                                if (!info) {
                                  return null;
                                }

                                return (
                                  <span key={placement.id} className={styles.chip}>
                                    {info.icon}
                                    {info.label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* PRODUTOS */}

                        {promotion.products.length > 0 && (
                          <div>
                            <div className={styles.sectionLabel}>
                              Produtos da campanha
                            </div>

                            <div className={styles.products}>
                              {promotion.products.map(item => (
                                <div key={item.id} className={styles.product}>
                                  <div className={styles.productThumb}>
                                    {item.product.imageUrl ? (
                                      <SmartImage
                                        src={item.product.imageUrl}
                                        aspectRatio="1 / 1"
                                        fit="cover"
                                      />
                                    ) : (
                                      <Package size={28} />
                                    )}
                                  </div>

                                  <strong>{item.product.name}</strong>
                                  <span>{formatPrice(item.product.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* NOVO PACOTE */}

                        {canReactivate(promotion) &&
                          selectingPackageId === promotion.id && (
                            <div className={styles.packagePicker}>
                              <strong>Escolha um novo pacote</strong>

                              <div className={styles.packageList}>
                                {promotionPackages.map(promotionPackage => {
                                  const changing =
                                    changingPackageId === promotion.id;

                                  return (
                                    <button
                                      key={promotionPackage.id}
                                      type="button"
                                      className={styles.packageOption}
                                      disabled={changing}
                                      onClick={() =>
                                        reactivateWithNewPackage(
                                          promotion,
                                          promotionPackage.id,
                                        )
                                      }
                                    >
                                      <strong>
                                        {formatNumber(
                                          promotionPackage.impressions,
                                        )}{" "}
                                        impressões
                                      </strong>

                                      <span>
                                        {changing
                                          ? "A contratar..."
                                          : formatPrice(promotionPackage.price)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                type="button"
                                className={`${styles.btn} ${styles.payActions}`}
                                disabled={changingPackageId === promotion.id}
                                onClick={() => setSelectingPackageId(null)}
                              >
                                Fechar
                              </button>
                            </div>
                          )}
                      </div>

                      {/* AÇÕES */}

                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.btn}
                          onClick={() =>
                            navigate(`/stores/${promotion.store.id}`)
                          }
                        >
                          <Store size={16} />
                          Ver banca
                        </button>

                        {promotion.status === "DRAFT" && (
                          <>
                            <button
                              type="button"
                              className={styles.btnPrimary}
                              disabled={cannotActivate}
                              onClick={() => activateCampaign(promotion)}
                            >
                              <Rocket size={16} />
                              Ativar campanha
                            </button>

                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnDanger}`}
                              onClick={() => cancelCampaign(promotion)}
                            >
                              <XCircle size={16} />
                              Cancelar
                            </button>
                          </>
                        )}

                        {promotion.status === "PAUSED" &&
                          displayStatus === "PAUSED" && (
                            <>
                              {pausedCanContinue && (
                                <button
                                  type="button"
                                  className={styles.btnPrimary}
                                  onClick={() =>
                                    continuePausedCampaign(promotion)
                                  }
                                >
                                  <Play size={16} />
                                  Continuar
                                </button>
                              )}

                              <button
                                type="button"
                                className={`${styles.btn} ${styles.btnDanger}`}
                                onClick={() => cancelCampaign(promotion)}
                              >
                                <XCircle size={16} />
                                Cancelar
                              </button>
                            </>
                          )}

                        {promotion.status === "ACTIVE" &&
                          displayStatus === "ACTIVE" && (
                            <>
                              <span className={styles.tag}>
                                <CheckCircle2 size={16} />
                                Campanha ativa
                              </span>

                              <button
                                type="button"
                                className={styles.btn}
                                onClick={() => pauseCampaign(promotion)}
                              >
                                <Pause size={16} />
                                Pausar
                              </button>

                              <button
                                type="button"
                                className={`${styles.btn} ${styles.btnDanger}`}
                                onClick={() => cancelCampaign(promotion)}
                              >
                                <XCircle size={16} />
                                Cancelar
                              </button>
                            </>
                          )}

                        {isClosed && (
                          <>
                            {(displayStatus === "EXPIRED" ||
                              displayStatus === "COMPLETED") && (
                              <button
                                type="button"
                                className={styles.btnPrimary}
                                disabled={!canReactivate(promotion)}
                                onClick={() =>
                                  setSelectingPackageId(promotion.id)
                                }
                              >
                                <Rocket size={16} />
                                Escolher novo pacote
                              </button>
                            )}

                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnDanger}`}
                              onClick={() => deleteHistoryItem(promotion)}
                            >
                              <Trash2 size={16} />
                              Apagar
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.infoItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}