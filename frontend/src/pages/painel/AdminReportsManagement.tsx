
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import {api} from "../../services/api";

import PanelSection from "../../components/panel/PanelSection";

import styles from "./AdminReportsManagement.module.css";

import type { PainelProfile } from "./AdminManagement";

type ReportStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "REJECTED";

type ReportTargetType =
  | "STORE"
  | "PRODUCT"
  | "POST"
  | "USER";

type ReportReason =
  | "FRAUD"
  | "SCAM"
  | "MISLEADING_INFORMATION"
  | "PROHIBITED_PRODUCT"
  | "COUNTERFEIT_PRODUCT"
  | "INAPPROPRIATE_CONTENT"
  | "HARASSMENT"
  | "IMPERSONATION"
  | "OTHER";

type AdministrativeActionType =
  | "WARNING"
  | "CONTENT_REMOVAL"
  | "TEMPORARY_SUSPENSION"
  | "PERMANENT_SUSPENSION";

type AdministrativeActionStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "REVERSED"
  | "EXPIRED"
  | "CANCELLED";

interface AdministrativeAction {
  id: string;
  reportId: string;
  targetType: ReportTargetType;
  targetId: string;
  type: AdministrativeActionType;
  status: AdministrativeActionStatus;
  reason: string;
  createdById: string;
  createdBy?: ReportUser | null;
  startsAt: string;
  endsAt?: string | null;
  reversedAt?: string | null;
  reversedById?: string | null;
  reversedBy?: ReportUser | null;
  reversalReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReportUser {
  id: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
}

interface ReportTarget {
  id?: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  avatarUrl?: string | null;
}

interface Report {
  id: string;

  reporterId: string;
  reporter?: ReportUser | null;

  targetType: ReportTargetType;
  targetId: string;
  target?: ReportTarget | null;

  reason: ReportReason;
  description?: string | null;

  status: ReportStatus;

  reviewedById?: string | null;
  reviewer?: ReportUser | null;

  reviewNotes?: string | null;

  createdAt: string;
  updatedAt: string;
  reviewedAt?: string | null;
}

interface ReportsResponse {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
}

type StatusFilter = ReportStatus | "ALL";

interface AdminReportsManagementProps {
  profile: PainelProfile;
}

const STATUS_OPTIONS: {
  value: StatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "UNDER_REVIEW", label: "Em análise" },
  { value: "RESOLVED", label: "Resolvidas" },
  { value: "REJECTED", label: "Rejeitadas" },
];

const SUSPENSION_DURATION_OPTIONS = [
  { value: "1", label: "24 horas", days: 1 },
  { value: "3", label: "3 dias", days: 3 },
  { value: "7", label: "7 dias", days: 7 },
  { value: "15", label: "15 dias", days: 15 },
  { value: "30", label: "30 dias", days: 30 },
  { value: "CUSTOM", label: "Personalizado", days: null },
] as const;

function getStatusLabel(status: ReportStatus): string {
  switch (status) {
    case "PENDING":
      return "Pendente";

    case "UNDER_REVIEW":
      return "Em análise";

    case "RESOLVED":
      return "Resolvida";

    case "REJECTED":
      return "Rejeitada";

    default:
      return status;
  }
}

function getStatusClass(status: ReportStatus): string {
  switch (status) {
    case "PENDING":
      return styles.statusPending;

    case "UNDER_REVIEW":
      return styles.statusReview;

    case "RESOLVED":
      return styles.statusResolved;

    case "REJECTED":
      return styles.statusRejected;

    default:
      return "";
  }
}

function getTargetLabel(type: ReportTargetType): string {
  switch (type) {
    case "STORE":
      return "Banca";

    case "PRODUCT":
      return "Produto";

    case "POST":
      return "Publicação";

    case "USER":
      return "Utilizador";

    default:
      return type;
  }
}

