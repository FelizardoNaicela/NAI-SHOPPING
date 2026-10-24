import {
  useEffect,
  useState,
  type CSSProperties,
} from 'react';

import { api } from '../../services/api';

import type { PainelProfile } from './AdminManagement';

import { ClipboardCheck } from 'lucide-react';
import PanelSection from '../../components/panel/PanelSection';

// =====================================================
// TIPOS
// =====================================================

type VerificationType =
  | 'BASIC'
  | 'PREMIUM';

type VerificationRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

interface VerificationStore {
  id: string;
  name: string;
  description?: string | null;

  countryCode?: string | null;
  region?: string | null;

  verified: boolean;

  verificationType:
    | VerificationType
    | null;

  regionalManagementLocked?: boolean;

  ratingAverage?: number;
  ratingCount?: number;

  avatarUrl?: string | null;
  bannerUrl?: string | null;

  regions?: Array<{
    id: string;
    region: string;
  }>;

  owner?: {
    id: string;
    name?: string | null;
    email: string;
  };
}

interface VerificationUser {
  id: string;
  name?: string | null;
  email: string;
  countryCode?: string | null;
  region?: string | null;
}

interface VerificationRequest {
  id: string;

  storeId: string;

  store: VerificationStore;

  requestedType: VerificationType;

  status: VerificationRequestStatus;

  requestedById: string;

  requestedBy: VerificationUser;

  reviewedById?: string | null;

  reviewedBy?: VerificationUser | null;

  rejectionReason?: string | null;

  createdAt: string;

  reviewedAt?: string | null;
}

// =====================================================
// PROPS
// =====================================================

interface AdminVerificationRequestsProps {
  profile: PainelProfile;
}

// =====================================================
// COMPONENTE
// =====================================================

