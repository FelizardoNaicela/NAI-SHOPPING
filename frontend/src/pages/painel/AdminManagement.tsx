import {
  useEffect,
  useState,
  type CSSProperties,
} from 'react';
import { Users } from 'lucide-react';
import PanelSection from '../../components/panel/PanelSection';
import { api } from '../../services/api';

export interface PainelProfile {
  id: string;
  userId: string;
  adminRole:
    | 'SUPER_ADMIN'
    | 'REGIONAL_ADMIN';
  status:
    | 'ACTIVE'
    | 'SUSPENDED';

  region?: string | null;

  canManageVerifications: boolean;
  canApproveVerifications: boolean;
  canRevokeVerifications: boolean;
  canManageStores: boolean;
  canManageRanking: boolean;
  canPromoteRegionalAdmins: boolean;

  user: {
    id: string;
    email: string;
    name?: string | null;
    countryCode?: string | null;
    region?: string | null;
  };
}

type PermissionKey =
  | 'canManageVerifications'
  | 'canApproveVerifications'
  | 'canRevokeVerifications'
  | 'canManageStores'
  | 'canManageRanking'
  | 'canPromoteRegionalAdmins';

interface PermissionItem {
  key: PermissionKey;
  label: string;
  description: string;
}

interface AdminItem {
  id: string;
  userId: string;
  adminRole:
    | 'SUPER_ADMIN'
    | 'REGIONAL_ADMIN';
  status:
    | 'ACTIVE'
    | 'SUSPENDED';

  region?: string | null;

  canManageVerifications: boolean;
  canApproveVerifications: boolean;
  canRevokeVerifications: boolean;
  canManageStores: boolean;
  canManageRanking: boolean;
  canPromoteRegionalAdmins: boolean;

  user: {
    id: string;
    email: string;
    name?: string | null;
    countryCode?: string | null;
    region?: string | null;
  };
}

interface CandidateUser {
  id: string;
  email: string;
  name?: string | null;
  countryCode?: string | null;
  region?: string | null;
}

interface PromotionPermissions {
  canManageVerifications: boolean;
  canApproveVerifications: boolean;
  canRevokeVerifications: boolean;
  canManageStores: boolean;
  canManageRanking: boolean;
  canPromoteRegionalAdmins: boolean;
}

interface AdminManagementProps {
  profile: PainelProfile;
}

const permissions: PermissionItem[] = [
  {
    key: 'canManageVerifications',
    label: 'Gerir verificações',
    description:
      'Permite administrar o processo de verificação das lojas.',
  },
  {
    key: 'canApproveVerifications',
    label: 'Aprovar verificações',
    description:
      'Permite aprovar pedidos de verificação.',
  },
  {
    key: 'canRevokeVerifications',
    label: 'Revogar verificações',
    description:
      'Permite remover uma verificação existente.',
  },
  {
    key: 'canManageStores',
    label: 'Gerir lojas',
    description:
      'Permite visualizar e alterar o estado das lojas.',
  },
  {
    key: 'canManageRanking',
    label: 'Gerir ranking',
    description:
      'Permite administrar o ranking nacional/regional.',
  },
  {
    key: 'canPromoteRegionalAdmins',
    label: 'Promover administradores regionais',
    description:
      'Permite promover utilizadores para administrador regional.',
  },
];

const emptyPermissions: PromotionPermissions = {
  canManageVerifications: false,
  canApproveVerifications: false,
  canRevokeVerifications: false,
  canManageStores: false,
  canManageRanking: false,
  canPromoteRegionalAdmins: false,
};