function getReasonLabel(reason: ReportReason): string {
  switch (reason) {
    case "FRAUD":
      return "Fraude";

    case "SCAM":
      return "Burla";

    case "MISLEADING_INFORMATION":
      return "Informação enganosa";

    case "PROHIBITED_PRODUCT":
      return "Produto proibido";

    case "COUNTERFEIT_PRODUCT":
      return "Produto contrafeito";

    case "INAPPROPRIATE_CONTENT":
      return "Conteúdo impróprio";

    case "HARASSMENT":
      return "Assédio";

    case "IMPERSONATION":
      return "Falsificação de identidade";

    case "OTHER":
      return "Outro motivo";

    default:
      return reason;
  }
}

function getAdministrativeActionLabel(
  type: AdministrativeActionType,
): string {
  switch (type) {
    case "WARNING":
      return "Advertência";

    case "CONTENT_REMOVAL":
      return "Remoção de conteúdo";

    case "TEMPORARY_SUSPENSION":
      return "Suspensão temporária";

    case "PERMANENT_SUSPENSION":
      return "Suspensão permanente";

    default:
      return type;
  }
}

function getAdministrativeActionStatusLabel(
  status: AdministrativeActionStatus,
): string {
  switch (status) {
    case "ACTIVE":
      return "Activa";

    case "COMPLETED":
      return "Concluída";

    case "REVERSED":
      return "Revertida";

    case "EXPIRED":
      return "Expirada";

    case "CANCELLED":
      return "Cancelada";

    default:
      return status;
  }
}

function getAdministrativeActionStatusClass(
  status: AdministrativeActionStatus,
): string {
  switch (status) {
    case "ACTIVE":
      return styles.actionStatusActive;

    case "REVERSED":
      return styles.actionStatusReversed;

    case "EXPIRED":
      return styles.actionStatusExpired;

    case "COMPLETED":
      return styles.actionStatusCompleted;

    case "CANCELLED":
      return styles.actionStatusCancelled;

    default:
      return "";
  }
}

function getLocalDateTimeValue(date: Date): string {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  );

  return localDate.toISOString().slice(0, 16);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getReporterName(report: Report): string {
  return (
    report.reporter?.name ||
    report.reporter?.username ||
    report.reporter?.email ||
    report.reporterId
  );
}

function getTargetName(report: Report): string {
  return (
    report.target?.name ||
    report.target?.title ||
    report.target?.description ||
    report.targetId
  );
}

function normalizeReportsResponse(
  response: unknown,
): ReportsResponse {
  if (Array.isArray(response)) {
    return {
      reports: response as Report[],
      total: response.length,
      page: 1,
      limit: response.length,
    };
  }

  const data = response as Partial<ReportsResponse> | null;

  return {
    reports: Array.isArray(data?.reports)
      ? data.reports
      : [],
    total: typeof data?.total === "number"
      ? data.total
      : 0,
    page: typeof data?.page === "number"
      ? data.page
      : 1,
    limit: typeof data?.limit === "number"
      ? data.limit
      : 20,
  };
}

