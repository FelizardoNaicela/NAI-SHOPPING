
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
              </>
            )}
          </div>
        </PanelSection>
      )}
    </>
  );
}