export default function AdminManagement({
  profile,
}: AdminManagementProps) {
  const [admins, setAdmins] =
    useState<AdminItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  // =========================================
  // CONTROLO DA LISTA
  // =========================================

  const [visibleAdminCount, setVisibleAdminCount] =
    useState(10);

  const [selectedAdmin, setSelectedAdmin] =
    useState<AdminItem | null>(null);

  const [editingPermissions, setEditingPermissions] =
    useState(false);

  const [permissionForm, setPermissionForm] =
    useState<PromotionPermissions>(
      emptyPermissions,
    );

  const [regionForm, setRegionForm] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [actionError, setActionError] =
    useState('');

  const [promotionOpen, setPromotionOpen] =
    useState(false);

  const [candidateSearch, setCandidateSearch] =
    useState('');

  const [candidateResults, setCandidateResults] =
    useState<CandidateUser[]>([]);

  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateUser | null>(null);

  const [promotionRegion, setPromotionRegion] =
    useState('');

  const [promotionPermissions, setPromotionPermissions] =
    useState<PromotionPermissions>(
      emptyPermissions,
    );

  const [searchingCandidates, setSearchingCandidates] =
    useState(false);

  const [promoting, setPromoting] =
    useState(false);


const [regionFilter, setRegionFilter] =
  useState('ALL');

const availableRegions = Array.from(
  new Set(
    admins
      .filter(admin => admin.adminRole !== 'SUPER_ADMIN')
      .map(admin =>
        (
          admin.region ??
          admin.user.region ??
          ''
        ).trim(),
      )
      .filter(Boolean),
  ),
).sort((a, b) =>
  a.localeCompare(b, 'pt'),
);

const filteredAdmins =
  regionFilter === 'ALL'
    ? admins
    : admins.filter(admin => {
        if (admin.adminRole === 'SUPER_ADMIN') {
          return false;
        }

        const region =
          (
            admin.region ??
            admin.user.region ??
            ''
          ).trim();

        return region === regionFilter;
      });

const visibleAdmins =
  filteredAdmins.slice(
    0,
    visibleAdminCount,
  );

const hasMoreAdmins =
  visibleAdminCount <
  filteredAdmins.length;

  const isSuperAdmin =
    profile.adminRole === 'SUPER_ADMIN';

  const canManageAdmins =
    isSuperAdmin ||
    profile.canPromoteRegionalAdmins;

  async function loadAdmins() {
    try {
      setLoading(true);
      setActionError('');

      const res =
        await api.get<AdminItem[]>(
          '/admin/admins',
        );

      setAdmins(
        Array.isArray(res.data)
          ? res.data
          : [],
      );

      // =====================================
      // SEMPRE COMEÇAR COM 10
      // =====================================

      setVisibleAdminCount(10);
    } catch (err: any) {


      setActionError(
        err?.response?.data?.message ??
          'Não foi possível carregar os administradores.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdmins();
  }, [profile.userId]);

  // =========================================
  // LISTA VISÍVEL
  // =========================================

  function canAssignPermission(
    key: PermissionKey,
  ) {
    if (isSuperAdmin) {
      return true;
    }

    if (
      key ===
      'canPromoteRegionalAdmins'
    ) {
      return false;
    }

    return profile[key] === true;
  }

  function openAdminManager(
    admin: AdminItem,
  ) {
    setSelectedAdmin(admin);

    setEditingPermissions(false);

    setPermissionForm({
      canManageVerifications:
        admin.canManageVerifications,
      canApproveVerifications:
        admin.canApproveVerifications,
      canRevokeVerifications:
        admin.canRevokeVerifications,
      canManageStores:
        admin.canManageStores,
      canManageRanking:
        admin.canManageRanking,
      canPromoteRegionalAdmins:
        admin.canPromoteRegionalAdmins,
    });

    setRegionForm(
      admin.region ??
        admin.user.region ??
        '',
    );

    setMessage('');
    setActionError('');
  }

  function closeAdminManager() {
    if (saving) {
      return;
    }

    setSelectedAdmin(null);
    setEditingPermissions(false);
    setMessage('');
    setActionError('');
  }

  function updatePermission(
    key: PermissionKey,
    value: boolean,
  ) {
    if (
      !selectedAdmin ||
      !canAssignPermission(key)
    ) {
      return;
    }

    setPermissionForm(
      current => ({
        ...current,
        [key]: value,
      }),
    );
  }

  async function savePermissions() {
    if (!selectedAdmin) {
      return;
    }

    setSaving(true);
    setMessage('');
    setActionError('');

    try {
      const payload: Partial<PromotionPermissions> =
        {};

      for (
        const permission of permissions
      ) {
        const key =
          permission.key;

        if (
          canAssignPermission(key)
        ) {
          payload[key] =
            permissionForm[key];
        }
      }

      const res =
        await api.patch<AdminItem>(
          `/admin/admins/${selectedAdmin.id}/permissions`,
          payload,
        );

      const updated =
        res.data;

      setAdmins(current =>
        current.map(admin =>
          admin.id === updated.id
            ? updated
            : admin,
        ),
      );

      setSelectedAdmin(updated);

      setPermissionForm({
        canManageVerifications:
          updated.canManageVerifications,
        canApproveVerifications:
          updated.canApproveVerifications,
        canRevokeVerifications:
          updated.canRevokeVerifications,
        canManageStores:
          updated.canManageStores,
        canManageRanking:
          updated.canManageRanking,
        canPromoteRegionalAdmins:
          updated.canPromoteRegionalAdmins,
      });

      setEditingPermissions(false);

      setMessage(
        'Permissões atualizadas com sucesso.',
      );
    } catch (err: any) {

      setActionError(
        err?.response?.data?.message ??
          'Não foi possível atualizar as permissões.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveRegion() {
    if (
      !selectedAdmin ||
      !isSuperAdmin
    ) {
      return;
    }

    const region =
      regionForm.trim();

    if (!region) {
      setActionError(
        'Informe uma região.',
      );

      return;
    }

    setSaving(true);
    setMessage('');
    setActionError('');

    try {
      const res =
        await api.patch<AdminItem>(
          `/admin/admins/${selectedAdmin.id}/region`,
          {
            region,
          },
        );

      const updated =
        res.data;

      setAdmins(current =>
        current.map(admin =>
          admin.id === updated.id
            ? updated
            : admin,
        ),
      );

      setSelectedAdmin(updated);

      setRegionForm(
        updated.region ??
          updated.user.region ??
          '',
      );

      setMessage(
        'Região atualizada com sucesso.',
      );
    } catch (err: any) {

      setActionError(
        err?.response?.data?.message ??
          'Não foi possível atualizar a região.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeAdminStatus(
    admin: AdminItem,
  ) {
    const action =
      admin.status === 'ACTIVE'
        ? 'suspender'
        : 'reativar';

    const confirmed =
      window.confirm(
        `Deseja realmente ${action} o administrador ${admin.user.name ?? admin.user.email}?`,
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage('');
    setActionError('');

    try {
      const endpoint =
        admin.status === 'ACTIVE'
          ? `/admin/admins/${admin.id}/suspend`
          : `/admin/admins/${admin.id}/reactivate`;

      const res =
        await api.patch<AdminItem>(
          endpoint,
        );

      const updated =
        res.data;

      setAdmins(current =>
        current.map(item =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      if (
        selectedAdmin?.id ===
        updated.id
      ) {
        setSelectedAdmin(updated);
      }

      setMessage(
        admin.status === 'ACTIVE'
          ? 'Administrador suspenso com sucesso.'
          : 'Administrador reativado com sucesso.',
      );
    } catch (err: any) {

      setActionError(
        err?.response?.data?.message ??
          'Não foi possível alterar o estado do administrador.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function demoteAdmin(
    admin: AdminItem,
  ) {
    const confirmed =
      window.confirm(
        `Deseja realmente remover ${admin.user.name ?? admin.user.email} da administração?`,
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage('');
    setActionError('');

    try {
      await api.patch(
        `/admin/admins/${admin.id}/demote`,
      );

      setAdmins(current =>
        current.filter(
          item =>
            item.id !== admin.id,
        ),
      );

      if (
        selectedAdmin?.id ===
        admin.id
      ) {
        setSelectedAdmin(null);
      }

      setMessage(
        'Administrador removido com sucesso.',
      );
    } catch (err: any) {

      setActionError(
        err?.response?.data?.message ??
          'Não foi possível remover o administrador.',
      );
    } finally {
      setSaving(false);
    }
  }

  function openPromotionModal() {
    if (!canManageAdmins) {
      return;
    }

    setPromotionOpen(true);
    setCandidateSearch('');
    setCandidateResults([]);
    setSelectedCandidate(null);
    setPromotionRegion(
      profile.region ?? '',
    );
    setPromotionPermissions(
      emptyPermissions,
    );
    setActionError('');
  }

  function closePromotionModal() {
    if (promoting) {
      return;
    }

    setPromotionOpen(false);
    setCandidateSearch('');
    setCandidateResults([]);
    setSelectedCandidate(null);
    setPromotionRegion('');
    setPromotionPermissions(
      emptyPermissions,
    );
  }

  async function searchCandidates(
    value: string,
  ) {
    setCandidateSearch(value);
    setSelectedCandidate(null);

    if (
      value.trim().length < 2
    ) {
      setCandidateResults([]);
      return;
    }

    setSearchingCandidates(true);
    setActionError('');

    try {
      const res =
        await api.get<CandidateUser[]>(
          '/admin/admins/candidates',
          {
            params: {
              q: value.trim(),
            },
          },
        );

      setCandidateResults(
        Array.isArray(res.data)
          ? res.data
          : [],
      );
    } catch (err: any) {

      setCandidateResults([]);

      setActionError(
        err?.response?.data?.message ??
          'Não foi possível procurar utilizadores.',
      );
    } finally {
      setSearchingCandidates(false);
    }
  }

  function selectCandidate(
    candidate: CandidateUser,
  ) {
    setSelectedCandidate(candidate);

    setCandidateSearch(
      candidate.name ??
        candidate.email,
    );

    setCandidateResults([]);
  }

  function updatePromotionPermission(
    key: PermissionKey,
    value: boolean,
  ) {
    if (
      !canAssignPermission(key)
    ) {
      return;
    }

    setPromotionPermissions(
      current => ({
        ...current,
        [key]: value,
      }),
    );
  }

  async function promoteCandidate() {
    if (!selectedCandidate) {
      setActionError(
        'Selecione um utilizador.',
      );

      return;
    }

    const region =
      promotionRegion.trim();

    if (!region) {
      setActionError(
        'Informe a região do administrador.',
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Deseja promover ${selectedCandidate.name ?? selectedCandidate.email} para administrador regional?`,
      );

    if (!confirmed) {
      return;
    }

    setPromoting(true);
    setActionError('');

    try {
      const payloadPermissions: Partial<PromotionPermissions> =
        {};

      for (
        const permission of permissions
      ) {
        const key =
          permission.key;

        if (
          canAssignPermission(key)
        ) {
          payloadPermissions[key] =
            promotionPermissions[key];
        }
      }

      await api.post(
        '/admin/admins/regional',
        {
          userId:
            selectedCandidate.id,
          region,
          permissions:
            payloadPermissions,
        },
      );

      closePromotionModal();

      await loadAdmins();
    } catch (err: any) {

      setActionError(
        err?.response?.data?.message ??
          'Não foi possível promover o administrador.',
      );
    } finally {
      setPromoting(false);
    }
  }

  return (
    <>
      <style>
        {`
          .admin-management-section {
            width: 100%;
          }

          .admin-management-section button,
          .admin-management-section input {
            font-family: inherit;
          }

          .admin-management-section button:disabled {
            opacity: .55;
            cursor: not-allowed;
          }

          .admin-management-modal {
            overflow-x: hidden;
          }

          .admin-management-modal input::placeholder {
            color: var(--text-soft, #858890);
          }

          .admin-management-modal button:hover:not(:disabled) {
            filter: brightness(.97);
          }

          /* =====================================
             CONTROLES DA LISTA
          ===================================== */

          .admin-list-controls {
            flex-direction: row;
          }

          .admin-list-controls-buttons {
            display: flex;
            align-items: center;
            gap: 7px;
            flex-wrap: wrap;
          }

          .admin-list-controls-buttons button {
            white-space: nowrap;
          }

          @media (max-width: 760px) {
            .admin-management-section .admin-section-header {
              flex-direction: column;
              align-items: stretch !important;
              gap: 14px !important;
            }

            .admin-management-section .admin-primary-button {
              width: 100%;
              justify-content: center;
            }

            .admin-management-section .admin-grid {
              grid-template-columns: 1fr !important;
            }

            .admin-management-section .admin-card {
              padding: 15px !important;
            }

            .admin-management-section .admin-top {
              gap: 9px !important;
            }

            .admin-management-section .admin-status {
              flex-shrink: 0;
            }

            .admin-management-section .admin-actions {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .admin-management-section .admin-actions button {
              width: 100%;
            }

            /* =================================
               CONTROLES DA LISTA NO MOBILE
            ================================= */

            .admin-list-controls {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .admin-list-controls-buttons {
              width: 100%;
            }

            .admin-list-controls-buttons button {
              flex: 1;
            }

            .admin-management-modal {
              width: calc(100vw - 24px) !important;
              max-width: none !important;
              max-height: calc(100vh - 24px) !important;
              padding: 17px !important;
              border-radius: 14px !important;
            }

            .admin-management-modal .modal-header {
              gap: 10px !important;
            }

            .admin-management-modal .modal-title {
              font-size: 18px !important;
            }

            .admin-management-modal .modal-actions {
              flex-direction: column-reverse !important;
            }

            .admin-management-modal .modal-actions button {
              width: 100%;
            }

            .admin-management-modal .region-row {
              flex-direction: column !important;
            }

            .admin-management-modal .region-row button {
              width: 100%;
            }

            .admin-management-modal .danger-section {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .admin-management-modal .danger-section button {
              width: 100%;
            }

            .admin-management-modal .candidate-list {
              max-height: 180px !important;
            }

            .admin-management-modal .permission-row {
              padding: 10px !important;
            }
          }

          @media (max-width: 420px) {
            .admin-management-section .admin-top {
              flex-direction: column !important;
            }

            .admin-management-section .admin-status {
              align-self: flex-start;
            }

            .admin-management-section .admin-meta {
              grid-template-columns: 1fr !important;
            }

            .admin-management-modal {
              width: calc(100vw - 16px) !important;
              max-height: calc(100vh - 16px) !important;
              padding: 14px !important;
            }

            .admin-management-modal .modal-header {
              margin-bottom: 12px !important;
            }

            .admin-management-modal .close-button {
              width: 31px !important;
              height: 31px !important;
              font-size: 21px !important;
            }

            .admin-management-modal .modal-section {
              margin-top: 14px !important;
              padding-top: 14px !important;
            }
          }
        `}
      </style>

      <PanelSection
  title="Administradores"
  description="Gerir administradores, permissões e autoridade regional."
  icon={<Users size={20} strokeWidth={1.9} />}
  storageKey="adminPanel:admins"
  summary={
    loading
      ? undefined
      : `${admins.length} administrador${admins.length === 1 ? '' : 'es'}`
  }
  actions={
    canManageAdmins ? (
      <button
        type="button"
        className="admin-primary-button"
        style={styles.primaryButton}
        onClick={openPromotionModal}
      >
        + Promover administrador
      </button>
    ) : undefined
  }
>
  <div
    className="admin-management-section"
    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
  >
    <div className="admin-management-filters">
      <label>
        <span>Região</span>

        <select
          value={regionFilter}
          onChange={event => {
            setRegionFilter(event.target.value);
            setVisibleAdminCount(10);
          }}
        >
          <option value="ALL">Todas as regiões</option>

          {availableRegions.map(region => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </label>
    </div>

    {/* daqui para baixo fica tudo igual:
        {actionError && ...}
        {loading ? ... : admins.length === 0 ? ... : (<>...</>)} */}

        {actionError && (
          <div style={styles.errorBox}>
            {actionError}
          </div>
        )}

        {loading ? (
          <div style={styles.emptyCard}>
            <strong>
              Carregando administradores...
            </strong>
          </div>
        ) : admins.length === 0 ? (
          <div style={styles.emptyCard}>
            <strong>
              Nenhum administrador encontrado.
            </strong>
          </div>
        ) : (
          <>
            <div
              className="admin-grid"
              style={styles.adminGrid}
            >
              {visibleAdmins.map(admin => {
                const isSelf =
                  admin.userId ===
                  profile.userId;

                return (
                  <article
                    key={admin.id}
                    className="admin-card"
                    style={styles.adminCard}
                  >
                    <div
                      className="admin-top"
                      style={styles.adminTop}
                    >
                      <div style={styles.adminIdentity}>
                        <div style={styles.adminAvatar}>
                          {(
                            admin.user.name ??
                            admin.user.email ??
                            'A'
                          )
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div style={styles.adminInfo}>
                          <h3 style={styles.adminName}>
                            {admin.user.name ??
                              'Sem nome'}
                          </h3>

                          <p style={styles.adminEmail}>
                            {admin.user.email}
                          </p>
                        </div>
                      </div>

                      <span
                        className="admin-status"
                        style={{
                          ...styles.statusBadge,
                          ...(admin.status ===
                          'ACTIVE'
                            ? styles.statusActive
                            : styles.statusSuspended),
                        }}
                      >
                        {admin.status ===
                        'ACTIVE'
                          ? 'ATIVO'
                          : 'SUSPENSO'}
                      </span>
                    </div>

                    <div style={styles.adminMeta}>
                      <div>
                        <span style={styles.smallLabel}>
                          Função
                        </span>

                        <strong style={styles.smallValue}>
                          {admin.adminRole ===
                          'SUPER_ADMIN'
                            ? 'Super Admin'
                            : 'Admin Regional'}
                        </strong>
                      </div>

                      <div>
                        <span style={styles.smallLabel}>
                          Região
                        </span>

                        <strong style={styles.smallValue}>
                          {admin.adminRole ===
                          'SUPER_ADMIN'
                            ? 'Global'
                            : admin.region ??
                              admin.user.region ??
                              'Não definida'}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.permissionSummary}>
                      {permissions.map(
                        permission => (
                          <span
                            key={
                              permission.key
                            }
                            style={{
                              ...styles.permissionChip,
                              ...(admin[
                                permission.key
                              ]
                                ? styles.permissionEnabled
                                : styles.permissionDisabled),
                            }}
                          >
                            {admin[
                              permission.key
                            ]
                              ? '✓'
                              : '×'}{' '}
                            {permission.label}
                          </span>
                        ),
                      )}
                    </div>

                    <div
                      className="admin-actions"
                      style={styles.adminActions}
                    >
                      <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() =>
                          openAdminManager(
                            admin,
                          )
                        }
                      >
                        Gerir
                      </button>

                      {canManageAdmins &&
                        !isSelf && (
                          <>
                            <button
                              type="button"
                              style={
                                styles.secondaryButton
                              }
                              onClick={() =>
                                void changeAdminStatus(
                                  admin,
                                )
                              }
                              disabled={
                                saving
                              }
                            >
                              {admin.status ===
                              'ACTIVE'
                                ? 'Suspender'
                                : 'Reativar'}
                            </button>

                            <button
                              type="button"
                              style={
                                styles.dangerButton
                              }
                              onClick={() =>
                                void demoteAdmin(
                                  admin,
                                )
                              }
                              disabled={
                                saving
                              }
                            >
                              Demitir
                            </button>
                          </>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* =====================================
                CONTROLOS DA LISTA
            ===================================== */}

            {admins.length > 10 && (
              <div
                className="admin-list-controls"
                style={styles.listControls}
              >
                <div style={styles.listControlsInfo}>
                  A mostrar{' '}
                  <strong>
                    {Math.min(
                      visibleAdminCount,
                      admins.length,
                    )}
                  </strong>{' '}
                  de{' '}
                  <strong>
                    {admins.length}
                  </strong>{' '}
                  administradores
                </div>

                <div
                  className="admin-list-controls-buttons"
                  style={
                    styles.listControlsButtons
                  }
                >
                  {visibleAdminCount > 10 && (
                    <button
                      type="button"
                      style={
                        styles.collapseButton
                      }
                      onClick={() =>
                        setVisibleAdminCount(
                          Math.max(
                            10,
                            visibleAdminCount -
                              10,
                          ),
                        )
                      }
                    >
                      ↑ Recolher 10
                    </button>
                  )}

                  {hasMoreAdmins && (
                    <button
                      type="button"
                      style={
                        styles.moreButton
                      }
                      onClick={() =>
                        setVisibleAdminCount(
                          Math.min(
                            visibleAdminCount +
                              10,
                            admins.length,
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
          </>
        )}
        </div>
</PanelSection>

      {/* =========================================
          MODAL DE GESTÃO DO ADMINISTRADOR
      ========================================= */}

      {selectedAdmin && (
        <div
          style={styles.overlay}
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAdminManager();
            }
          }}
        >
          <div
            className="admin-management-modal"
            style={styles.modal}
          >
            <div
              className="modal-header"
              style={styles.modalHeader}
            >
              <div>
                <div style={styles.sectionEyebrow}>
                  ADMINISTRADOR
                </div>

                <h2
                  className="modal-title"
                  style={styles.modalTitle}
                >
                  {selectedAdmin.user.name ??
                    selectedAdmin.user.email}
                </h2>

                <p style={styles.modalSubtitle}>
                  {selectedAdmin.user.email}
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                style={styles.closeButton}
                onClick={
                  closeAdminManager
                }
                disabled={saving}
              >
                ×
              </button>
            </div>

            {message && (
              <div style={styles.successBox}>
                {message}
              </div>
            )}

            {actionError && (
              <div style={styles.errorBox}>
                {actionError}
              </div>
            )}

            <div
              className="modal-section"
              style={styles.modalSection}
            >
              <div style={styles.modalSectionHeader}>
                <div>
                  <h3 style={styles.modalSectionTitle}>
                    Permissões
                  </h3>

                  <p style={styles.modalSectionText}>
                    Define o que este administrador pode fazer.
                  </p>
                </div>

                {!editingPermissions &&
                  canManageAdmins &&
                  selectedAdmin.adminRole !==
                    'SUPER_ADMIN' && (
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() =>
                        setEditingPermissions(
                          true,
                        )
                      }
                    >
                      Editar
                    </button>
                  )}
              </div>

              <div style={styles.permissionList}>
                {permissions.map(
                  permission => {
                    const allowed =
                      canAssignPermission(
                        permission.key,
                      );

                    const checked =
                      permissionForm[
                        permission.key
                      ];

                    return (
                      <label
                        key={
                          permission.key
                        }
                        className="permission-row"
                        style={{
                          ...styles.permissionRow,
                          ...(allowed
                            ? {}
                            : styles.permissionRowDisabled),
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            checked
                          }
                          disabled={
                            !editingPermissions ||
                            !allowed ||
                            saving ||
                            selectedAdmin.adminRole ===
                              'SUPER_ADMIN'
                          }
                          onChange={event =>
                            updatePermission(
                              permission.key,
                              event.target
                                .checked,
                            )
                          }
                        />

                        <span
                          style={
                            styles.permissionContent
                          }
                        >
                          <strong
                            style={
                              styles.permissionLabel
                            }
                          >
                            {
                              permission.label
                            }
                          </strong>

                          <span
                            style={
                              styles.permissionDescription
                            }
                          >
                            {
                              permission.description
                            }
                          </span>
                        </span>
                      </label>
                    );
                  },
                )}
              </div>

              {editingPermissions && (
                <div
                  className="modal-actions"
                  style={styles.modalActions}
                >
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => {
                      setEditingPermissions(
                        false,
                      );

                      setPermissionForm({
                        canManageVerifications:
                          selectedAdmin.canManageVerifications,
                        canApproveVerifications:
                          selectedAdmin.canApproveVerifications,
                        canRevokeVerifications:
                          selectedAdmin.canRevokeVerifications,
                        canManageStores:
                          selectedAdmin.canManageStores,
                        canManageRanking:
                          selectedAdmin.canManageRanking,
                        canPromoteRegionalAdmins:
                          selectedAdmin.canPromoteRegionalAdmins,
                      });
                    }}
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={() =>
                      void savePermissions()
                    }
                    disabled={saving}
                  >
                    {saving
                      ? 'Salvando...'
                      : 'Salvar permissões'}
                  </button>
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div
                className="modal-section"
                style={styles.modalSection}
              >
                <div style={styles.modalSectionHeader}>
                  <div>
                    <h3 style={styles.modalSectionTitle}>
                      Região
                    </h3>

                    <p style={styles.modalSectionText}>
                      Apenas o Super Admin pode alterar a região.
                    </p>
                  </div>
                </div>

                <div
                  className="region-row"
                  style={styles.regionRow}
                >
                  <input
                    value={regionForm}
                    onChange={event =>
                      setRegionForm(
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    placeholder="Ex.: Maputo"
                    disabled={saving}
                  />

                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() =>
                      void saveRegion()
                    }
                    disabled={saving}
                  >
                    Salvar região
                  </button>
                </div>
              </div>
            )}

            <div
              className="modal-section"
              style={styles.modalSection}
            >
              <div style={styles.modalSectionHeader}>
                <div>
                  <h3 style={styles.modalSectionTitle}>
                    Estado
                  </h3>

                  <p style={styles.modalSectionText}>
                    {selectedAdmin.status ===
                    'ACTIVE'
                      ? 'Este administrador está ativo.'
                      : 'Este administrador está suspenso.'}
                  </p>
                </div>

                {selectedAdmin.userId !==
                  profile.userId && (
                  <button
                    type="button"
                    style={
                      selectedAdmin.status ===
                      'ACTIVE'
                        ? styles.secondaryButton
                        : styles.primaryButton
                    }
                    onClick={() =>
                      void changeAdminStatus(
                        selectedAdmin,
                      )
                    }
                    disabled={saving}
                  >
                    {selectedAdmin.status ===
                    'ACTIVE'
                      ? 'Suspender'
                      : 'Reativar'}
                  </button>
                )}
              </div>
            </div>

            {canManageAdmins &&
              selectedAdmin.userId !==
                profile.userId && (
                <div
                  className="danger-section"
                  style={styles.dangerSection}
                >
                  <div>
                    <h3
                      style={
                        styles.dangerTitle
                      }
                    >
                      Remover administração
                    </h3>

                    <p
                      style={
                        styles.dangerText
                      }
                    >
                      O utilizador deixará de possuir perfil administrativo.
                    </p>
                  </div>

                  <button
                    type="button"
                    style={
                      styles.dangerButton
                    }
                    onClick={() =>
                      void demoteAdmin(
                        selectedAdmin,
                      )
                    }
                    disabled={saving}
                  >
                    Remover administrador
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {/* =========================================
          MODAL DE PROMOÇÃO
      ========================================= */}

      {promotionOpen && (
        <div
          style={styles.overlay}
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePromotionModal();
            }
          }}
        >
          <div
            className="admin-management-modal"
            style={styles.modal}
          >
            <div
              className="modal-header"
              style={styles.modalHeader}
            >
              <div>
                <div style={styles.sectionEyebrow}>
                  ADMINISTRAÇÃO
                </div>

                <h2
                  className="modal-title"
                  style={styles.modalTitle}
                >
                  Promover administrador regional
                </h2>

                <p style={styles.modalSubtitle}>
                  Escolha um utilizador e defina a região e permissões.
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                style={styles.closeButton}
                onClick={
                  closePromotionModal
                }
                disabled={promoting}
              >
                ×
              </button>
            </div>

            {actionError && (
              <div style={styles.errorBox}>
                {actionError}
              </div>
            )}

            <div
              className="modal-section"
              style={styles.modalSection}
            >
              <label style={styles.fieldLabel}>
                Utilizador
              </label>

              <input
                value={candidateSearch}
                onChange={event =>
                  void searchCandidates(
                    event.target.value,
                  )
                }
                style={styles.input}
                placeholder="Digite nome ou email..."
                disabled={promoting}
              />

              {searchingCandidates && (
                <div style={styles.searchInfo}>
                  Procurando utilizadores...
                </div>
              )}

              {candidateResults.length >
                0 && (
                <div
                  className="candidate-list"
                  style={
                    styles.candidateList
                  }
                >
                  {candidateResults.map(
                    candidate => (
                      <button
                        type="button"
                        key={
                          candidate.id
                        }
                        style={
                          styles.candidateItem
                        }
                        onClick={() =>
                          selectCandidate(
                            candidate,
                          )
                        }
                      >
                        <strong>
                          {candidate.name ??
                            'Sem nome'}
                        </strong>

                        <span>
                          {
                            candidate.email
                          }
                        </span>

                        {candidate.region && (
                          <small>
                            {candidate.region}
                          </small>
                        )}
                      </button>
                    ),
                  )}
                </div>
              )}

              {selectedCandidate && (
                <div
                  style={
                    styles.selectedCandidate
                  }
                >
                  <strong>
                    {selectedCandidate.name ??
                      'Sem nome'}
                  </strong>

                  <span>
                    {
                      selectedCandidate.email
                    }
                  </span>
                </div>
              )}
            </div>

            <div
              className="modal-section"
              style={styles.modalSection}
            >
              <label style={styles.fieldLabel}>
                Região
              </label>

              <input
                value={promotionRegion}
                onChange={event =>
                  setPromotionRegion(
                    event.target.value,
                  )
                }
                style={styles.input}
                placeholder="Ex.: Maputo"
                disabled={promoting}
              />
            </div>

            <div
              className="modal-section"
              style={styles.modalSection}
            >
              <div>
                <h3 style={styles.modalSectionTitle}>
                  Permissões iniciais
                </h3>

                <p style={styles.modalSectionText}>
                  As permissões podem ser alteradas posteriormente.
                </p>
              </div>

              <div
                style={
                  styles.permissionList
                }
              >
                {permissions.map(
                  permission => {
                    const allowed =
                      canAssignPermission(
                        permission.key,
                      );

                    return (
                      <label
                        key={
                          permission.key
                        }
                        className="permission-row"
                        style={{
                          ...styles.permissionRow,
                          ...(allowed
                            ? {}
                            : styles.permissionRowDisabled),
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            promotionPermissions[
                              permission.key
                            ]
                          }
                          disabled={
                            !allowed ||
                            promoting
                          }
                          onChange={event =>
                            updatePromotionPermission(
                              permission.key,
                              event.target
                                .checked,
                            )
                          }
                        />

                        <span
                          style={
                            styles.permissionContent
                          }
                        >
                          <strong
                            style={
                              styles.permissionLabel
                            }
                          >
                            {
                              permission.label
                            }
                          </strong>

                          <span
                            style={
                              styles.permissionDescription
                            }
                          >
                            {
                              permission.description
                            }
                          </span>
                        </span>
                      </label>
                    );
                  },
                )}
              </div>
            </div>

            <div
              className="modal-actions"
              style={styles.modalActions}
            >
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={
                  closePromotionModal
                }
                disabled={promoting}
              >
                Cancelar
              </button>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={() =>
                  void promoteCandidate()
                }
                disabled={
                  promoting ||
                  !selectedCandidate
                }
              >
                {promoting
                  ? 'Promovendo...'
                  : 'Promover administrador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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

  sectionEyebrow: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '1.2px',
    color: 'var(--text-soft, #858890)',
    marginBottom: '4px',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '23px',
    fontWeight: 800,
    color: 'var(--text, #17191d)',
  },

  sectionDescription: {
    margin: '5px 0 0',
    fontSize: '14px',
    color: 'var(--text-soft, #74777e)',
    lineHeight: 1.5,
  },

  primaryButton: {
    border: 0,
    borderRadius: '9px',
    padding: '10px 14px',
    background: 'var(--button-primary, var(--text, #49443f))',
    color: 'var(--button-primary-text, #ff7d03)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minHeight: '40px',
  },

  secondaryButton: {
    border: '1px solid var(--border, #dfe2e6)',
    borderRadius: '9px',
    padding: '9px 12px',
    background: 'var(--surface, #fff)',
    color: 'var(--text, #292c31)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: '38px',
  },

  dangerButton: {
    border: '1px solid var(--danger-border, #efcaca)',
    borderRadius: '9px',
    padding: '9px 12px',
    background: 'var(--danger-surface, #fff6f6)',
    color: 'var(--danger, #b72e2e)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: '38px',
  },

  emptyCard: {
    background: 'var(--surface, #fff)',
    border: '1px solid var(--border, #e3e5e8)',
    borderRadius: '14px',
    padding: '28px',
    color: 'var(--text-soft, #6e7178)',
    fontSize: '14px',
  },

  adminGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(310px, 1fr))',
    gap: '16px',
  },

  adminCard: {
    background: 'var(--surface, #fff)',
    border: '1px solid var(--border, #e2e4e7)',
    borderRadius: '15px',
    padding: '18px',
    boxShadow:
      'var(--card-shadow, 0 3px 14px rgba(0,0,0,.035))',
  },

  adminTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },

  adminIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    minWidth: 0,
  },

  adminAvatar: {
    width: '43px',
    height: '43px',
    borderRadius: '50%',
    background: 'var(--surface-soft, #eceef1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 800,
    color: 'var(--text, #4a4d53)',
    flexShrink: 0,
  },

  adminInfo: {
    minWidth: 0,
  },

  adminName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--text, #202227)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  adminEmail: {
    margin: '3px 0 0',
    fontSize: '12px',
    color: 'var(--text-soft, #7b7e85)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  statusBadge: {
    padding: '4px 7px',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '.4px',
    whiteSpace: 'nowrap',
  },

  statusActive: {
    background: 'var(--success-surface, #e8f7ed)',
    color: 'var(--success, #27834a)',
  },

  statusSuspended: {
    background: 'var(--warning-surface, #fff0e7)',
    color: 'var(--warning, #b95c20)',
  },

  adminMeta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '17px',
    paddingTop: '15px',
    borderTop:
      '1px solid var(--border-soft, #eef0f2)',
  },

  smallLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--text-soft, #94979d)',
    marginBottom: '3px',
  },

  smallValue: {
    fontSize: '13px',
    color: 'var(--text, #33363b)',
  },

  permissionSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginTop: '15px',
  },

  permissionChip: {
    borderRadius: '6px',
    padding: '4px 6px',
    fontSize: '10px',
    fontWeight: 700,
  },

  permissionEnabled: {
    background:
      'var(--success-surface, #edf8f0)',
    color: 'var(--success, #287d45)',
  },

  permissionDisabled: {
    background:
      'var(--surface-soft, #f1f2f4)',
    color: 'var(--text-soft, #92959b)',
  },

  adminActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '7px',
    marginTop: '16px',
    paddingTop: '14px',
    borderTop:
      '1px solid var(--border-soft, #eef0f2)',
  },

  // =========================================
  // CONTROLOS DA LISTA
  // =========================================

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

  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background:
      'var(--modal-backdrop, rgba(15, 17, 20, .48))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
  },

  modal: {
    width: '100%',
    maxWidth: '680px',
    maxHeight: '90vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    background: 'var(--surface, #fff)',
    color: 'var(--text, #202227)',
    borderRadius: '17px',
    padding: '22px',
    boxSizing: 'border-box',
    boxShadow:
      'var(--modal-shadow, 0 20px 60px rgba(0,0,0,.22))',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '15px',
    marginBottom: '18px',
  },

  modalTitle: {
    margin: 0,
    fontSize: '21px',
    fontWeight: 800,
    color: 'var(--text, #17191d)',
    lineHeight: 1.25,
  },

  modalSubtitle: {
    margin: '5px 0 0',
    fontSize: '13px',
    color: 'var(--text-soft, #7a7d84)',
    lineHeight: 1.45,
    overflowWrap: 'anywhere',
  },

  closeButton: {
    width: '34px',
    height: '34px',
    border: 0,
    borderRadius: '8px',
    background: 'var(--surface-soft, #f1f2f4)',
    color: 'var(--text, #44474d)',
    fontSize: '23px',
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
  },

  successBox: {
    padding: '11px 13px',
    borderRadius: '9px',
    background:
      'var(--success-surface, #edf9f0)',
    border:
      '1px solid var(--success-border, #ccebd4)',
    color: 'var(--success, #277641)',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '14px',
  },

  errorBox: {
    padding: '11px 13px',
    borderRadius: '9px',
    background:
      'var(--danger-surface, #fff4f4)',
    border:
      '1px solid var(--danger-border, #efcece)',
    color: 'var(--danger, #a32e2e)',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '14px',
  },

  modalSection: {
    paddingTop: '18px',
    marginTop: '18px',
    borderTop:
      '1px solid var(--border-soft, #eceef0)',
  },

  modalSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '15px',
    marginBottom: '13px',
  },

  modalSectionTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--text, #25282d)',
  },

  modalSectionText: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: 'var(--text-soft, #7c7f86)',
    lineHeight: 1.5,
  },

  permissionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },

  permissionRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '11px',
    border:
      '1px solid var(--border, #e8eaed)',
    borderRadius: '10px',
    cursor: 'pointer',
  },

  permissionRowDisabled: {
    opacity: .55,
    cursor: 'not-allowed',
  },

  permissionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    minWidth: 0,
  },

  permissionLabel: {
    fontSize: '13px',
    color: 'var(--text, #292c31)',
  },

  permissionDescription: {
    fontSize: '11px',
    color: 'var(--text-soft, #777a81)',
    lineHeight: 1.4,
  },

  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '15px',
  },

  regionRow: {
    display: 'flex',
    gap: '8px',
  },

  input: {
    width: '100%',
    minHeight: '40px',
    border:
      '1px solid var(--border, #dfe2e6)',
    borderRadius: '9px',
    padding: '0 11px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    background:
      'var(--input-surface, var(--surface, #fff))',
    color:
      'var(--text, #202227)',
  },

  fieldLabel: {
    display: 'block',
    marginBottom: '7px',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text, #484b51)',
  },

  searchInfo: {
    marginTop: '7px',
    fontSize: '12px',
    color: 'var(--text-soft, #7d8087)',
  },

  candidateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    marginTop: '7px',
    maxHeight: '220px',
    overflowY: 'auto',
    border:
      '1px solid var(--border, #e3e5e8)',
    borderRadius: '10px',
    padding: '5px',
  },

  candidateItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    border: 0,
    borderRadius: '7px',
    background:
      'var(--surface, #fff)',
    color:
      'var(--text, #292c31)',
    padding: '9px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
  },

  selectedCandidate: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginTop: '8px',
    padding: '10px',
    borderRadius: '9px',
    background:
      'var(--surface-soft, #f1f5f8)',
    color:
      'var(--text, #34373c)',
    fontSize: '12px',
  },

  dangerSection: {
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

  dangerTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 800,
    color:
      'var(--danger, #a83232)',
  },

  dangerText: {
    margin: '4px 0 0',
    fontSize: '12px',
    color:
      'var(--danger-text, #8b6666)',
    lineHeight: 1.45,
  },
};