export default function AdminReportsManagement({
  profile,
}: AdminReportsManagementProps) {
  const isSuperAdmin =
    profile.adminRole === "SUPER_ADMIN";

  const canManageReports =
    isSuperAdmin || profile.canManageReports;

  const [reports, setReports] = useState<Report[]>([]);

  const [selectedReport, setSelectedReport] =
    useState<Report | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("PENDING");

  const [reviewNotes, setReviewNotes] = useState("");

  const [loading, setLoading] = useState(true);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const [administrativeActions, setAdministrativeActions] =
  useState<AdministrativeAction[]>([]);

const [loadingActions, setLoadingActions] = useState(false);

const [actionType, setActionType] =
  useState<AdministrativeActionType>("WARNING");

const [actionReason, setActionReason] = useState("");

const [actionEndsAt, setActionEndsAt] = useState("");

const [reversingActionId, setReversingActionId] =
  useState<string | null>(null);

const [reversalReason, setReversalReason] = useState("");

const [suspensionDuration, setSuspensionDuration] =
  useState("7");

  const limit = 20;

  const loadReports = useCallback(async () => {
    if (!canManageReports) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const response = await api.get(
        "/admin/reports",
        { params },
      );

      const normalized =
        normalizeReportsResponse(response.data);

      setReports(normalized.reports);
      setTotal(normalized.total);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "Não foi possível carregar as denúncias.",
      );
    } finally {
      setLoading(false);
    }
  }, [canManageReports, page, statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

 async function openReport(report: Report) {
  setSelectedReport(report);
  setReviewNotes(report.reviewNotes || "");

  setAdministrativeActions([]);
  setActionType("WARNING");
  setActionReason("");
  setActionEndsAt("");
  setReversingActionId(null);
  setReversalReason("");
  setSuspensionDuration("7");

  setLoadingDetails(true);
  setError("");
  setSuccess("");

  try {
    const response = await api.get(
      `/admin/reports/${report.id}`,
    );

    setSelectedReport(response.data);
    setReviewNotes(
      response.data?.reviewNotes || "",
    );

    // ADICIONAR ESTA CHAMADA:
    await loadAdministrativeActions(report.id);

  } catch (err: any) {
    setError(
      err?.response?.data?.message ||
      "Não foi possível carregar os detalhes da denúncia.",
    );
  } finally {
    setLoadingDetails(false);
  }
}

  function closeDetails() {
    setSelectedReport(null);
    setReviewNotes("");
    setError("");
    setSuccess("");
    setAdministrativeActions([]);
setActionReason("");
setActionEndsAt("");
setReversingActionId(null);
setReversalReason("");
setSuspensionDuration("7");
  }

  async function claimReport() {
    if (!selectedReport) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `/admin/reports/${selectedReport.id}/claim`,
      );

      if (response.data) {
        setSelectedReport(response.data);
      }

      setSuccess("Denúncia assumida com sucesso.");

      await loadReports();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "Não foi possível assumir esta denúncia.",
      );
    } finally {
      setProcessing(false);
    }
  }

  async function finalizeReport(
    action: "resolve" | "reject",
  ) {
    if (!selectedReport) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `/admin/reports/${selectedReport.id}/${action}`,
        {
          reviewNotes: reviewNotes.trim() || undefined,
        },
      );

      setSelectedReport(response.data);

      setSuccess(
        action === "resolve"
          ? "Denúncia resolvida com sucesso."
          : "Denúncia rejeitada com sucesso.",
      );

      await loadReports();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "Não foi possível concluir a análise da denúncia.",
      );
    } finally {
      setProcessing(false);
    }
  }

  function changeFilter(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
    setSelectedReport(null);
    setError("");
    setSuccess("");
  }

  const canFinalize =
    selectedReport?.status === "UNDER_REVIEW" &&
    (
      isSuperAdmin ||
      selectedReport.reviewedById === profile.userId
    );

  if (!canManageReports) {
    return null;
  }

  const canApplyAdministrativeAction =
  selectedReport?.status === "RESOLVED" &&
  (
    isSuperAdmin ||
    selectedReport.reviewedById === profile.userId
  );

const canRemoveReportedContent =
  selectedReport?.targetType === "PRODUCT" ||
  selectedReport?.targetType === "POST";

const canSuspendReportedTarget =
  selectedReport?.targetType === "STORE" ||
  selectedReport?.targetType === "USER";

  const loadAdministrativeActions = useCallback(
  async (reportId: string) => {
    setLoadingActions(true);

    try {
      const response = await api.get(
        `/admin/reports/${reportId}/actions`,
      );

      setAdministrativeActions(
        Array.isArray(response.data)
          ? response.data
          : [],
      );
    } catch (err: any) {
      setAdministrativeActions([]);

      setError(
        err?.response?.data?.message ||
        "Não foi possível carregar o histórico das medidas administrativas.",
      );
    } finally {
      setLoadingActions(false);
    }
  },
  [],
);

