import {
  useEffect,
  useState,
  type CSSProperties,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { api } from '../../services/api';

import { Store as StoreIcon } from 'lucide-react';
import PanelSection from '../../components/panel/PanelSection';

import {
  REGIONS,
} from '../../shared/regions';

import type { PainelProfile } from './AdminManagement';

interface ManagedStore {
  id: string;
  name: string;
  description?: string | null;
  countryCode: string;

  // Região antiga — mantida por compatibilidade.
  region?: string | null;

  // Novas regiões administrativas.
  regions?: Array<{
    id: string;
    region: string;
    createdAt: string;
  }>;

  // Controle administrativo.
  regionalManagementLocked: boolean;

  verified: boolean;
  verificationType?: string | null;
  isActive: boolean;
  ratingAverage: number;
  ratingCount: number;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string | null;

  owner: {
    id: string;
    email: string;
    name?: string | null;
  };

  _count: {
    products: number;
    followers: number;
    posts: number;
    conversations?: number;
  };
}

interface StoreManagementProps {
  profile: PainelProfile;
}

export default function StoreManagement({
  profile,
}: StoreManagementProps) {
  const navigate = useNavigate();

  const isSuperAdmin =
    profile.adminRole === 'SUPER_ADMIN';

  const canManageStores =
    isSuperAdmin ||
    profile.canManageStores;

  const [stores, setStores] =
    useState<ManagedStore[]>([]);

  const [storesLoading, setStoresLoading] =
    useState(false);

  const [storesError, setStoresError] =
    useState('');

  const [storeSearch, setStoreSearch] =
    useState('');

  const [selectedStore, setSelectedStore] =
    useState<ManagedStore | null>(null);

  const [storeDetailsLoading, setStoreDetailsLoading] =
    useState(false);

  const [storeActionLoading, setStoreActionLoading] =
    useState(false);

  // =========================================
  // REGIÕES ADMINISTRATIVAS
  // =========================================

  const [regionInput, setRegionInput] =
    useState('');

  const [regionActionLoading, setRegionActionLoading] =
    useState(false);

// =========================================
// LISTA PROGRESSIVA
// =========================================

const [visibleStoreCount, setVisibleStoreCount] =
  useState(10);

// =========================================
// FILTRO POR REGIÃO
// =========================================

const [regionFilter, setRegionFilter] =
  useState('ALL');

// Limite alto para permitir que a lista
// progressiva trabalhe sobre os resultados
// da pesquisa.
const STORE_SEARCH_LIMIT = 100;

  // =========================================
  // REGIÕES DISPONÍVEIS PARA A LOJA
  // =========================================

  const availableRegions =
    selectedStore
      ? REGIONS[
          selectedStore.countryCode as keyof typeof REGIONS
        ] ?? []
      : [];


// =========================================
// REGIÕES DISPONÍVEIS NOS RESULTADOS
// =========================================

const availableStoreRegions =
  Array.from(
    new Set(
      stores
        .flatMap(store => [
          ...(store.regions ?? []).map(
            item => item.region,
          ),

          store.region ?? '',
        ])
        .map(region =>
          region.trim(),
        )
        .filter(Boolean),
    ),
  ).sort((a, b) =>
    a.localeCompare(b, 'pt'),
  );

// =========================================
// LOJAS FILTRADAS
// =========================================

const filteredStores =
  regionFilter === 'ALL'
    ? stores
    : stores.filter(store => {

        const regions = [
          ...(store.regions ?? []).map(
            item => item.region,
          ),

          store.region ?? '',
        ]
          .map(region =>
            region.trim().toLowerCase(),
          )
          .filter(Boolean);

        return regions.includes(
          regionFilter
            .trim()
            .toLowerCase(),
        );
      });

// =========================================
// LISTA VISÍVEL
// =========================================

const visibleStores =
  filteredStores.slice(
    0,
    visibleStoreCount,
  );

const hasMoreStores =
  visibleStoreCount <
  filteredStores.length;


  // =========================================
  // PESQUISAR LOJAS
  // =========================================

  async function loadStores(
  search = storeSearch,
) {
    const trimmed =
      search.trim();

    // =========================================
    // SEM PESQUISA
    // =========================================

    if (trimmed.length === 0) {
      setStores([]);
      setStoresLoading(false);
      setStoresError('');

      return;
    }

    // =========================================
    // PESQUISA MUITO CURTA
    // =========================================

    if (trimmed.length < 2) {
      setStores([]);
      setStoresLoading(false);

      setStoresError(
        'Digite pelo menos 2 caracteres para pesquisar.',
      );

      return;
    }

    // =========================================
    // PESQUISAR
    // =========================================

    try {
      setStoresLoading(true);
      setStoresError('');

      const res =
        await api.get('/admin/stores', {

params: {
  q: trimmed,
  page: 1,
  limit: STORE_SEARCH_LIMIT,
},
        });

      setStores(
  Array.isArray(res.data?.stores)
    ? res.data.stores
    : [],
);

setVisibleStoreCount(10);

    } catch (err) {

      setStores([]);
      setStoresError(
        'Não foi possível carregar as lojas.',
      );
    } finally {
      setStoresLoading(false);
    }
  }

  // =========================================
  // ALTERAÇÃO DO PERFIL / PERMISSÃO
  // =========================================

  useEffect(() => {
    if (!canManageStores) {
      setStores([]);
      setStoresLoading(false);

      return;
    }

    // Não carregar lojas automaticamente.
    // Elas só aparecem depois de uma pesquisa.

    setStores([]);
    setStoresLoading(false);
  }, [
    canManageStores,
    profile.userId,
  ]);

  // =========================================
  // PESQUISA
  // =========================================

  function handleStoreSearch(
    value: string,
  ) {
    setStoreSearch(value);
  }

  // =========================================
  // ABRIR DETALHES
  // =========================================

  async function openStoreDetails(
    storeId: string,
  ) {
    setSelectedStore(null);
    setRegionInput('');
    setStoreDetailsLoading(true);
    setStoresError('');

    try {
      const res =
        await api.get<ManagedStore>(
          `/admin/stores/${storeId}`,
        );

      setSelectedStore(
        res.data,
      );

      setRegionInput('');
    } catch (err: any) {

      setStoresError(
        err?.response?.data?.message ??
          'Não foi possível carregar os detalhes da loja.',
      );
    } finally {
      setStoreDetailsLoading(false);
    }
  }

  // =========================================
  // FECHAR DETALHES
  // =========================================

  function closeStoreDetails() {
    if (storeActionLoading) {
      return;
    }

    setSelectedStore(null);
    setRegionInput('');
  }

  // =========================================
  // ABRIR PÁGINA DA LOJA
  // =========================================

  function openStorePage(
    storeId: string,
  ) {
    navigate(
      `/stores/${storeId}`,
    );
  }

  // =========================================
  // ALTERAR ESTADO DA LOJA
  // =========================================

  async function changeStoreStatus(
    store: ManagedStore,
  ) {
    const activate =
      !store.isActive;

    const action =
      activate
        ? 'ativar'
        : 'desativar';

    const confirmed =
      window.confirm(
        `Deseja realmente ${action} a loja "${store.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    setStoreActionLoading(true);
    setStoresError('');

    try {
      const endpoint =
        activate
          ? `/admin/stores/${store.id}/activate`
          : `/admin/stores/${store.id}/deactivate`;

      const res =
        await api.patch<ManagedStore>(
          endpoint,
        );

      const updated =
        res.data;

      setStores(current =>
        current.map(item =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      setSelectedStore(
        current =>
          current &&
          current.id === updated.id
            ? updated
            : current,
      );
    } catch (err: any) {

      setStoresError(
        err?.response?.data?.message ??
          'Não foi possível alterar o estado da loja.',
      );
    } finally {
      setStoreActionLoading(false);
    }
  }

  // =========================================
  // ADICIONAR REGIÃO
  // =========================================

  async function addStoreRegion() {
    if (!selectedStore) {
      return;
    }

    if (!isSuperAdmin) {
      return;
    }

    const region =
      regionInput.trim();

    if (!region) {
      return;
    }

    // =====================================
    // VALIDAR CONTRA REGIONS.TS
    // =====================================

    const isValidRegion =
      availableRegions.some(
        item =>
          item.trim().toLowerCase() ===
          region.toLowerCase(),
      );

    if (!isValidRegion) {
      setStoresError(
        'Esta região não existe para o país selecionado.',
      );

      return;
    }

    // =====================================
    // VERIFICAR DUPLICAÇÃO
    // =====================================

    const existingRegions =
      selectedStore.regions ?? [];

    const alreadyExists =
      existingRegions.some(
        item =>
          item.region.trim().toLowerCase() ===
          region.toLowerCase(),
      );

    if (alreadyExists) {
      setStoresError(
        'Esta região já está associada à loja.',
      );

      return;
    }

    setRegionActionLoading(true);
    setStoresError('');

    try {
      const res =
        await api.post<ManagedStore>(
          `/admin/stores/${selectedStore.id}/regions`,
          {
            region,
          },
        );

      const updated =
        res.data;

      setSelectedStore(
        updated,
      );

      setStores(current =>
        current.map(item =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      setRegionInput('');

    } catch (err: any) {

      setStoresError(
        err?.response?.data?.message ??
          'Não foi possível adicionar a região.',
      );

    } finally {
      setRegionActionLoading(false);
    }
  }

  // =========================================
  // REMOVER REGIÃO
  // =========================================

  async function removeStoreRegion(
    regionId: string,
    regionName: string,
  ) {
    if (!selectedStore) {
      return;
    }

    if (!isSuperAdmin) {
      return;
    }

    const confirmed =
      window.confirm(
        `Deseja realmente remover a região "${regionName}" desta loja?`,
      );

    if (!confirmed) {
      return;
    }

    setRegionActionLoading(true);
    setStoresError('');

    try {
      const res =
        await api.patch<ManagedStore>(
          `/admin/stores/${selectedStore.id}/regions/${regionId}/remove`,
        );

      const updated =
        res.data;

      setSelectedStore(
        updated,
      );

      setStores(current =>
        current.map(item =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

    } catch (err: any) {

      setStoresError(
        err?.response?.data?.message ??
          'Não foi possível remover a região.',
      );

    } finally {
      setRegionActionLoading(false);
    }
  }

  // =========================================
  // BLOQUEIO DE GESTÃO REGIONAL
  // =========================================

  async function toggleRegionalManagementLock() {
    if (!selectedStore) {
      return;
    }

    if (!isSuperAdmin) {
      return;
    }

    const nextValue =
      !selectedStore.regionalManagementLocked;

    const action =
      nextValue
        ? 'bloquear'
        : 'desbloquear';

    const confirmed =
      window.confirm(
        `Deseja realmente ${action} a gestão regional desta loja?`,
      );

    if (!confirmed) {
      return;
    }

    setRegionActionLoading(true);
    setStoresError('');

    try {
      const res =
        await api.patch<ManagedStore>(
          `/admin/stores/${selectedStore.id}/regional-management-lock`,
          {
            locked: nextValue,
          },
        );

      const updated =
        res.data;

      setSelectedStore(
        updated,
      );

      setStores(current =>
        current.map(item =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

    } catch (err: any) {

      setStoresError(
        err?.response?.data?.message ??
          'Não foi possível alterar o bloqueio regional.',
      );

    } finally {
      setRegionActionLoading(false);
    }
  }

  // =========================================
  // SEM PERMISSÃO
  // =========================================

  if (!canManageStores) {
    return null;
  }

  return (
    <>
      <style>
        {`
          /* =====================================
             STORE MANAGEMENT — RESPONSIVE
          ===================================== */

          .admin-store-management {
            width: 100%;
            min-width: 0;
          }

          .admin-store-search-row {
            width: 100%;
            min-width: 0;
          }

          .admin-store-grid {
            width: 100%;
            min-width: 0;
          }

          .admin-store-card {
            min-width: 0;
            overflow: hidden;
          }

          .admin-store-card-top {
            min-width: 0;
          }

          .admin-store-identity {
            min-width: 0;
            max-width: 100%;
          }

          .admin-store-info {
            min-width: 0;
            max-width: 100%;
          }

          .admin-store-footer {
            min-width: 0;
          }

          .admin-store-stats {
            min-width: 0;
          }

          .admin-store-stat {
            min-width: 0;
            text-align: center;
            overflow: hidden;
          }

          .admin-store-stat strong {
            display: inline-block;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: middle;
          }

          .admin-store-stat small {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-store-pagination {
            width: 100%;
          }

          .admin-store-pagination-button {
            min-height: 40px;
          }

          .admin-store-overlay {
            overflow-y: auto;
          }

          .admin-store-modal {
            min-width: 0;
          }

          .admin-store-modal-header {
            min-width: 0;
          }

          .admin-store-modal-identity {
            min-width: 0;
            max-width: 100%;
          }

          .admin-store-modal-info {
            min-width: 0;
            max-width: 100%;
          }

          .admin-store-modal-title {
            min-width: 0;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-store-modal-subtitle {
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .admin-store-detail-grid {
            min-width: 0;
          }

          .admin-store-detail-box {
            min-width: 0;
            overflow: hidden;
          }

          .admin-store-detail-box strong {
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .admin-store-owner {
            min-width: 0;
          }

          .admin-store-owner span,
          .admin-store-owner strong {
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .admin-store-modal-actions {
            min-width: 0;
          }

          button:disabled {
            opacity: .55;
            cursor: not-allowed !important;
          }

          /* =====================================
             TABLET
          ===================================== */

          @media (max-width: 900px) {
            .admin-store-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .admin-store-detail-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .admin-store-card {
              padding: 16px !important;
            }
          }

          /* =====================================
             MOBILE
          ===================================== */

          @media (max-width: 640px) {

            .admin-store-regions-section {
              margin-top: 15px !important;
              padding-top: 15px !important;
            }

            .admin-store-filter-row {
  width: 100%;
}

.admin-store-filter-label {
  width: 100%;
  flex-direction: column;
  align-items: stretch !important;
}

.admin-store-filter-select {
  width: 100% !important;
}

.admin-store-list-controls {
  flex-direction: column !important;
  align-items: stretch !important;
}

.admin-store-list-controls-buttons {
  width: 100%;
}

.admin-store-list-controls-buttons button {
  flex: 1;
}

            .admin-store-region-add-row {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .admin-store-region-add-row select,
            .admin-store-region-add-row button {
              width: 100% !important;
              min-height: 42px !important;
            }

            .admin-store-management {
              margin-bottom: 18px !important;
            }

            .admin-store-section-title {
              font-size: 21px !important;
            }

            .admin-store-section-description {
              font-size: 13px !important;
              line-height: 1.45 !important;
            }

            /* Pesquisa */

            .admin-store-search-row {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 8px !important;
            }

            .admin-store-search-input {
              width: 100% !important;
              min-width: 0 !important;
              min-height: 44px !important;
            }

            .admin-store-search-button,
            .admin-store-clear-button {
              width: 100% !important;
              min-height: 42px !important;
            }

            /* Grid */

            .admin-store-grid {
              grid-template-columns: minmax(0, 1fr) !important;
              gap: 12px !important;
            }

            /* Card */

            .admin-store-card {
              width: 100% !important;
              padding: 14px !important;
              border-radius: 13px !important;
              box-sizing: border-box !important;
            }

            .admin-store-card-top {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 10px !important;
            }

            .admin-store-identity {
              width: 100% !important;
            }

            .admin-store-info {
              flex: 1 !important;
              min-width: 0 !important;
            }

            .admin-store-name-button {
              max-width: 100% !important;
              font-size: 15px !important;
            }

            .admin-store-status {
              align-self: flex-start !important;
            }

            .admin-store-description {
              font-size: 12px !important;
              line-height: 1.5 !important;
              margin-top: 12px !important;
            }

            /* Estatísticas */

            .admin-store-stats {
              gap: 5px !important;
              margin-top: 13px !important;
              padding-top: 12px !important;
            }

            .admin-store-stat {
              font-size: 12px !important;
            }

            .admin-store-stat strong {
              font-size: 14px !important;
            }

            .admin-store-stat small {
              font-size: 10px !important;
            }

            /* Rodapé */

            .admin-store-footer {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 10px !important;
              margin-top: 13px !important;
              padding-top: 12px !important;
            }

            .admin-store-badges {
              width: 100% !important;
            }

            .admin-store-details-button {
              width: 100% !important;
              min-height: 42px !important;
            }

            /* Paginação */

            .admin-store-pagination {
              gap: 6px !important;
              margin-top: 14px !important;
            }

            .admin-store-pagination-button {
              flex: 1 1 0 !important;
              min-width: 0 !important;
              padding: 9px 7px !important;
              font-size: 11px !important;
            }

            .admin-store-pagination-info {
              min-width: 75px !important;
              font-size: 11px !important;
            }

            /* Estados */

            .admin-store-empty-card {
              padding: 22px 17px !important;
              border-radius: 13px !important;
            }

            .admin-store-error-box {
              font-size: 12px !important;
              line-height: 1.45 !important;
            }

            /* Modal */

            .admin-store-overlay {
              align-items: flex-start !important;
              justify-content: center !important;
              padding: 8px !important;
            }

            .admin-store-modal {
              width: 100% !important;
              max-width: 100% !important;
              max-height: calc(100vh - 16px) !important;
              padding: 16px !important;
              border-radius: 13px !important;
              margin: 0 !important;
            }

            .admin-store-modal-header {
              gap: 9px !important;
            }

            .admin-store-modal-identity {
              gap: 9px !important;
              flex: 1 !important;
            }

            .admin-store-modal-avatar {
              width: 48px !important;
              height: 48px !important;
              border-radius: 11px !important;
            }

            .admin-store-modal-title {
              font-size: 18px !important;
            }

            .admin-store-modal-subtitle {
              font-size: 11px !important;
              line-height: 1.4 !important;
            }

            .admin-store-close-button {
              width: 38px !important;
              height: 38px !important;
              flex-shrink: 0 !important;
            }

            .admin-store-modal-status {
              margin-top: 13px !important;
            }

            .admin-store-detail-section {
              margin-top: 14px !important;
              padding-top: 14px !important;
            }

            .admin-store-detail-grid {
              grid-template-columns: minmax(0, 1fr) !important;
              gap: 7px !important;
              margin-top: 14px !important;
            }

            .admin-store-detail-box {
              padding: 10px !important;
            }

            .admin-store-owner {
              margin-top: 14px !important;
              padding: 12px !important;
            }

            .admin-store-modal-actions {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 7px !important;
              margin-top: 15px !important;
              padding-top: 13px !important;
            }

            .admin-store-modal-actions button {
              width: 100% !important;
              min-height: 43px !important;
            }
          }

          /* =====================================
             MOBILE MUITO PEQUENO
          ===================================== */

          @media (max-width: 380px) {
            .admin-store-card {
              padding: 12px !important;
            }

            .admin-store-avatar {
              width: 40px !important;
              height: 40px !important;
            }

            .admin-store-name-button {
              font-size: 14px !important;
            }

            .admin-store-location {
              font-size: 11px !important;
            }

            .admin-store-stat strong {
              font-size: 13px !important;
            }

            .admin-store-stat small {
              font-size: 9px !important;
            }

            .admin-store-pagination-button {
              font-size: 10px !important;
            }

            .admin-store-pagination-info {
              min-width: 68px !important;
              font-size: 10px !important;
            }
          }
        `}
      </style>

      <PanelSection
  title="Lojas"
  description="Visualize e administre as lojas dentro do seu âmbito de autoridade."
  icon={<StoreIcon size={20} strokeWidth={1.9} />}
  storageKey="adminPanel:stores"
  summary={
    stores.length > 0
      ? `${filteredStores.length} resultado${filteredStores.length === 1 ? '' : 's'}`
      : undefined
  }
>
  <div className="admin-store-management">
    {/* erro, pesquisa, filtro, lista: iguais */}

        {storesError && (
          <div
            className="admin-store-error-box"
            style={styles.errorBox}
          >
            {storesError}
          </div>
        )}

        {/* =====================================
            PESQUISA
        ===================================== */}

        <div
          className="admin-store-search-row"
          style={styles.searchRow}
        >
          <input
            className="admin-store-search-input"
            value={storeSearch}
            onChange={event =>
              handleStoreSearch(
                event.target.value,
              )
            }
            onKeyDown={event => {
              if (
                event.key ===
                'Enter'
              ) {
                void loadStores(
                  storeSearch,
                );
              }
            }}
            style={styles.searchInput}
            placeholder="Pesquisar loja..."
          />

          <button
            type="button"
            className="admin-store-search-button"
            style={styles.primaryButton}
            onClick={() =>
              void loadStores(
                storeSearch,
              )
            }
          >
            Pesquisar
          </button>

          {storeSearch && (
            <button
              type="button"
              className="admin-store-clear-button"
              style={styles.secondaryButton}
             onClick={() => {
  setStoreSearch('');
  setStores([]);
  setVisibleStoreCount(10);
  setRegionFilter('ALL');
  setStoresError('');
}}
            >
              Limpar
            </button>
          )}
        </div>

{/* =====================================
    CONTROLES DA LISTA
===================================== */}

{filteredStores.length > 10 && (
  <div
    className="admin-store-list-controls"
    style={styles.listControls}
  >
    <div
      className="admin-store-list-controls-info"
      style={styles.listControlsInfo}
    >
      A mostrar{' '}
      <strong>
        {Math.min(
          visibleStoreCount,
          filteredStores.length,
        )}
      </strong>{' '}
      de{' '}
      <strong>
        {filteredStores.length}
      </strong>{' '}
      lojas
    </div>

    <div
      className="admin-store-list-controls-buttons"
      style={styles.listControlsButtons}
    >
      {visibleStoreCount > 10 && (
        <button
          type="button"
          className="admin-store-collapse-button"
          style={styles.collapseButton}
          onClick={() =>
            setVisibleStoreCount(
              Math.max(
                10,
                visibleStoreCount - 10,
              ),
            )
          }
        >
          ↑ Recolher 10
        </button>
      )}

      {hasMoreStores && (
        <button
          type="button"
          className="admin-store-more-button"
          style={styles.moreButton}
          onClick={() =>
            setVisibleStoreCount(
              Math.min(
                visibleStoreCount + 10,
                filteredStores.length,
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


{/* =====================================
    FILTRO POR REGIÃO
===================================== */}

{stores.length > 0 && (
  <div
    className="admin-store-filter-row"
    style={styles.filterRow}
  >
    <label
      className="admin-store-filter-label"
      style={styles.filterLabel}
    >
      <span>
        Região
      </span>

      <select
        className="admin-store-filter-select"
        value={regionFilter}
        onChange={event => {
          setRegionFilter(
            event.target.value,
          );

          setVisibleStoreCount(10);
        }}
        style={styles.filterSelect}
      >
        <option value="ALL">
          Todas as regiões
        </option>

        {availableStoreRegions.map(
          region => (
            <option
              key={region}
              value={region}
            >
              {region}
            </option>
          ),
        )}
      </select>
    </label>
  </div>
)}

        {/* =====================================
            LISTA
        ===================================== */}

        {storesLoading ? (
          <div
            className="admin-store-empty-card"
            style={styles.emptyCard}
          >
            <strong>
              Carregando lojas...
            </strong>
          </div>
        ) : storeSearch.trim().length === 0 ? (
          <div
            className="admin-store-empty-card"
            style={styles.emptyCard}
          >
            <strong>
              Pesquise uma loja para começar.
            </strong>

            <span>
              Digite pelo menos 2 caracteres do nome da loja.
            </span>
          </div>
        ) : stores.length === 0 ? (
          <div
            className="admin-store-empty-card"
            style={styles.emptyCard}
          >
            <strong>
              Nenhuma loja encontrada.
            </strong>

            <span>
              Tente pesquisar por outro nome.
            </span>
          </div>
        ) : (
          <div
            className="admin-store-grid"
            style={styles.storeGrid}
          >
            {visibleStores.map(store => (
              <article
                key={store.id}
                className="admin-store-card"
                style={styles.storeCard}
              >
                {/* =================================
                    TOPO DA LOJA
                ================================= */}

                <div
                  className="admin-store-card-top"
                  style={
                    styles.storeCardTop
                  }
                >
                  <div
                    className="admin-store-identity"
                    style={
                      styles.storeIdentity
                    }
                  >
                    {/* =============================
                        AVATAR CLICÁVEL
                    ============================= */}

                    <button
                      type="button"
                      onClick={() =>
                        openStorePage(
                          store.id,
                        )
                      }
                      aria-label={`Abrir loja ${store.name}`}
                      style={
                        styles.storeAvatarButton
                      }
                    >
                      <div
                        className="admin-store-avatar"
                        style={
                          styles.storeAvatar
                        }
                      >
                        {store.avatarUrl ? (
                          <img
                            src={
                              store.avatarUrl
                            }
                            alt=""
                            style={
                              styles.storeAvatarImage
                            }
                          />
                        ) : (
                          store.name
                            .trim()
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>
                    </button>

                    {/* =============================
                        NOME CLICÁVEL
                    ============================= */}

                    <div
                      className="admin-store-info"
                      style={
                        styles.storeInfo
                      }
                    >
                      <button
                        type="button"
                        className="admin-store-name-button"
                        onClick={() =>
                          openStorePage(
                            store.id,
                          )
                        }
                        style={
                          styles.storeNameButton
                        }
                        title={`Abrir ${store.name}`}
                      >
                        {store.name}
                      </button>

                      <p
                        className="admin-store-location"
                        style={
                          styles.storeLocation
                        }
                      >
                        {store.countryCode}

                        {store.region
                          ? ` · ${store.region}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className="admin-store-status"
                    style={{
                      ...styles.statusBadge,
                      ...(store.isActive
                        ? styles.activeStatus
                        : styles.inactiveStatus),
                    }}
                  >
                    {store.isActive
                      ? 'ATIVA'
                      : 'INATIVA'}
                  </span>
                </div>

                {/* =================================
                    DESCRIÇÃO
                ================================= */}

                {store.description && (
                  <p
                    className="admin-store-description"
                    style={
                      styles.storeDescription
                    }
                  >
                    {store.description}
                  </p>
                )}

                {/* =================================
                    ESTATÍSTICAS
                ================================= */}

                <div
                  className="admin-store-stats"
                  style={
                    styles.storeStats
                  }
                >
                  <div className="admin-store-stat">
                    <strong>
                      {store.ratingAverage.toFixed(
                        1,
                      )}
                    </strong>

                    <span>
                      ★
                    </span>

                    <small>
                      ({store.ratingCount})
                    </small>
                  </div>

                  <div className="admin-store-stat">
                    <strong>
                      {
                        store._count
                          .products
                      }
                    </strong>

                    <small>
                      produtos
                    </small>
                  </div>

                  <div className="admin-store-stat">
                    <strong>
                      {
                        store._count
                          .followers
                      }
                    </strong>

                    <small>
                      seguidores
                    </small>
                  </div>
                </div>

                {/* =================================
                    RODAPÉ
                ================================= */}

                <div
                  className="admin-store-footer"
                  style={
                    styles.storeFooter
                  }
                >
                  <div
                    className="admin-store-badges"
                    style={
                      styles.storeBadges
                    }
                  >
                    {store.verified && (
                      <span
                        style={
                          styles.verifiedBadge
                        }
                      >
                        ✓ Verificada
                      </span>
                    )}

                    {store.regionalManagementLocked && (
                      <span
                        style={
                          styles.regionalLockBadge
                        }
                      >
                        🔒 Super Admin
                      </span>
                    )}

                    {(store.regions?.length ?? 0) > 1 && (
                      <span
                        style={
                          styles.multiRegionBadge
                        }
                      >
                        🌐 {store.regions?.length} regiões
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="admin-store-details-button"
                    style={
                      styles.secondaryButton
                    }
                    onClick={() =>
                      void openStoreDetails(
                        store.id,
                      )
                    }
                  >
                    Ver detalhes
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      </PanelSection>

      {/* =========================================
          MODAL DE DETALHES DA LOJA
      ========================================= */}

      {(selectedStore ||
        storeDetailsLoading) && (
        <div
          className="admin-store-overlay"
          style={styles.overlay}
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeStoreDetails();
            }
          }}
        >
          <div
            className="admin-store-modal"
            style={styles.modal}
          >
            {storeDetailsLoading ? (
              <div
                style={
                  styles.modalLoading
                }
              >
                Carregando detalhes da loja...
              </div>
            ) : selectedStore ? (
              <>
                {/* =============================
                    CABEÇALHO DO MODAL
                ============================= */}

                <div
                  className="admin-store-modal-header"
                  style={
                    styles.modalHeader
                  }
                >
                  <div
                    className="admin-store-modal-identity"
                    style={
                      styles.modalStoreIdentity
                    }
                  >
                    {/* =========================
                        AVATAR CLICÁVEL
                    ========================= */}

                    <button
                      type="button"
                      onClick={() =>
                        openStorePage(
                          selectedStore.id,
                        )
                      }
                      aria-label={`Abrir loja ${selectedStore.name}`}
                      style={
                        styles.modalAvatarButton
                      }
                    >
                      <div
                        className="admin-store-modal-avatar"
                        style={
                          styles.modalAvatar
                        }
                      >
                        {selectedStore.avatarUrl ? (
                          <img
                            src={
                              selectedStore.avatarUrl
                            }
                            alt=""
                            style={
                              styles.storeAvatarImage
                            }
                          />
                        ) : (
                          selectedStore.name
                            .trim()
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>
                    </button>

                    <div
                      className="admin-store-modal-info"
                    >
                      {/* =======================
                          NOME CLICÁVEL
                      ======================= */}

                      <button
                        type="button"
                        className="admin-store-modal-title"
                        onClick={() =>
                          openStorePage(
                            selectedStore.id,
                          )
                        }
                        style={
                          styles.modalTitleButton
                        }
                      >
                        {
                          selectedStore.name
                        }
                      </button>

                      <p
                        className="admin-store-modal-subtitle"
                        style={
                          styles.modalSubtitle
                        }
                      >
                        {
                          selectedStore
                            .owner
                            .email
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="admin-store-close-button"
                    aria-label="Fechar detalhes"
                    style={
                      styles.closeButton
                    }
                    onClick={
                      closeStoreDetails
                    }
                    disabled={
                      storeActionLoading
                    }
                  >
                    ×
                  </button>
                </div>

                {/* =================================
                    STATUS
                ================================= */}

                <div
                  className="admin-store-modal-status"
                  style={
                    styles.modalStatusRow
                  }
                >
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(selectedStore.isActive
                        ? styles.activeStatus
                        : styles.inactiveStatus),
                    }}
                  >
                    {selectedStore.isActive
                      ? 'ATIVA'
                      : 'INATIVA'}
                  </span>

                  {selectedStore.verified && (
                    <span
                      style={
                        styles.verifiedBadge
                      }
                    >
                      ✓ Verificada
                    </span>
                  )}
                </div>

                {/* =================================
                    DESCRIÇÃO
                ================================= */}

                {selectedStore.description && (
                  <div
                    className="admin-store-detail-section"
                    style={
                      styles.detailSection
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Descrição
                    </span>

                    <p
                      style={
                        styles.detailText
                      }
                    >
                      {
                        selectedStore.description
                      }
                    </p>
                  </div>
                )}

                {/* =================================
                    DETALHES
                ================================= */}

                <div
                  className="admin-store-detail-grid"
                  style={
                    styles.detailGrid
                  }
                >
                  <div
                    className="admin-store-detail-box"
                    style={
                      styles.detailBox
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Região principal
                    </span>

                    <strong>
                      {selectedStore.region ??
                        'Não definida'}
                    </strong>
                  </div>

                  <div
                    className="admin-store-detail-box"
                    style={
                      styles.detailBox
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Gestão regional
                    </span>

                    <strong>
                      {selectedStore.regionalManagementLocked
                        ? '🔒 Somente Super Admin'
                        : '✓ Permitida'}
                    </strong>
                  </div>

                  <div
                    className="admin-store-detail-box"
                    style={
                      styles.detailBox
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      País
                    </span>

                    <strong>
                      {
                        selectedStore.countryCode
                      }
                    </strong>
                  </div>

                  <div
                    className="admin-store-detail-box"
                    style={
                      styles.detailBox
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Avaliação
                    </span>

                    <strong>
                      {selectedStore.ratingAverage.toFixed(
                        1,
                      )}{' '}
                      ★
                    </strong>
                  </div>

                  <div
                    className="admin-store-detail-box"
                    style={
                      styles.detailBox
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Avaliações
                    </span>

                    <strong>
                      {
                        selectedStore
                          .ratingCount
                      }
                    </strong>
                  </div>

                  <div
                    className="admin-store-detail-box"
                    style={
                      styles.detailBox
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Produtos
                    </span>

                    <strong>
                      {
                        selectedStore
                          ._count
                          .products
                      }
                    </strong>
                  </div>

                  <div
                    className="admin-store-detail-box"
                    style={
                      styles.detailBox
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Seguidores
                    </span>

                    <strong>
                      {
                        selectedStore
                          ._count
                          .followers
                      }
                    </strong>
                  </div>

                  <div
                    className="admin-store-detail-box"
                    style={
                      styles.detailBox
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Publicações
                    </span>

                    <strong>
                      {
                        selectedStore
                          ._count
                          .posts
                      }
                    </strong>
                  </div>

                  <div
                    className="admin-store-detail-box"
                    style={
                      styles.detailBox
                    }
                  >
                    <span
                      style={
                        styles.detailLabel
                      }
                    >
                      Conversas
                    </span>

                    <strong>
                      {
                        selectedStore
                          ._count
                          .conversations ??
                        0
                      }
                    </strong>
                  </div>
                </div>

                {/* =================================
                    REGIÕES ADMINISTRATIVAS
                ================================= */}

                <div
                  className="admin-store-regions-section"
                  style={
                    styles.regionsSection
                  }
                >
                  <div
                    style={
                      styles.regionsHeader
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.detailLabel
                        }
                      >
                        Regiões autorizadas
                      </span>

                      <p
                        style={
                          styles.regionsDescription
                        }
                      >
                        Define em quais regiões esta loja
                        pode ser administrada.
                      </p>
                    </div>

                    {selectedStore.regionalManagementLocked && (
                      <span
                        style={
                          styles.regionalLockBadge
                        }
                      >
                        🔒 Bloqueada
                      </span>
                    )}
                  </div>

                  <div
                    className="admin-store-regions-list"
                    style={
                      styles.regionsList
                    }
                  >
                    {(selectedStore.regions ?? []).length === 0 ? (
                      <div
                        style={
                          styles.noRegions
                        }
                      >
                        Nenhuma região administrativa
                        cadastrada.
                      </div>
                    ) : (
                      (selectedStore.regions ?? []).map(
                        item => (
                          <div
                            key={item.id}
                            style={
                              styles.regionItem
                            }
                          >
                            <span>
                              {item.region}
                            </span>

                            {isSuperAdmin && (
                              <button
                                type="button"
                                style={
                                  styles.regionRemoveButton
                                }
                                disabled={
                                  regionActionLoading
                                }
                                onClick={() =>
                                  void removeStoreRegion(
                                    item.id,
                                    item.region,
                                  )
                                }
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        ),
                      )
                    )}
                  </div>

                  {isSuperAdmin && (
                    <div
                      className="admin-store-region-add-row"
                      style={
                        styles.regionAddRow
                      }
                    >
                      <select
                        value={regionInput}
                        onChange={event =>
                          setRegionInput(
                            event.target.value,
                          )
                        }
                        style={
                          styles.regionSelect
                        }
                        disabled={
                          regionActionLoading
                        }
                      >
                        <option value="">
                          Selecionar região...
                        </option>

                        {availableRegions.map(
                          region => {
                            const alreadyExists =
                              (
                                selectedStore.regions ??
                                []
                              ).some(
                                item =>
                                  item.region
                                    .trim()
                                    .toLowerCase() ===
                                  region
                                    .trim()
                                    .toLowerCase(),
                              );

                            return (
                              <option
                                key={region}
                                value={region}
                                disabled={
                                  alreadyExists
                                }
                              >
                                {region}
                                {alreadyExists
                                  ? ' — já adicionada'
                                  : ''}
                              </option>
                            );
                          },
                        )}
                      </select>

                      <button
                        type="button"
                        style={
                          styles.primaryButton
                        }
                        disabled={
                          regionActionLoading ||
                          !regionInput
                        }
                        onClick={() =>
                          void addStoreRegion()
                        }
                      >
                        {regionActionLoading
                          ? 'Processando...'
                          : 'Adicionar'}
                      </button>
                    </div>
                  )}

                  {isSuperAdmin && (
                    <button
                      type="button"
                      style={
                        selectedStore.regionalManagementLocked
                          ? styles.secondaryButton
                          : styles.dangerButton
                      }
                      disabled={
                        regionActionLoading
                      }
                      onClick={() =>
                        void toggleRegionalManagementLock()
                      }
                    >
                      {regionActionLoading
                        ? 'Processando...'
                        : selectedStore.regionalManagementLocked
                          ? 'Desbloquear gestão regional'
                          : 'Bloquear gestão regional'}
                    </button>
                  )}
                </div>

                {/* =================================
                    PROPRIETÁRIO
                ================================= */}

                <div
                  className="admin-store-owner"
                  style={
                    styles.ownerSection
                  }
                >
                  <span
                    style={
                      styles.detailLabel
                    }
                  >
                    Proprietário
                  </span>

                  <strong>
                    {
                      selectedStore
                        .owner
                        .name ??
                      'Sem nome'
                    }
                  </strong>

                  <span>
                    {
                      selectedStore
                        .owner
                        .email
                    }
                  </span>
                </div>

                {/* =================================
                    AÇÕES
                ================================= */}

                <div
                  className="admin-store-modal-actions"
                  style={
                    styles.modalActions
                  }
                >
                  <button
                    type="button"
                    style={
                      selectedStore.isActive
                        ? styles.dangerButton
                        : styles.primaryButton
                    }
                    onClick={() =>
                      void changeStoreStatus(
                        selectedStore,
                      )
                    }
                    disabled={
                      storeActionLoading
                    }
                  >
                    {storeActionLoading
                      ? 'Processando...'
                      : selectedStore.isActive
                        ? 'Desativar loja'
                        : 'Ativar loja'}
                  </button>

                  <button
                    type="button"
                    style={
                      styles.secondaryButton
                    }
                    onClick={
                      closeStoreDetails
                    }
                    disabled={
                      storeActionLoading
                    }
                  >
                    Fechar
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles: Record<
  string,
  CSSProperties
> = {
  // =========================================
  // SEÇÃO
  // =========================================

  section: {
    marginBottom: '24px',
  },

  sectionHeader: {
    marginBottom: '16px',
  },

  eyebrow: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '1.2px',
    color: 'var(--text-soft)',
    marginBottom: '4px',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '23px',
    fontWeight: 800,
    color: 'var(--text)',
  },

  sectionDescription: {
    margin: '5px 0 0',
    fontSize: '14px',
    color: 'var(--text-soft)',
  },

  // =========================================
  // PESQUISA
  // =========================================

  searchRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },

  searchInput: {
    flex: 1,
    minHeight: '40px',
    border: '1px solid var(--border)',
    borderRadius: '9px',
    padding: '0 12px',
    fontSize: '13px',
    outline: 'none',
    background: 'var(--surface)',
    color: 'var(--text)',
    boxSizing: 'border-box',
  },

  primaryButton: {
    border: 0,
    borderRadius: '9px',
    padding: '10px 14px',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  secondaryButton: {
    border: '1px solid var(--border)',
    borderRadius: '9px',
    padding: '9px 12px',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  dangerButton: {
    border: '1px solid rgba(220, 70, 70, .35)',
    borderRadius: '9px',
    padding: '9px 12px',
    background: 'rgba(220, 70, 70, .10)',
    color: '#d65b5b',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  // =========================================
  // ESTADOS
  // =========================================

  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '28px',
    color: 'var(--text-soft)',
    fontSize: '14px',
  },

  errorBox: {
    padding: '11px 13px',
    borderRadius: '9px',
    background: 'rgba(220, 70, 70, .10)',
    border: '1px solid rgba(220, 70, 70, .28)',
    color: '#d65b5b',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '14px',
  },

  // =========================================
  // GRID
  // =========================================

  storeGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },

  storeCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '15px',
    padding: '18px',
    boxShadow:
      '0 3px 14px rgba(0,0,0,.035)',
    color: 'var(--text)',
  },

  storeCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },

  storeIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    minWidth: 0,
  },

  // =========================================
  // AVATAR CLICÁVEL
  // =========================================

  storeAvatarButton: {
    border: 0,
    padding: 0,
    margin: 0,
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: '11px',
    flexShrink: 0,
  },

  storeAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '11px',
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontSize: '17px',
    fontWeight: 800,
    color: 'var(--text)',
    flexShrink: 0,
  },

  storeAvatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  storeInfo: {
    minWidth: 0,
  },

  // =========================================
  // NOME CLICÁVEL
  // =========================================

  storeNameButton: {
    display: 'block',
    margin: 0,
    padding: 0,
    border: 0,
    background: 'transparent',
    color: 'var(--text)',
    fontSize: '16px',
    fontWeight: 800,
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    textAlign: 'left',
  },

  storeLocation: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: 'var(--text-soft)',
  },

  statusBadge: {
    padding: '5px 7px',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '.4px',
    whiteSpace: 'nowrap',
  },

  activeStatus: {
    background: 'rgba(39, 131, 74, .14)',
    color: '#42b86c',
  },

  inactiveStatus: {
    background: 'var(--surface-2)',
    color: 'var(--text-soft)',
  },

  // =========================================
  // DESCRIÇÃO
  // =========================================

  storeDescription: {
    margin: '14px 0 0',
    fontSize: '13px',
    lineHeight: 1.5,
    color: 'var(--text-soft)',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  // =========================================
  // ESTATÍSTICAS
  // =========================================

  storeStats: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '14px',
    borderTop: '1px solid var(--border)',
    color: 'var(--text)',
  },

  // =========================================
  // RODAPÉ
  // =========================================

  storeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginTop: '15px',
    paddingTop: '14px',
    borderTop: '1px solid var(--border)',
  },

  storeBadges: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '5px',
  },

  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 6px',
    borderRadius: '6px',
    background: 'rgba(40, 109, 168, .14)',
    color: '#55a3df',
    fontSize: '10px',
    fontWeight: 700,
  },

  verificationType: {
    fontSize: '10px',
    color: 'var(--text-soft)',
  },

  // =========================================
  // REGIÕES
  // =========================================

  regionalLockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 7px',
    borderRadius: '6px',
    background: 'rgba(220, 70, 70, .12)',
    color: '#d65b5b',
    fontSize: '10px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  multiRegionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 7px',
    borderRadius: '6px',
    background: 'rgba(90, 110, 180, .12)',
    color: 'var(--text-soft)',
    fontSize: '10px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  regionsSection: {
    marginTop: '18px',
    paddingTop: '18px',
    borderTop: '1px solid var(--border)',
  },

  regionsHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '10px',
  },

  regionsDescription: {
    margin: 0,
    fontSize: '12px',
    lineHeight: 1.45,
    color: 'var(--text-soft)',
  },

  regionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '10px',
  },

  regionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '9px 10px',
    borderRadius: '8px',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    fontSize: '12px',
    fontWeight: 600,
  },

  regionRemoveButton: {
    border: 0,
    background: 'transparent',
    color: '#d65b5b',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  noRegions: {
    padding: '10px',
    borderRadius: '8px',
    background: 'var(--surface-2)',
    color: 'var(--text-soft)',
    fontSize: '12px',
  },

  regionAddRow: {
    display: 'flex',
    gap: '7px',
    marginTop: '10px',
  },

  regionSelect: {
    flex: 1,
    minWidth: 0,
    minHeight: '38px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0 10px',
    fontSize: '12px',
    outline: 'none',
    background: 'var(--surface)',
    color: 'var(--text)',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },

  // =========================================
  // MODAL
  // =========================================

  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background:
      'rgba(15, 17, 20, .58)',
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
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '17px',
    padding: '22px',
    boxSizing: 'border-box',
    boxShadow:
      '0 20px 60px rgba(0,0,0,.30)',
  },

  modalLoading: {
    padding: '45px 20px',
    textAlign: 'center',
    color: 'var(--text-soft)',
    fontSize: '14px',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '15px',
  },

  modalStoreIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },

  // =========================================
  // AVATAR DO MODAL
  // =========================================

  modalAvatarButton: {
    border: 0,
    padding: 0,
    margin: 0,
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: '13px',
    flexShrink: 0,
  },

  modalAvatar: {
    width: '54px',
    height: '54px',
    borderRadius: '13px',
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontSize: '20px',
    fontWeight: 800,
    color: 'var(--text)',
    flexShrink: 0,
  },

  // =========================================
  // TÍTULO DO MODAL CLICÁVEL
  // =========================================

  modalTitleButton: {
    margin: 0,
    padding: 0,
    border: 0,
    background: 'transparent',
    color: 'var(--text)',
    fontSize: '21px',
    fontWeight: 800,
    cursor: 'pointer',
    textAlign: 'left',
  },

  modalSubtitle: {
    margin: '5px 0 0',
    fontSize: '13px',
    color: 'var(--text-soft)',
  },

  closeButton: {
    width: '34px',
    height: '34px',
    border: 0,
    borderRadius: '8px',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    fontSize: '23px',
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
  },

  modalStatusRow: {
    display: 'flex',
    gap: '7px',
    alignItems: 'center',
    marginTop: '17px',
  },

  // =========================================
  // DETALHES
  // =========================================

  detailSection: {
    marginTop: '18px',
    paddingTop: '18px',
    borderTop: '1px solid var(--border)',
  },

  detailLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.5px',
    color: 'var(--text-soft)',
    marginBottom: '5px',
  },

  detailText: {
    margin: 0,
    fontSize: '13px',
    lineHeight: 1.55,
    color: 'var(--text-soft)',
  },

  detailGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(4, 1fr)',
    gap: '8px',
    marginTop: '18px',
  },

  detailBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '11px',
    borderRadius: '9px',
    background: 'var(--surface-2)',
    color: 'var(--text)',
  },

  ownerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '18px',
    padding: '14px',
    borderRadius: '10px',
    background: 'var(--surface-2)',
    fontSize: '12px',
    color: 'var(--text-soft)',
  },

  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border)',
  },

  // =========================================
  // PAGINAÇÃO
  // =========================================

  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '20px',
  },

  paginationButton: {
    border: '1px solid var(--border)',
    borderRadius: '9px',
    padding: '9px 13px',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  paginationInfo: {
    minWidth: '110px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-soft)',
  },

// =========================================
// FILTRO
// =========================================

filterRow: {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '16px',
},

filterLabel: {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text-soft)',
},

filterSelect: {
  minHeight: '38px',
  minWidth: '190px',
  border: '1px solid var(--border)',
  borderRadius: '9px',
  padding: '0 10px',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: '12px',
  outline: 'none',
  cursor: 'pointer',
},

// =========================================
// CONTROLES DA LISTA
// =========================================

listControls: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  marginTop: '18px',
  padding: '12px 14px',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  background: 'var(--surface)',
  flexWrap: 'wrap',
},

listControlsInfo: {
  fontSize: '11px',
  color: 'var(--text-soft)',
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
  background: 'var(--primary)',
  color: '#fff',
  fontSize: '11px',
  fontWeight: 800,
  cursor: 'pointer',
},

collapseButton: {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '8px 12px',
  minHeight: '36px',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: '11px',
  fontWeight: 800,
  cursor: 'pointer',
},
};