export default function AdminVerificationRequests({
  profile,
}: AdminVerificationRequestsProps) {
  const [requests, setRequests] =
    useState<VerificationRequest[]>([]);

  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<
      'ALL' |
      VerificationRequestStatus
    >('PENDING');

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [rejectionReason, setRejectionReason] =
    useState('');

const [verificationTypeFilter, setVerificationTypeFilter] =
  useState<'ALL' | VerificationType>('ALL');

  const [visibleRequestCount, setVisibleRequestCount] =
  useState(10);

  const isSuperAdmin =
    profile.adminRole ===
    'SUPER_ADMIN';

  const canManageVerifications =
    isSuperAdmin ||
    profile.canManageVerifications;

  const canApproveVerifications =
    isSuperAdmin ||
    profile.canApproveVerifications;

  const canRevokeVerifications =
    isSuperAdmin ||
    profile.canRevokeVerifications;

  // ===================================================
  // CARREGAR PEDIDOS
  // ===================================================

  async function loadRequests() {
    if (!canManageVerifications) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

const params: Record<string, string> = {};

if (statusFilter !== 'ALL') {
  params.status = statusFilter;
}

if (
  verificationTypeFilter !== 'ALL'
) {
  params.type =
    verificationTypeFilter;
}

if (search.trim()) {
  params.q =
    search.trim();
}

      const res =
        await api.get<
          VerificationRequest[]
        >(
          '/admin/verification/requests',
          {
            params,
          },
        );

      setRequests(
        Array.isArray(res.data)
          ? res.data
          : [],
      );
    } catch (err: any) {

      setError(
        err?.response?.data?.message ??
          'Não foi possível carregar os pedidos de verificação.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // EFFECT
  // ===================================================

  useEffect(() => {
  void loadRequests();
}, [
  profile.userId,
  statusFilter,
  verificationTypeFilter,
]);

  // ===================================================
  // PESQUISA COM PEQUENO DEBOUNCE
  // ===================================================

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadRequests();
      }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  // ===================================================
// CONTROLO DA LISTA
// ===================================================

useEffect(() => {
  setVisibleRequestCount(10);
}, [
  statusFilter,
  verificationTypeFilter,
  search,
]);

const visibleRequests =
  requests.slice(
    0,
    visibleRequestCount,
  );

const hasMoreRequests =
  visibleRequestCount <
  requests.length;

  // ===================================================
  // ABRIR DETALHES
  // ===================================================

  async function openRequest(
    request: VerificationRequest,
  ) {
    try {
      setDetailLoading(true);
      setError('');
      setSuccess('');

      const res =
        await api.get<VerificationRequest>(
          `/admin/verification/requests/${request.id}`,
        );

      setSelectedRequest(
        res.data,
      );

      setRejectionReason(
        res.data.rejectionReason ??
          '',
      );
    } catch (err: any) {

      setError(
        err?.response?.data?.message ??
          'Não foi possível carregar os detalhes do pedido.',
      );
    } finally {
      setDetailLoading(false);
    }
  }

  // ===================================================
  // FECHAR DETALHES
  // ===================================================

  function closeRequest() {
    if (actionLoading) {
      return;
    }

    setSelectedRequest(null);
    setRejectionReason('');
  }

  // ===================================================
  // APROVAR
  // ===================================================

  async function approveRequest() {
    if (
      !selectedRequest ||
      selectedRequest.status !==
        'PENDING' ||
      !canApproveVerifications
    ) {
      return;
    }

    // Premium somente Super Admin.
    if (
      selectedRequest.requestedType ===
        'PREMIUM' &&
      !isSuperAdmin
    ) {
      setError(
        'A verificação Premium só pode ser aprovada pelo Super Admin.',
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Deseja aprovar a verificação ${getVerificationLabel(
          selectedRequest.requestedType,
        )} da banca "${selectedRequest.store.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const res =
        await api.patch<VerificationRequest>(
          `/admin/verification/requests/${selectedRequest.id}/approve`,
        );

      setSelectedRequest(
        res.data,
      );

      setRequests(current =>
        current.map(request =>
          request.id ===
          res.data.id
            ? res.data
            : request,
        ),
      );

      setSuccess(
        'Pedido de verificação aprovado com sucesso.',
      );
    } catch (err: any) {


      setError(
        err?.response?.data?.message ??
          'Não foi possível aprovar o pedido de verificação.',
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ===================================================
  // REJEITAR
  // ===================================================

  async function rejectRequest() {
    if (
      !selectedRequest ||
      selectedRequest.status !==
        'PENDING' ||
      !canApproveVerifications
    ) {
      return;
    }

    const reason =
      rejectionReason.trim();

    if (!reason) {
      setError(
        'Informe o motivo da rejeição.',
      );

      return;
    }

    if (reason.length > 500) {
      setError(
        'O motivo da rejeição pode ter no máximo 500 caracteres.',
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Deseja rejeitar o pedido de verificação da banca "${selectedRequest.store.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const res =
        await api.patch<VerificationRequest>(
          `/admin/verification/requests/${selectedRequest.id}/reject`,
          {
            rejectionReason:
              reason,
          },
        );

      setSelectedRequest(
        res.data,
      );

      setRequests(current =>
        current.map(request =>
          request.id ===
          res.data.id
            ? res.data
            : request,
        ),
      );

      setSuccess(
        'Pedido de verificação rejeitado.',
      );
    } catch (err: any) {


      setError(
        err?.response?.data?.message ??
          'Não foi possível rejeitar o pedido de verificação.',
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ===================================================
  // REVOGAR VERIFICAÇÃO
  //
  // Mantemos aqui também porque esta área
  // será o lugar natural para administrar
  // verificações já existentes.
  // ===================================================

  async function revokeVerification() {
    if (
      !selectedRequest ||
      !selectedRequest.store.verified ||
      !canRevokeVerifications
    ) {
      return;
    }

    if (
      selectedRequest.store.verificationType ===
        'PREMIUM' &&
      !isSuperAdmin
    ) {
      setError(
        'A verificação Premium só pode ser revogada pelo Super Admin.',
      );

      return;
    }

    const reason =
      window.prompt(
        'Informe o motivo da revogação:',
      );

    if (
      reason === null
    ) {
      return;
    }

    const trimmedReason =
      reason.trim();

    if (
      trimmedReason.length >
      500
    ) {
      setError(
        'O motivo pode ter no máximo 500 caracteres.',
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Deseja realmente revogar a verificação da banca "${selectedRequest.store.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      await api.patch(
        `/admin/verification/stores/${selectedRequest.store.id}/revoke`,
        {
          reason:
            trimmedReason,
        },
      );

      setSuccess(
        'Verificação revogada com sucesso.',
      );

      await loadRequests();

      // Atualiza os detalhes.
      const refreshed =
        await api.get<VerificationRequest>(
          `/admin/verification/requests/${selectedRequest.id}`,
        );

      setSelectedRequest(
        refreshed.data,
      );
    } catch (err: any) {

      setError(
        err?.response?.data?.message ??
          'Não foi possível revogar a verificação.',
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ===================================================
  // HELPERS
  // ===================================================

  function getVerificationLabel(
    type: VerificationType,
  ) {
    return type ===
      'PREMIUM'
      ? 'Premium'
      : 'Básica';
  }

  function getStatusLabel(
    status: VerificationRequestStatus,
  ) {
    switch (status) {
      case 'PENDING':
        return 'PENDENTE';

      case 'APPROVED':
        return 'APROVADO';

      case 'REJECTED':
        return 'REJEITADO';

      case 'CANCELLED':
        return 'CANCELADO';

      default:
        return status;
    }
  }

  function getStatusStyle(
    status: VerificationRequestStatus,
  ): CSSProperties {
    switch (status) {
      case 'PENDING':
        return styles.statusPending;

      case 'APPROVED':
        return styles.statusApproved;

      case 'REJECTED':
        return styles.statusRejected;

      case 'CANCELLED':
        return styles.statusCancelled;

      default:
        return {};
    }
  }

  function formatDate(
    value?: string | null,
  ) {
    if (!value) {
      return '—';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return '—';
    }

    return date.toLocaleString(
      'pt-MZ',
      {
        dateStyle: 'short',
        timeStyle: 'short',
      },
    );
  }

  // ===================================================
  // SEM PERMISSÃO
  // ===================================================

  if (
    !canManageVerifications
  ) {
    return null;
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <style>
        {responsiveCss}
      </style>

<PanelSection
  title="Pedidos de verificação"
  description="Analise e administre os pedidos enviados pelas bancas."
  icon={<ClipboardCheck size={20} strokeWidth={1.9} />}
  storageKey="adminPanel:verificationRequests"
  summary={`${requests.length} pedido${requests.length === 1 ? '' : 's'}`}
  actions={
    <button
      type="button"
      style={styles.refreshButton}
      onClick={() => void loadRequests()}
      disabled={loading || actionLoading}
    >
      ↻ Atualizar
    </button>
  }
>
  <div className="verification-admin-section">
    {/* tipo (Todas/Básicas/Premium), filtros, mensagens, lista e controlos: iguais */}

        {/* =============================================
            FILTROS
        ============================================= */}

{/* =================================================
 TIPO DE VERIFICAÇÃO
 ================================================= */}
  <div className="verification-type-tabs"
  style={styles.typeTabs} >
  <button type="button"
  style={{ ...styles.typeTab,
  ...(verificationTypeFilter === 'ALL'
  ? styles.typeTabActive : {}),
}}
  onClick={() =>
  setVerificationTypeFilter('ALL')
  } >
  Todas
  </button>

  <button
  type="button"
  style={{ ...styles.typeTab,
  ...(verificationTypeFilter === 'BASIC'
  ? styles.typeTabBasicActive : {}),
  }}
  onClick={() => setVerificationTypeFilter('BASIC')
  } >
  <span style={styles.basicDot}>
     ✓
     </span>
     Básicas
     </button>

     <button
     type="button"
     style={{ ...styles.typeTab,
     ...(verificationTypeFilter === 'PREMIUM'
     ? styles.typeTabPremiumActive : {}),
     }}
      onClick={() =>
      setVerificationTypeFilter('PREMIUM')
      } >
      <span
      style={styles.premiumDot}>
      ★
      </span>
      Premium
      </button>
      </div>

        <div
          className="verification-filters"
          style={styles.filters}
        >
          <div
            className="verification-tabs"
            style={styles.tabs}
          >
            {(
              [
                ['PENDING', 'Pendentes'],
                ['ALL', 'Todos'],
                ['APPROVED', 'Aprovados'],
                ['REJECTED', 'Rejeitados'],
                ['CANCELLED', 'Cancelados'],
              ] as const
            ).map(
              ([value, label]) => (
                <button
                  type="button"
                  key={value}
                  style={{
                    ...styles.tab,
                    ...(statusFilter ===
                    value
                      ? styles.tabActive
                      : {}),
                  }}
                  onClick={() =>
                    setStatusFilter(
                      value,
                    )
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Pesquisar banca..."
            style={styles.searchInput}
          />
        </div>

        {/* =============================================
            MENSAGENS
        ============================================= */}

        {error && (
          <div
            style={styles.errorBox}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={styles.successBox}
          >
            {success}
          </div>
        )}

        {/* =============================================
            LOADING
        ============================================= */}

        {loading ? (
          <div
            style={styles.emptyCard}
          >
            <strong>
              Carregando pedidos...
            </strong>

            <p
              style={styles.emptyText}
            >
              A consultar os pedidos de verificação.
            </p>
          </div>
        ) : requests.length ===
          0 ? (
          <div
            style={styles.emptyCard}
          >
            <div
              style={styles.emptyIcon}
            >
              ✓
            </div>

            <strong>
              Nenhum pedido encontrado.
            </strong>

            <p
              style={styles.emptyText}
            >
              Não existem pedidos nesta categoria.
            </p>
          </div>
        ) : (
          <div
            className="verification-grid"
            style={styles.grid}
          >
            {visibleRequests.map(
  request => (
                <article
                  key={request.id}
                  style={styles.card}
                >
                  <div
                    style={styles.cardTop}
                  >
                    <div
                      style={styles.storeIdentity}
                    >
                      <div
                        style={styles.storeAvatar}
                      >
                        {(
                          request.store.name ??
                          'B'
                        )
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div
                        style={
                          styles.storeInfo
                        }
                      >
                        <h3
                          style={
                            styles.storeName
                          }
                        >
                          {
                            request.store
                              .name
                          }
                        </h3>

                        <p
                          style={
                            styles.storeLocation
                          }
                        >
                          {request.store
                            .region ??
                            'Região não definida'}
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(
                          request.status,
                        ),
                      }}
                    >
                      {getStatusLabel(
                        request.status,
                      )}
                    </span>
                  </div>

                  <div
                    style={styles.cardDivider}
                  />

                  <div
                    style={styles.cardDetails}
                  >
                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Pedido
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {getVerificationLabel(
                          request.requestedType,
                        )}

                        {request.requestedType ===
                          'PREMIUM' && (
                          <span
                            style={
                              styles.premiumBadge
                            }
                          >
                            PREMIUM
                          </span>
                        )}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Enviado por
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {request.requestedBy
                          ?.name ??
                          request.requestedBy
                            ?.email ??
                          'Utilizador'}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Data
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {formatDate(
                          request.createdAt,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={styles.cardActions}
                  >
                    <button
                      type="button"
                      style={
                        styles.secondaryButton
                      }
                      onClick={() =>
                        void openRequest(
                          request,
                        )
                      }
                    >
                      Ver detalhes
                    </button>

                    {request.status ===
                      'PENDING' &&
                      canApproveVerifications &&
                      (request.requestedType !==
                        'PREMIUM' ||
                        isSuperAdmin) && (
                        <button
                          type="button"
                          style={
                            styles.primaryButton
                          }
                          onClick={() =>
                            void openRequest(
                              request,
                            )
                          }
                        >
                          Analisar
                        </button>
                      )}
                  </div>
                </article>
              ),
            )}
                    </div>
        )}
          {/* =============================================
              CONTROLO DA LISTA
          ============================================= */}

          {(requests.length > 10) && (
            <div
              style={styles.listControls}
            >
              <div
                style={styles.listControlsInfo}
              >
                A mostrar{' '}
                <strong>
                  {Math.min(
                    visibleRequestCount,
                    requests.length,
                  )}
                </strong>{' '}
                de{' '}
                <strong>
                  {requests.length}
                </strong>{' '}
                pedidos
              </div>

              <div
                style={styles.listControlsButtons}
              >
                {visibleRequestCount > 10 && (
                  <button
                    type="button"
                    style={styles.collapseButton}
                    onClick={() =>
                      setVisibleRequestCount(
                        Math.max(
                          10,
                          visibleRequestCount - 10,
                        ),
                      )
                    }
                  >
                    ↑ Recolher 10
                  </button>
                )}

                {hasMoreRequests && (
                  <button
                    type="button"
                    style={styles.moreButton}
                    onClick={() =>
                      setVisibleRequestCount(
                        Math.min(
                          visibleRequestCount + 10,
                          requests.length,
                        ),
                      )
                    }
                  >
                    ↓ Ver mais 10
                  </button>
                )}
              </div>
            </div>
          )}
      </div>
      </PanelSection>

      {/* =================================================
          MODAL DE DETALHES
      ================================================= */}

      {selectedRequest && (
        <div
          style={styles.overlay}
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeRequest();
            }
          }}
        >
          <div
            className="verification-modal"
            style={styles.modal}
          >
            {detailLoading ? (
              <div
                style={
                  styles.modalLoading
                }
              >
                Carregando detalhes...
              </div>
            ) : (
              <>
                {/* =======================================
                    HEADER
                ======================================= */}

                <div
                  style={
                    styles.modalHeader
                  }
                >
                  <div>
                    <div
                      style={
                        styles.eyebrow
                      }
                    >
                      PEDIDO DE VERIFICAÇÃO
                    </div>

                    <h2
                      style={
                        styles.modalTitle
                      }
                    >
                      {
                        selectedRequest
                          .store.name
                      }
                    </h2>

                    <p
                      style={
                        styles.modalSubtitle
                      }
                    >
                      Pedido{' '}
                      {getVerificationLabel(
                        selectedRequest.requestedType,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    style={
                      styles.closeButton
                    }
                    onClick={
                      closeRequest
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    ×
                  </button>
                </div>

                {/* =======================================
                    MENSAGENS
                ======================================= */}

                {error && (
                  <div
                    style={
                      styles.errorBox
                    }
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    style={
                      styles.successBox
                    }
                  >
                    {success}
                  </div>
                )}

                {/* =======================================
                    STATUS
                ======================================= */}

                <div
                  style={
                    styles.modalStatusRow
                  }
                >
                  <span
                    style={
                      styles.modalStatusLabel
                    }
                  >
                    Estado do pedido
                  </span>

                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(
                        selectedRequest.status,
                      ),
                    }}
                  >
                    {getStatusLabel(
                      selectedRequest.status,
                    )}
                  </span>
                </div>

                {/* =======================================
                    BANCA
                ======================================= */}

                <div
                  style={
                    styles.modalSection
                  }
                >
                  <h3
                    style={
                      styles.modalSectionTitle
                    }
                  >
                    Banca
                  </h3>

                  <div
                    className="modal-info-grid"
                    style={
                      styles.infoGrid
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Nome
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {
                          selectedRequest
                            .store.name
                        }
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Proprietário
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {selectedRequest
                          .store.owner
                          ?.name ??
                          selectedRequest
                            .store.owner
                            ?.email ??
                          '—'}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        País
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {
                          selectedRequest
                            .store
                            .countryCode ??
                          '—'
                        }
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Região
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {
                          selectedRequest
                            .store.region ??
                          '—'
                        }
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Avaliação
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {typeof selectedRequest
                          .store
                          .ratingAverage ===
                        'number'
                          ? selectedRequest.store.ratingAverage.toFixed(
                              1,
                            )
                          : '—'}{' '}
                        ⭐ (
                        {
                          selectedRequest
                            .store
                            .ratingCount
                        }{' '}
                        avaliações)
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Verificação atual
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {selectedRequest
                          .store
                          .verified
                          ? getVerificationLabel(
                              selectedRequest
                                .store
                                .verificationType ??
                                'BASIC',
                            )
                          : 'Não verificada'}
                      </strong>
                    </div>
                  </div>

                  {selectedRequest
                    .store
                    .regions &&
                    selectedRequest
                      .store
                      .regions
                      .length >
                      0 && (
                      <div
                        style={
                          styles.regionsBox
                        }
                      >
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          Regiões autorizadas
                        </span>

                        <div
                          style={
                            styles.regionChips
                          }
                        >
                          {selectedRequest
                            .store
                            .regions.map(
                              region => (
                                <span
                                  key={
                                    region.id
                                  }
                                  style={
                                    styles.regionChip
                                  }
                                >
                                  {
                                    region.region
                                  }
                                </span>
                              ),
                            )}
                        </div>
                      </div>
                    )}

                  {selectedRequest
                    .store
                    .regionalManagementLocked && (
                    <div
                      style={
                        styles.warningBox
                      }
                    >
                      <strong>
                        Gestão regional bloqueada
                      </strong>

                      <span>
                        Esta banca está sob gestão exclusiva do Super Admin.
                      </span>
                    </div>
                  )}
                </div>

                {/* =======================================
                    PEDIDO
                ======================================= */}

                <div
                  style={
                    styles.modalSection
                  }
                >
                  <h3
                    style={
                      styles.modalSectionTitle
                    }
                  >
                    Dados do pedido
                  </h3>

                  <div
                    className="modal-info-grid"
                    style={
                      styles.infoGrid
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Tipo solicitado
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {getVerificationLabel(
                          selectedRequest.requestedType,
                        )}

                        {selectedRequest.requestedType ===
                          'PREMIUM' && (
                          <span
                            style={
                              styles.premiumBadge
                            }
                          >
                            PREMIUM
                          </span>
                        )}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Solicitado por
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {selectedRequest
                          .requestedBy
                          ?.name ??
                          selectedRequest
                            .requestedBy
                            ?.email ??
                          '—'}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Data do pedido
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {formatDate(
                          selectedRequest.createdAt,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Analisado por
                      </span>

                      <strong
                        style={
                          styles.detailValue
                        }
                      >
                        {selectedRequest
                          .reviewedBy
                          ?.name ??
                          selectedRequest
                            .reviewedBy
                            ?.email ??
                          '—'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* =======================================
                    MOTIVO DA REJEIÇÃO
                ======================================= */}

                {selectedRequest.status ===
                  'REJECTED' && (
                  <div
                    style={
                      styles.modalSection
                    }
                  >
                    <h3
                      style={
                        styles.modalSectionTitle
                      }
                    >
                      Motivo da rejeição
                    </h3>

                    <div
                      style={
                        styles.rejectionDisplay
                      }
                    >
                      {selectedRequest
                        .rejectionReason ??
                        'Nenhum motivo informado.'}
                    </div>
                  </div>
                )}

                {/* =======================================
                    AÇÕES
                ======================================= */}

                {selectedRequest.status ===
                  'PENDING' &&
                  canApproveVerifications && (
                    <div
                      style={
                        styles.actionSection
                      }
                    >
                      <h3
                        style={
                          styles.modalSectionTitle
                        }
                      >
                        Decisão
                      </h3>

                      {selectedRequest.requestedType ===
                        'PREMIUM' &&
                        !isSuperAdmin ? (
                        <div
                          style={
                            styles.warningBox
                          }
                        >
                          <strong>
                            Premium
                          </strong>

                          <span>
                            Apenas o Super Admin pode aprovar ou rejeitar este pedido.
                          </span>
                        </div>
                      ) : (
                        <>
                          <label
                            style={
                              styles.fieldLabel
                            }
                          >
                            Motivo da rejeição
                            <span
                              style={
                                styles.optionalText
                              }
                            >
                              opcional até clicar em rejeitar
                            </span>
                          </label>

                          <textarea
                            value={
                              rejectionReason
                            }
                            onChange={event =>
                              setRejectionReason(
                                event.target
                                  .value,
                              )
                            }
                            maxLength={500}
                            rows={4}
                            placeholder="Explique ao proprietário por que o pedido foi rejeitado..."
                            style={
                              styles.textarea
                            }
                            disabled={
                              actionLoading
                            }
                          />

                          <div
                            style={
                              styles.characterCount
                            }
                          >
                            {
                              rejectionReason.length
                            }
                            /500
                          </div>

                          <div
                            className="verification-action-buttons"
                            style={
                              styles.actionButtons
                            }
                          >
                            <button
                              type="button"
                              style={
                                styles.dangerButton
                              }
                              onClick={() =>
                                void rejectRequest()
                              }
                              disabled={
                                actionLoading
                              }
                            >
                              {actionLoading
                                ? 'Processando...'
                                : 'Rejeitar pedido'}
                            </button>

                            <button
                              type="button"
                              style={
                                styles.primaryButton
                              }
                              onClick={() =>
                                void approveRequest()
                              }
                              disabled={
                                actionLoading
                              }
                            >
                              {actionLoading
                                ? 'Processando...'
                                : '✓ Aprovar pedido'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                {/* =======================================
                    REVOGAR
                ======================================= */}

                {selectedRequest
                  .store
                  .verified &&
                  canRevokeVerifications && (
                    <div
                      style={
                        styles.revokeSection
                      }
                    >
                      <div>
                        <h3
                          style={
                            styles.revokeTitle
                          }
                        >
                          Revogar verificação
                        </h3>

                        <p
                          style={
                            styles.revokeText
                          }
                        >
                          Remove a verificação atualmente atribuída a esta banca.
                        </p>
                      </div>

                      <button
                        type="button"
                        style={
                          styles.dangerButton
                        }
                        onClick={() =>
                          void revokeVerification()
                        }
                        disabled={
                          actionLoading
                        }
                      >
                        Revogar
                      </button>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// =====================================================
// CSS RESPONSIVO
// =====================================================

const responsiveCss = `
  .verification-admin-section {
    width: 100%;
    min-width: 0;
  }

  .verification-admin-section button,
  .verification-admin-section input,
  .verification-admin-section textarea {
    font-family: inherit;
  }

  .verification-admin-section button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .verification-tabs {
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .verification-grid {
    min-width: 0;
  }

  .verification-modal {
    overflow-x: hidden;
  }

  @media (max-width: 760px) {
    .verification-section-header {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    .verification-list-controls {
  flex-direction: column !important;
  align-items: stretch !important;
}

.verification-list-controls-buttons {
  width: 100%;
}

.verification-list-controls-buttons button {
  flex: 1;
}

    .verification-section-header button {
      width: 100%;
    }

    .verification-filters {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    .verification-tabs {
      width: 100%;
    }

    .verification-filters input {
      width: 100% !important;
    }

    .verification-grid {
      grid-template-columns: 1fr !important;
    }

    .verification-modal {
      width: calc(100vw - 24px) !important;
      max-width: none !important;
      max-height: calc(100vh - 24px) !important;
      padding: 17px !important;
      border-radius: 14px !important;
    }

    .modal-info-grid {
      grid-template-columns: 1fr !important;
    }

    .verification-action-buttons {
      flex-direction: column-reverse !important;
    }

    .verification-action-buttons button {
      width: 100%;
    }

    .verification-revoke-section {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    .verification-revoke-section button {
      width: 100%;
    }
  }

  @media (max-width: 420px) {
    .verification-modal {
      width: calc(100vw - 16px) !important;
      max-height: calc(100vh - 16px) !important;
      padding: 14px !important;
    }
  }
`;

// =====================================================
// ESTILOS
// =====================================================

const styles: Record<
  string,
  CSSProperties
> = {
  section: {
    width: '100%',
    marginBottom: '24px',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '20px',
    marginBottom: '16px',
  },

  eyebrow: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '1.2px',
    color:
      'var(--text-soft, #858890)',
    marginBottom: '4px',
  },

  title: {
    margin: 0,
    fontSize: '23px',
    fontWeight: 800,
    color:
      'var(--text, #17191d)',
  },

  description: {
    margin: '5px 0 0',
    fontSize: '14px',
    lineHeight: 1.5,
    color:
      'var(--text-soft, #74777e)',
  },

  refreshButton: {
    border:
      '1px solid var(--border, #dfe2e6)',
    borderRadius: '9px',
    padding: '9px 13px',
    minHeight: '38px',
    background:
      'var(--surface, #fff)',
    color:
      'var(--text, #292c31)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  filters: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
    padding: '6px',
    border:
      '1px solid var(--border, #e2e4e7)',
    borderRadius: '12px',
    background:
      'var(--surface, #fff)',
  },

  tabs: {
    display: 'flex',
    gap: '4px',
  },

  tab: {
    border: 0,
    borderRadius: '8px',
    padding: '8px 10px',
    background: 'transparent',
    color:
      'var(--text-soft, #73767d)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  tabActive: {
    background:
      'var(--surface-soft, #eef0f3)',
    color:
      'var(--text, #292c31)',
  },

  searchInput: {
    width: '230px',
    minHeight: '38px',
    border:
      '1px solid var(--border, #dfe2e6)',
    borderRadius: '8px',
    padding: '0 10px',
    outline: 'none',
    boxSizing: 'border-box',
    background:
      'var(--input-surface, #fff)',
    color:
      'var(--text, #292c31)',
    fontSize: '12px',
  },

  errorBox: {
    marginBottom: '14px',
    padding: '11px 13px',
    borderRadius: '9px',
    border:
      '1px solid var(--danger-border, #efcece)',
    background:
      'var(--danger-surface, #fff4f4)',
    color:
      'var(--danger, #a32e2e)',
    fontSize: '13px',
    fontWeight: 600,
  },

  successBox: {
    marginBottom: '14px',
    padding: '11px 13px',
    borderRadius: '9px',
    border:
      '1px solid var(--success-border, #ccebd4)',
    background:
      'var(--success-surface, #edf9f0)',
    color:
      'var(--success, #277641)',
    fontSize: '13px',
    fontWeight: 600,
  },

  emptyCard: {
    background:
      'var(--surface, #fff)',
    border:
      '1px solid var(--border, #e3e5e8)',
    borderRadius: '14px',
    padding: '30px',
    textAlign: 'center',
    color:
      'var(--text, #303338)',
  },

  emptyIcon: {
    width: '42px',
    height: '42px',
    margin: '0 auto 10px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'var(--success-surface, #edf9f0)',
    color:
      'var(--success, #277641)',
    fontWeight: 800,
    fontSize: '18px',
  },

  emptyText: {
    margin: '7px 0 0',
    color:
      'var(--text-soft, #777a81)',
    fontSize: '12px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '15px',
  },

  card: {
    background:
      'var(--surface, #fff)',
    border:
      '1px solid var(--border, #e2e4e7)',
    borderRadius: '14px',
    padding: '16px',
    boxShadow:
      'var(--card-shadow, 0 3px 14px rgba(0,0,0,.035))',
  },

  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },

  storeIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
  },

  storeAvatar: {
    width: '43px',
    height: '43px',
    flexShrink: 0,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'var(--surface-soft, #eef0f3)',
    color:
      'var(--text, #44474d)',
    fontWeight: 800,
    fontSize: '16px',
  },

  storeInfo: {
    minWidth: 0,
  },

  storeName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 800,
    color:
      'var(--text, #202227)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  storeLocation: {
    margin: '3px 0 0',
    fontSize: '11px',
    color:
      'var(--text-soft, #7b7e85)',
  },

  statusBadge: {
    padding: '5px 7px',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '.35px',
    whiteSpace: 'nowrap',
  },

  statusPending: {
    background:
      'var(--warning-surface, #fff0e7)',
    color:
      'var(--warning, #b95c20)',
  },

  statusApproved: {
    background:
      'var(--success-surface, #edf8f0)',
    color:
      'var(--success, #287d45)',
  },

  statusRejected: {
    background:
      'var(--danger-surface, #fff4f4)',
    color:
      'var(--danger, #a83232)',
  },

  statusCancelled: {
    background:
      'var(--surface-soft, #f0f1f3)',
    color:
      'var(--text-soft, #777a81)',
  },

  cardDivider: {
    marginTop: '14px',
    borderTop:
      '1px solid var(--border-soft, #eef0f2)',
  },

  cardDetails: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: '12px',
    marginTop: '14px',
  },

  detailLabel: {
    display: 'block',
    marginBottom: '3px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.35px',
    color:
      'var(--text-soft, #8c8f95)',
  },

  detailValue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color:
      'var(--text, #303338)',
    overflowWrap: 'anywhere',
  },

  premiumBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 5px',
    borderRadius: '5px',
    background:
      'var(--admin-super-bg, #eee8ff)',
    color:
      'var(--admin-super-text, #6741c8)',
    fontSize: '8px',
    fontWeight: 800,
    letterSpacing: '.35px',
  },

  cardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '7px',
    marginTop: '15px',
    paddingTop: '13px',
    borderTop:
      '1px solid var(--border-soft, #eef0f2)',
  },

  primaryButton: {
    border: 0,
    borderRadius: '9px',
    padding: '9px 13px',
    minHeight: '38px',
    background:
      'var(--button-primary, var(--text, #49443f))',
    color:
      'var(--button-primary-text, #ff7d03)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  secondaryButton: {
    border:
      '1px solid var(--border, #dfe2e6)',
    borderRadius: '9px',
    padding: '9px 12px',
    minHeight: '38px',
    background:
      'var(--surface, #fff)',
    color:
      'var(--text, #292c31)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  dangerButton: {
    border:
      '1px solid var(--danger-border, #efcaca)',
    borderRadius: '9px',
    padding: '9px 12px',
    minHeight: '38px',
    background:
      'var(--danger-surface, #fff6f6)',
    color:
      'var(--danger, #b72e2e)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    background:
      'var(--modal-backdrop, rgba(15,17,20,.48))',
  },

  modal: {
    width: '100%',
    maxWidth: '720px',
    maxHeight: '90vh',
    overflowY: 'auto',
    background:
      'var(--surface, #fff)',
    color:
      'var(--text, #202227)',
    borderRadius: '17px',
    padding: '22px',
    boxSizing: 'border-box',
    boxShadow:
      'var(--modal-shadow, 0 20px 60px rgba(0,0,0,.22))',
  },

  modalLoading: {
    padding: '40px 20px',
    textAlign: 'center',
    color:
      'var(--text-soft, #73767d)',
    fontSize: '14px',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '15px',
    marginBottom: '17px',
  },

  modalTitle: {
    margin: 0,
    fontSize: '21px',
    fontWeight: 800,
    color:
      'var(--text, #17191d)',
    lineHeight: 1.25,
  },

  modalSubtitle: {
    margin: '5px 0 0',
    fontSize: '13px',
    color:
      'var(--text-soft, #7a7d84)',
  },

  closeButton: {
    width: '34px',
    height: '34px',
    flexShrink: 0,
    border: 0,
    borderRadius: '8px',
    background:
      'var(--surface-soft, #f1f2f4)',
    color:
      'var(--text, #44474d)',
    fontSize: '23px',
    lineHeight: 1,
    cursor: 'pointer',
  },

  modalStatusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '11px 12px',
    borderRadius: '9px',
    background:
      'var(--surface-soft, #f4f5f6)',
  },

  modalStatusLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color:
      'var(--text-soft, #777a81)',
  },

  modalSection: {
    marginTop: '18px',
    paddingTop: '18px',
    borderTop:
      '1px solid var(--border-soft, #eceef0)',
  },

  modalSectionTitle: {
    margin: '0 0 13px',
    fontSize: '15px',
    fontWeight: 800,
    color:
      'var(--text, #25282d)',
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: '13px',
  },

  regionsBox: {
    marginTop: '15px',
    paddingTop: '13px',
    borderTop:
      '1px solid var(--border-soft, #eef0f2)',
  },

  regionChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginTop: '7px',
  },

  regionChip: {
    padding: '4px 7px',
    borderRadius: '6px',
    background:
      'var(--surface-soft, #eef1f4)',
    color:
      'var(--text, #45484e)',
    fontSize: '10px',
    fontWeight: 700,
  },

  warningBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginTop: '13px',
    padding: '11px 12px',
    borderRadius: '9px',
    border:
      '1px solid var(--warning-border, #efd7c5)',
    background:
      'var(--warning-surface, #fff7f0)',
    color:
      'var(--warning, #9a5729)',
    fontSize: '12px',
    lineHeight: 1.45,
  },

  actionSection: {
    marginTop: '18px',
    paddingTop: '18px',
    borderTop:
      '1px solid var(--border-soft, #eceef0)',
  },

  fieldLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '7px',
    fontSize: '12px',
    fontWeight: 700,
    color:
      'var(--text, #484b51)',
  },

  optionalText: {
    fontSize: '10px',
    fontWeight: 500,
    color:
      'var(--text-soft, #8b8e94)',
  },

  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '90px',
    border:
      '1px solid var(--border, #dfe2e6)',
    borderRadius: '9px',
    padding: '10px',
    outline: 'none',
    background:
      'var(--input-surface, #fff)',
    color:
      'var(--text, #292c31)',
    fontSize: '12px',
    lineHeight: 1.5,
  },

  characterCount: {
    marginTop: '4px',
    textAlign: 'right',
    fontSize: '10px',
    color:
      'var(--text-soft, #8b8e94)',
  },

  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '12px',
  },

  rejectionDisplay: {
    padding: '11px 12px',
    borderRadius: '9px',
    background:
      'var(--danger-surface, #fff6f6)',
    border:
      '1px solid var(--danger-border, #efd2d2)',
    color:
      'var(--danger-text, #805f5f)',
    fontSize: '12px',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },

  revokeSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginTop: '18px',
    padding: '15px',
    borderRadius: '11px',
    background:
      'var(--danger-surface, #fff8f8)',
    border:
      '1px solid var(--danger-border, #f0d3d3)',
  },

  revokeTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 800,
    color:
      'var(--danger, #a83232)',
  },

  revokeText: {
    margin: '4px 0 0',
    fontSize: '12px',
    color:
      'var(--danger-text, #8b6666)',
    lineHeight: 1.45,
  },

typeTabs: {
  display: 'flex',
  gap: '5px',
  marginBottom: '8px',
  flexWrap: 'wrap',
},

typeTab: {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',

  border:
    '1px solid var(--border, #dfe2e6)',

  borderRadius: '9px',

  padding: '8px 12px',

  background:
    'var(--surface, #fff)',

  color:
    'var(--text-soft, #73767d)',

  fontSize: '12px',
  fontWeight: 800,

  cursor: 'pointer',
},

typeTabActive: {
  background:
    'var(--surface-soft, #eef0f3)',

  color:
    'var(--text, #292c31)',
},

typeTabBasicActive: {
  background:
    'rgba(37, 99, 235, 0.10)',

  border:
    '1px solid rgba(37, 99, 235, 0.25)',

  color:
    '#2563eb',
},

typeTabPremiumActive: {
  background:
    'rgba(212, 160, 23, 0.12)',

  border:
    '1px solid rgba(212, 160, 23, 0.35)',

  color:
    '#a66a00',
},

basicDot: {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',

  width: '18px',
  height: '18px',

  borderRadius: '50%',

  background:
    'linear-gradient(145deg, #60a5fa, #2563eb)',

  color: '#fff',

  fontSize: '10px',
  fontWeight: 900,
},

premiumDot: {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',

  width: '18px',
  height: '18px',

  borderRadius: '50%',

  background:
    'linear-gradient(145deg, #ffe58a, #d4a017 55%, #a66a00)',

  color: '#fff8dc',

  fontSize: '10px',
  fontWeight: 900,

  boxShadow:
    '0 2px 6px rgba(212,160,23,.30)',
},

listControls: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginTop: '18px',
  padding: '12px 14px',
  border:
    '1px solid var(--border, #e2e4e7)',
  borderRadius: '12px',
  background:
    'var(--surface, #fff)',
  flexWrap: 'wrap',
},

listControlsInfo: {
  fontSize: '11px',
  color:
    'var(--text-soft, #777a81)',
},

listControlsButtons: {
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  flexWrap: 'wrap',
},

moreButton: {
  border: 0,
  borderRadius: '8px',
  padding: '8px 12px',
  minHeight: '36px',
  background:
    'var(--button-primary, var(--text, #49443f))',
  color:
    'var(--button-primary-text, #ff7d03)',
  fontSize: '11px',
  fontWeight: 800,
  cursor: 'pointer',
},

collapseButton: {
  border:
    '1px solid var(--border, #dfe2e6)',
  borderRadius: '8px',
  padding: '8px 12px',
  minHeight: '36px',
  background:
    'var(--surface, #fff)',
  color:
    'var(--text, #55585e)',
  fontSize: '11px',
  fontWeight: 800,
  cursor: 'pointer',
},
};