async function createAdministrativeAction() {
  if (!selectedReport) return;

  if (!actionReason.trim()) {
    setError("Indica o motivo da medida administrativa.");
    return;
  }

  if (
    actionType === "TEMPORARY_SUSPENSION" &&
    suspensionDuration === "CUSTOM" &&
    !actionEndsAt
  ) {
    setError(
      "Define a data e hora de término da suspensão.",
    );
    return;
  }

  setProcessing(true);
  setError("");
  setSuccess("");

  try {
    const payload: {
      type: AdministrativeActionType;
      reason: string;
      endsAt?: string;
    } = {
      type: actionType,
      reason: actionReason.trim(),
    };

    if (actionType === "TEMPORARY_SUSPENSION") {
      let endDate: Date;

      if (suspensionDuration === "CUSTOM") {
        endDate = new Date(actionEndsAt);
      } else {
        const selectedDuration =
          SUSPENSION_DURATION_OPTIONS.find(
            option => option.value === suspensionDuration,
          );

        if (!selectedDuration || !selectedDuration.days) {
          throw new Error("Duração de suspensão inválida.");
        }

        endDate = new Date();

        endDate.setDate(
          endDate.getDate() + selectedDuration.days,
        );
      }

      if (
        Number.isNaN(endDate.getTime()) ||
        endDate.getTime() <= Date.now()
      ) {
        setError(
          "A data de término deve ser posterior à data actual.",
        );
        return;
      }

      payload.endsAt = endDate.toISOString();
    }

    await api.post(
      `/admin/reports/${selectedReport.id}/actions`,
      payload,
    );

    setSuccess(
      "Medida administrativa aplicada com sucesso.",
    );

    setActionReason("");
    setActionEndsAt("");
    setActionType("WARNING");
    setSuspensionDuration("7");

    await loadAdministrativeActions(selectedReport.id);
  } catch (err: any) {
    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Não foi possível aplicar a medida administrativa.",
    );
  } finally {
    setProcessing(false);
  }
}

