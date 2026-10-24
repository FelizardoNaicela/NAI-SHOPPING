import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import { useParams } from "react-router-dom";

import { listProducts } from "../services/products";

import ProductCard from "../components/ProductCard";

import MarketplaceFilters from "../components/filters/MarketplaceFilters";

import PromotedMarketplaceSlots from "../components/PromotedMarketplaceSlots";

import styles from "./CategoryPage.module.css";

export default function CategoryPage() {
  const { id } = useParams();

  const [items, setItems] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [nextCursor, setNextCursor] =
    useState<string | null>(null);

  const [filters, setFilters] =
    useState({
      country: "MZ",
      region: "",
      time: "all",
      sort: "recent",
      type: "",
    });

    const [premiumProduct, setPremiumProduct] =
  useState<any | null>(null);

  const observer =
    useRef<IntersectionObserver | null>(
      null,
    );

  /*
   * =========================================================
   * CARREGAR PRIMEIRA PÁGINA
   * =========================================================
   */

  const load = useCallback(
    async () => {
      if (!id) {
        return;
      }

      setLoading(true);

      try {
        const result =
          await listProducts({
            category: id,

            limit: 20,

            country:
              filters.country,

            region:
              filters.region,

            time:
              filters.time,

            sort:
              filters.sort,
          });

        setItems(
          Array.isArray(
            result.items,
          )
            ? result.items
            : [],
        );

        setPremiumProduct(
  result.premiumProduct ?? null,
);

        setNextCursor(
          result.nextCursor ??
            null,
        );
      } finally {
        setLoading(false);
      }
    },
    [
      id,
      filters.country,
      filters.region,
      filters.time,
      filters.sort,
    ],
  );

  /*
   * =========================================================
   * RECARREGAR QUANDO MUDA CATEGORIA/FILTROS
   * =========================================================
   */

  useEffect(() => {
    setItems([]);

    setNextCursor(null);

    load();
  }, [
    id,
    filters.country,
    filters.region,
    filters.time,
    filters.sort,
  ]);

  /*
   * =========================================================
   * PAGINAÇÃO
   * =========================================================
   */

  const loadMore =
    useCallback(
      async () => {
        if (
          !id ||
          !nextCursor ||
          loadingMore
        ) {
          return;
        }

        setLoadingMore(true);

        try {
          const result =
            await listProducts({
              category: id,

              cursor:
                nextCursor,

              limit: 20,

              country:
                filters.country,

              region:
                filters.region,

              time:
                filters.time,

              sort:
                filters.sort,
            });

          setItems(prev => {
            const ids =
              new Set(
                prev.map(
                  product =>
                    product.id,
                ),
              );

            const novos =
              result.items.filter(
                (product: any) =>
                  !ids.has(
                    product.id,
                  ),
              );

            return [
              ...prev,
              ...novos,
            ];
          });

          setNextCursor(
            result.nextCursor ??
              null,
          );
        } finally {
          setLoadingMore(false);
        }
      },
      [
        id,
        nextCursor,
        loadingMore,
        filters.country,
        filters.region,
        filters.time,
        filters.sort,
      ],
    );

  /*
   * =========================================================
   * OBSERVER
   * =========================================================
   */

  const lastItemRef =
    useCallback(
      (
        node: HTMLDivElement | null,
      ) => {
        if (
          loadingMore ||
          loading ||
          !nextCursor
        ) {
          return;
        }

        if (observer.current) {
          observer.current.disconnect();
        }

        observer.current =
          new IntersectionObserver(
            entries => {
              if (
                !entries[0]
                  ?.isIntersecting
              ) {
                return;
              }

              loadMore();
            },
          );

        if (node) {
          observer.current.observe(
            node,
          );
        }
      },
      [
        loadingMore,
        loading,
        nextCursor,
        loadMore,
      ],
    );

  /*
   * =========================================================
   * LOADING INICIAL
   * =========================================================
   */

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
        }}
      >
        <p>Carregando...</p>
      </div>
    );
  }

  /*
   * =========================================================
   * PÁGINA
   * =========================================================
   */

  return (
    <div
      style={{
        padding: 24,
        color: "var(--text)",
      }}
    >
      <h2
        style={{
          marginBottom: 20,
          color: "var(--text)",
        }}
      >
        Produtos da categoria
      </h2>

      <MarketplaceFilters
        value={filters}
        onChange={setFilters}
      />

      {items.length === 0 && (
        <p
          style={{
            color:
              "var(--text-soft)",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          Nenhum produto encontrado
        </p>
      )}

      {/*
       * =====================================================
       * PRODUTOS + PROMOÇÕES
       * =====================================================
       *
       * IMPORTANTE:
       *
       * items continua contendo somente
       * produtos da categoria.
       *
       * As promoções são buscadas separadamente
       * através de PromotionPlacement.CATEGORY.
       *
       * Portanto:
       *
       * - promoção não altera paginação;
       * - promoção não altera filtros;
       * - promoção não precisa pertencer à categoria;
       * - promoção aparece apenas no slot reservado.
       */}

      <div className={styles.productsGrid}>
        <PromotedMarketplaceSlots
          items={items}
          premiumProduct={premiumProduct}
          placement="CATEGORY"
          loading={
            loading ||
            loadingMore
          }
          renderItem={product => (
            <ProductCard
              product={product}
              showStore
            />
          )}
        />
      </div>

      {/*
       * =====================================================
       * PAGINAÇÃO
       * =====================================================
       */}

      {loadingMore && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color:
              "var(--text-soft)",
          }}
        >
          Carregando mais produtos...
        </div>
      )}

      {/*
       * =====================================================
       * SENTINELA
       * =====================================================
       *
       * Fica FORA dos slots de publicidade.
       *
       * Isso garante que a promoção nunca
       * interfere no cursor da categoria.
       */}

      {items.length > 0 &&
        nextCursor && (
          <div
            ref={lastItemRef}
            style={{
              height: 1,
            }}
          />
        )}
    </div>
  );
}