async function reverseAdministrativeAction(
  actionId: string,
) {
  if (!reversalReason.trim()) {
    setError(
      "Indica o motivo pelo qual pretendes reverter esta medida.",
    );
    return;
  }

  if (!selectedReport) return;

  setProcessing(true);
  setError("");
  setSuccess("");

  try {
    await api.patch(
      `/admin/actions/${actionId}/reverse`,
      {
        reversalReason: reversalReason.trim(),
      },
    );

    setSuccess("Medida administrativa revertida com sucesso.");

    setReversingActionId(null);
    setReversalReason("");

    await loadAdministrativeActions(selectedReport.id);
  } catch (err: any) {
    setError(
      err?.response?.data?.message ||
      "Não foi possível reverter esta medida.",
    );
  } finally {
    setProcessing(false);
  }
}

  return (
    <>
      <PanelSection
  title="Gestão de denúncias"
  description="Analise as denúncias submetidas pelos utilizadores e acompanhe o respetivo estado."
  icon={<ShieldAlert size={20} strokeWidth={1.9} />}
  summary={`${total} denúncia(s)`}
>
        <div className={styles.container}>
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    statusFilter === option.value
                      ? styles.filterActive
                      : styles.filterButton
                  }
                  onClick={() => changeFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.refreshButton}
              onClick={loadReports}
              disabled={loading}
              title="Atualizar denúncias"
            >
              <RefreshCw
                size={16}
                className={loading ? styles.spinning : ""}
              />
              Atualizar
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <AlertTriangle size={17} />
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>
              <Loader2 className={styles.spinning} size={24} />
              <span>A carregar denúncias...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText size={34} />
              <strong>Nenhuma denúncia encontrada</strong>
              <span>
                Não existem denúncias neste filtro.
              </span>
            </div>
          ) : (
            <div className={styles.reportList}>
              {reports.map((report) => (
                <article
                  key={report.id}
                  className={styles.reportCard}
                >
                  <div className={styles.reportHeader}>
                    <div>
                      <span className={styles.reportType}>
                        {getTargetLabel(report.targetType)}
                      </span>

                      <h3>
                        {getTargetName(report)}
                      </h3>
                    </div>

                    <span
                      className={`${styles.status} ${getStatusClass(
                        report.status,
                      )}`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                  </div>

                  <p className={styles.reason}>
                    {getReasonLabel(report.reason)}
                  </p>

                  {report.description && (
                    <p className={styles.description}>
                      {report.description}
                    </p>
                  )}

                  <div className={styles.metadata}>
                    <span>
                      Denunciante: {getReporterName(report)}
                    </span>

                    <span>
                      {formatDate(report.createdAt)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={styles.detailsButton}
                    onClick={() => openReport(report)}
                  >
                    <Eye size={16} />
                    Ver denúncia
                  </button>
                </article>
              ))}
            </div>
          )}

          {!loading && total > limit && (
            <div className={styles.pagination}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </button>

              <span>
                Página {page} · {total} denúncias
              </span>

              <button
                type="button"
                disabled={page * limit >= total}
                onClick={() => setPage((current) => current + 1)}
              >
                Seguinte
              </button>
            </div>
          )}
        </div>
      </PanelSection>

      {selectedReport && (
        <PanelSection
  title="Detalhes da denúncia"
  description={`Denúncia ${selectedReport.id}`}
  icon={<FileText size={20} strokeWidth={1.9} />}
  summary={getStatusLabel(selectedReport.status)}
  actions={
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={closeDetails}
            >
              Fechar detalhes
            </button>
          }
        >
          <div className={styles.container}>
            {loadingDetails ? (
              <div className={styles.loading}>
                <Loader2 className={styles.spinning} size={24} />
                A carregar detalhes...
              </div>
            ) : (
              <>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span>Tipo de alvo</span>
                    <strong>
                      {getTargetLabel(selectedReport.targetType)}
                    </strong>
                  </div>

                  <div className={styles.detailItem}>
                    <span>Motivo</span>
                    <strong>
                      {getReasonLabel(selectedReport.reason)}
                    </strong>
                  </div>

                  <div className={styles.detailItem}>
                    <span>Denunciante</span>
                    <strong>
                      {getReporterName(selectedReport)}
                    </strong>
                  </div>

                  <div className={styles.detailItem}>
                    <span>Data da denúncia</span>
                    <strong>
                      {formatDate(selectedReport.createdAt)}
                    </strong>
                  </div>

                  <div className={styles.detailItem}>
                    <span>ID do alvo</span>
                    <strong className={styles.breakable}>
                      {selectedReport.targetId}
                    </strong>
                  </div>

                  <div className={styles.detailItem}>
                    <span>Estado atual</span>
                    <strong>
                      {getStatusLabel(selectedReport.status)}
                    </strong>
                  </div>
                </div>

                <div className={styles.detailBlock}>
                  <h4>Descrição apresentada</h4>

                  <p>
                    {selectedReport.description ||
                      "O denunciante não forneceu uma descrição adicional."}
                  </p>
                </div>

                {selectedReport.reviewedById && (
                  <div className={styles.detailBlock}>
                    <h4>Responsável pela análise</h4>

                    <p>
                      {selectedReport.reviewer?.name ||
                        selectedReport.reviewer?.email ||
                        selectedReport.reviewedById}
                    </p>
                  </div>
                )}

                <div className={styles.reviewArea}>
                  <label htmlFor="report-review-notes">
                    Notas da análise
                  </label>

                  <textarea
                    id="report-review-notes"
                    value={reviewNotes}
                    onChange={(event) =>
                      setReviewNotes(event.target.value)
                    }
                    placeholder="Registe aqui as observações e a justificação da decisão..."
                    rows={4}
                    disabled={!canFinalize || processing}
                  />
                </div>

                {selectedReport.status === "PENDING" && (
                  <div className={styles.actionArea}>
                    <p>
                      Assuma esta denúncia para iniciar a análise.
                    </p>

                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={claimReport}
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className={styles.spinning} size={17} />
                      ) : (
                        <Clock3 size={17} />
                      )}
                      Assumir denúncia
                    </button>
                  </div>
                )}

                {canFinalize && (
                  <div className={styles.actionArea}>
                    <p>
                      Depois de analisar os elementos apresentados,
                      escolha o resultado da denúncia.
                    </p>

                    <div className={styles.finalActions}>
                      <button
                        type="button"
                        className={styles.resolveButton}
                        onClick={() => finalizeReport("resolve")}
                        disabled={processing}
                      >
                        <CheckCircle2 size={17} />
                        Resolver denúncia
                      </button>

                      <button
                        type="button"
                        className={styles.rejectButton}
                        onClick={() => finalizeReport("reject")}
                        disabled={processing}
                      >
                        <XCircle size={17} />
                        Rejeitar denúncia
                      </button>
                    </div>
                  </div>
                )}

                {selectedReport.status === "UNDER_REVIEW" &&
                  !canFinalize && (
                    <div className={styles.infoMessage}>
                      Esta denúncia está a ser analisada por outro
                      administrador. Só o responsável pela análise
                      ou o Super Admin pode finalizá-la.
                    </div>
                  )}

                {(selectedReport.status === "RESOLVED" ||
                  selectedReport.status === "REJECTED") && (
                  <div className={styles.finalizedMessage}>
                    <CheckCircle2 size={18} />
                    Esta denúncia já foi finalizada.

                    {selectedReport.reviewNotes && (
                      <p>
                        <strong>Notas:</strong>{" "}
                        {selectedReport.reviewNotes}
                      </p>
                    )}
                  </div>
                )}

                {selectedReport.status === "RESOLVED" && (
  <div className={styles.administrativeSection}>
    <div className={styles.administrativeHeader}>
      <div>
        <h3>Medidas administrativas</h3>
        <p>
          Regista e acompanha as medidas tomadas em consequência
          desta denúncia.
        </p>
      </div>

      <ShieldAlert size={22} />
    </div>

    {canApplyAdministrativeAction && (
      <div className={styles.createActionBox}>
        <h4>Aplicar nova medida</h4>

        <div className={styles.formGroup}>
          <label htmlFor="administrative-action-type">
            Tipo de medida
          </label>

          <select
            id="administrative-action-type"
            value={actionType}
            onChange={(event) =>
              setActionType(
                event.target.value as AdministrativeActionType,
              )
            }
            disabled={processing}
          >
            <option value="WARNING">Advertência</option>

            {canRemoveReportedContent && (
              <option value="CONTENT_REMOVAL">
                Remoção de conteúdo
              </option>
            )}

            {canSuspendReportedTarget && (
              <>
                <option value="TEMPORARY_SUSPENSION">
                  Suspensão temporária
                </option>

                <option value="PERMANENT_SUSPENSION">
                  Suspensão permanente
                </option>
              </>
            )}
          </select>
        </div>

        {actionType === "TEMPORARY_SUSPENSION" && (
  <>
    <div className={styles.formGroup}>
      <label htmlFor="suspension-duration">
        Duração da suspensão
      </label>

      <select
        id="suspension-duration"
        value={suspensionDuration}
        onChange={(event) => {
          setSuspensionDuration(event.target.value);
          setActionEndsAt("");
        }}
        disabled={processing}
      >
        {SUSPENSION_DURATION_OPTIONS.map(option => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>

    {suspensionDuration === "CUSTOM" && (
      <div className={styles.formGroup}>
        <label htmlFor="administrative-action-end">
          Data e hora de término
        </label>

        <input
          id="administrative-action-end"
          type="datetime-local"
          min={getLocalDateTimeValue(new Date())}
          value={actionEndsAt}
          onChange={(event) =>
            setActionEndsAt(event.target.value)
          }
          disabled={processing}
        />
      </div>
    )}
  </>
)}

        <div className={styles.formGroup}>
          <label htmlFor="administrative-action-reason">
            Justificação da medida
          </label>

          <textarea
            id="administrative-action-reason"
            value={actionReason}
            onChange={(event) =>
              setActionReason(event.target.value)
            }
            placeholder="Explica por que razão esta medida está a ser aplicada..."
            rows={4}
            maxLength={2000}
            disabled={processing}
          />

          <span className={styles.characterCount}>
            {actionReason.length}/2000
          </span>
        </div>

        <button
          type="button"
          className={styles.applyActionButton}
          onClick={createAdministrativeAction}
          disabled={
            processing ||
            !actionReason.trim() ||
            (
  actionType === "TEMPORARY_SUSPENSION" &&
  suspensionDuration === "CUSTOM" &&
  !actionEndsAt
)
          }
        >
          {processing ? (
            <Loader2 size={17} className={styles.spinning} />
          ) : (
            <ShieldAlert size={17} />
          )}

          Aplicar medida administrativa
        </button>
      </div>
    )}

    {!canApplyAdministrativeAction && (
      <div className={styles.infoMessage}>
        Apenas o administrador responsável pela análise ou o
        Super Admin pode aplicar medidas nesta denúncia.
      </div>
    )}

    <div className={styles.actionHistory}>
      <h4>Histórico de medidas</h4>

      {loadingActions ? (
        <div className={styles.loading}>
          <Loader2 size={21} className={styles.spinning} />
          A carregar histórico...
        </div>
      ) : administrativeActions.length === 0 ? (
        <div className={styles.emptyActions}>
          <FileText size={25} />
          <span>
            Ainda não foi aplicada nenhuma medida administrativa.
          </span>
        </div>
      ) : (
        <div className={styles.administrativeActionList}>
          {administrativeActions.map((action) => (
            <article
              key={action.id}
              className={styles.administrativeActionCard}
            >
              <div className={styles.administrativeActionTop}>
                <div>
                  <strong>
                    {getAdministrativeActionLabel(action.type)}
                  </strong>

                  <span
                    className={`${styles.actionStatus} ${getAdministrativeActionStatusClass(
                      action.status,
                    )}`}
                  >
                    {getAdministrativeActionStatusLabel(
                      action.status,
                    )}
                  </span>
                </div>

                <span className={styles.actionDate}>
                  {formatDate(action.createdAt)}
                </span>
              </div>

              <div className={styles.actionInformation}>
                <p>
                  <strong>Justificação:</strong> {action.reason}
                </p>

                <p>
                  <strong>Aplicada por:</strong>{" "}
                  {action.createdBy?.name ||
                    action.createdBy?.username ||
                    action.createdBy?.email ||
                    action.createdById}
                </p>

                <p>
                  <strong>Início:</strong>{" "}
                  {formatDate(action.startsAt)}
                </p>

                {action.endsAt && (
                  <p>
                    <strong>Término:</strong>{" "}
                    {formatDate(action.endsAt)}
                  </p>
                )}

                {action.status === "REVERSED" && (
                  <div className={styles.reversalInformation}>
                    <p>
                      <strong>Revertida por:</strong>{" "}
                      {action.reversedBy?.name ||
                        action.reversedBy?.email ||
                        action.reversedById ||
                        "Administrador"}
                    </p>

                    {action.reversedAt && (
                      <p>
                        <strong>Data da reversão:</strong>{" "}
                        {formatDate(action.reversedAt)}
                      </p>
                    )}

                    {action.reversalReason && (
                      <p>
                        <strong>Motivo da reversão:</strong>{" "}
                        {action.reversalReason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {action.status === "ACTIVE" &&
                canApplyAdministrativeAction && (
                  <div className={styles.reversalArea}>
                    {reversingActionId === action.id ? (
                      <>
                        <label
                          htmlFor={`reversal-reason-${action.id}`}
                        >
                          Justificação da reversão
                        </label>

                        <textarea
                          id={`reversal-reason-${action.id}`}
                          value={reversalReason}
                          onChange={(event) =>
                            setReversalReason(event.target.value)
                          }
                          placeholder="Explica por que razão esta medida deve ser revertida..."
                          rows={3}
                          maxLength={2000}
                          disabled={processing}
                        />

                        <div className={styles.reversalButtons}>
                          <button
                            type="button"
                            className={styles.confirmReversalButton}
                            onClick={() =>
                              reverseAdministrativeAction(action.id)
                            }
                            disabled={
                              processing ||
                              !reversalReason.trim()
                            }
                          >
                            {processing ? (
                              <Loader2
                                size={16}
                                className={styles.spinning}
                              />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            Confirmar reversão
                          </button>

                          <button
                            type="button"
                            className={styles.cancelReversalButton}
                            onClick={() => {
                              setReversingActionId(null);
                              setReversalReason("");
                            }}
                            disabled={processing}
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={styles.reverseButton}
                        onClick={() => {
                          setReversingActionId(action.id);
                          setReversalReason("");
                          setError("");
                        }}
                        disabled={processing}
                      >
                        <RefreshCw size={16} />
                        Reverter medida
                      </button>
                    )}
                  </div>
                )}
            </article>
          ))}
        </div>
      )}
    </div>
  </div>
)}
              </>
            )}
          </div>
        </PanelSection>
      )}
    </>
  );
}
