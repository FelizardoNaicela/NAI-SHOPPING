import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import SmartImage from "../components/SmartImage";
import { listProducts } from "../services/products";
import FloatingDrawers from "../components/drawer/FloatingDrawers";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock?: number;
  imageUrl?: string | null;
  isPublished?: boolean;
  category?: {
    id: string;
    name: string;
  } | null;
};

type PromotionType = "feed" | "search" | "category";

const packageInfo: Record<
  string,
  {
    impressions: number;
    price: number;
    name: string;
  }
> = {
  basic: {
    impressions: 1000,
    price: 100,
    name: "Básico",
  },

  growth: {
    impressions: 2500,
    price: 235,
    name: "Crescimento",
  },

  popular: {
    impressions: 5000,
    price: 470,
    name: "Destaque",
  },

  reach: {
    impressions: 10000,
    price: 850,
    name: "Alcance",
  },

  large: {
    impressions: 25000,
    price: 1875,
    name: "Grande alcance",
  },
};

const promotionLabels: Record<
  PromotionType,
  {
    title: string;
    icon: string;
  }
> = {
  feed: {
    icon: "🔥",
    title: "Promoção no Feed",
  },

  search: {
    icon: "🔎",
    title: "Promoção na Pesquisa",
  },

  category: {
    icon: "🏷️",
    title: "Promoção nas Categorias",
  },
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-MZ").format(value);
}

export default function PromotionProductsPage() {
  const navigate = useNavigate();

  const { id: storeId } = useParams();

  const [searchParams] = useSearchParams();

  const type =
    (searchParams.get("type") || "feed") as PromotionType;

  const packageId =
    searchParams.get("package") || "basic";

  const selectedPackage =
    packageInfo[packageId] || packageInfo.basic;

  const promotion =
    promotionLabels[type] || promotionLabels.feed;

  const [products, setProducts] = useState<Product[]>([]);

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(new Set());

  const [loading, setLoading] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [nextCursor, setNextCursor] =
    useState<string | null>(null);

  const observer =
    useRef<IntersectionObserver | null>(null);

  // =========================================================
  // CARREGAR PRODUTOS
  // =========================================================

  const loadProducts = useCallback(
    async (cursor?: string) => {
      if (!storeId) return;

      try {
        const result = await listProducts({
          storeId,
          limit: 20,
          cursor,
        });

        setProducts(prev => {
          if (!cursor) {
            return result.items;
          }

          const ids = new Set(
            prev.map(product => product.id),
          );

          const newItems =
            result.items.filter(
              (product: Product) =>
                !ids.has(product.id),
            );

          return [...prev, ...newItems];
        });

        setNextCursor(
          result.nextCursor,
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [storeId],
  );

  // =========================================================
  // PRIMEIRA CARGA
  // =========================================================

  useEffect(() => {
    setProducts([]);
    setNextCursor(null);
    setSelectedIds(new Set());

    setLoading(true);

    loadProducts();
  }, [
    storeId,
    loadProducts,
  ]);

  // =========================================================
  // PAGINAÇÃO
  // =========================================================

  const loadMore = useCallback(
    async () => {
      if (
        !nextCursor ||
        loadingMore
      ) {
        return;
      }

      setLoadingMore(true);

      await loadProducts(
        nextCursor,
      );
    },
    [
      nextCursor,
      loadingMore,
      loadProducts,
    ],
  );

  // =========================================================
  // OBSERVER
  // =========================================================

  const lastProductRef =
    useCallback(
      (node: HTMLDivElement | null) => {
        if (
          loadingMore ||
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
                entries[0]
                  ?.isIntersecting
              ) {
                loadMore();
              }
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
        nextCursor,
        loadMore,
      ],
    );

  // =========================================================
  // SELECIONAR / DESSELECIONAR
  // =========================================================

  function toggleProduct(
    productId: string,
  ) {
    setSelectedIds(prev => {
      const next = new Set(prev);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  }

  // =========================================================
  // CONTINUAR
  // =========================================================

  function continuePromotion() {
    if (!storeId) return;

    if (selectedIds.size === 0) {
      return;
    }

    const params =
      new URLSearchParams({
        type,
        package: packageId,
        products: Array.from(
          selectedIds,
        ).join(","),
      });

    navigate(
      `/stores/${storeId}/promote/configure?${params.toString()}`,
    );
  }

  // =========================================================
  // VOLTAR
  // =========================================================

  function goBack() {
    navigate(
      `/stores/${storeId}/promote/${type}`,
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          color: "var(--text)",
        }}
      >
        Carregando produtos...
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 24,
        paddingBottom: 120,
        color: "var(--text)",
      }}
    >
        <FloatingDrawers />
      {/* VOLTAR */}

      <button
        type="button"
        onClick={goBack}
        style={{
          marginBottom: 24,
          padding: "8px 14px",
          borderRadius: 8,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          color: "var(--text)",
          cursor: "pointer",
        }}
      >
        ← Voltar
      </button>

      {/* CABEÇALHO */}

      <div
        style={{
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontSize: 34,
            marginBottom: 8,
          }}
        >
          {promotion.icon}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 28,
          }}
        >
          Selecionar produtos
        </h1>

        <p
          style={{
            marginTop: 8,
            color:
              "var(--text-soft)",
          }}
        >
          Escolha os produtos da sua
          banca que farão parte desta
          campanha.
        </p>
      </div>

      {/* RESUMO DO PACOTE */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
          padding: 18,
          borderRadius: 14,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface-glass)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color:
                "var(--text-soft)",
            }}
          >
            Tipo
          </div>

          <strong>
            {promotion.icon}{" "}
            {promotion.title}
          </strong>
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              color:
                "var(--text-soft)",
            }}
          >
            Pacote
          </div>

          <strong>
            {selectedPackage.name}
          </strong>
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              color:
                "var(--text-soft)",
            }}
          >
            Impressões
          </div>

          <strong>
            {formatPrice(
              selectedPackage.impressions,
            )}
          </strong>
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              color:
                "var(--text-soft)",
            }}
          >
            Valor
          </div>

          <strong>
            {formatPrice(
              selectedPackage.price,
            )}{" "}
            MT
          </strong>
        </div>
      </div>

      {/* CONTADOR */}

      <div
        style={{
          marginBottom: 18,
          fontWeight: 600,
        }}
      >
        {selectedIds.size}{" "}
        {selectedIds.size === 1
          ? "produto selecionado"
          : "produtos selecionados"}
      </div>

      {/* SEM PRODUTOS */}

      {products.length === 0 && (
        <div
          style={{
            padding: 30,
            borderRadius: 12,
            border:
              "1px solid var(--border)",
            color:
              "var(--text-soft)",
          }}
        >
          Esta banca ainda não possui
          produtos disponíveis para
          promoção.
        </div>
      )}

      {/* PRODUTOS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 18,
        }}
      >
        {products.map(
          (product, index) => {
            const selected =
              selectedIds.has(
                product.id,
              );

            const last =
              index ===
              products.length - 1;

            return (
              <div
                key={product.id}
                ref={
                  last
                    ? lastProductRef
                    : null
                }
                onClick={() =>
                  toggleProduct(
                    product.id,
                  )
                }
                style={{
                  position: "relative",
                  border: selected
                    ? "2px solid var(--primary)"
                    : "1px solid var(--border)",
                  borderRadius: 14,
                  overflow: "hidden",
                  background:
                    "var(--surface)",
                  cursor: "pointer",
                  transition:
                    "transform .15s, border .15s",
                }}
              >
                {/* CHECK */}

                <div
                  style={{
                    position:
                      "absolute",
                    top: 10,
                    right: 10,
                    zIndex: 2,
                    width: 28,
                    height: 28,
                    borderRadius:
                      "50%",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    background:
                      selected
                        ? "var(--primary)"
                        : "var(--surface)",
                    color:
                      selected
                        ? "var(--text-on-primary)"
                        : "var(--text)",
                    border:
                      "1px solid var(--border)",
                    fontWeight: 800,
                  }}
                >
                  {selected
                    ? "✓"
                    : ""}
                </div>

                {/* IMAGEM */}

                <div
  style={{
    height: 160,
    background:
      "var(--surface-glass)",
    overflow: "hidden",
  }}
>
  <SmartImage
    src={product.imageUrl}
    aspectRatio="1 / 1"
    fit="cover"
  />
</div>

                {/* DADOS */}

                <div
                  style={{
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    {product.name}
                  </div>

                  {product.category && (
                    <div
                      style={{
                        fontSize: 12,
                        color:
                          "var(--text-soft)",
                        marginBottom: 8,
                      }}
                    >
                      {product.category.name}
                    </div>
                  )}

                  <strong>
                    {formatPrice(
                      product.price,
                    )}{" "}
                    MT
                  </strong>
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* CARREGANDO MAIS */}

      {loadingMore && (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            color:
              "var(--text-soft)",
          }}
        >
          Carregando mais produtos...
        </div>
      )}

      {/* BARRA INFERIOR */}

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          display: "flex",
          justifyContent:
            "center",
          padding: "14px 20px",
          borderTop:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          boxShadow:
            "0 -4px 20px rgba(0,0,0,.12)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 20,
          }}
        >
          <div>
            <strong>
              {selectedIds.size}
            </strong>{" "}
            selecionados
          </div>

          <button
            type="button"
            disabled={
              selectedIds.size === 0
            }
            onClick={
              continuePromotion
            }
            style={{
              padding:
                "11px 22px",
              borderRadius: 9,
              border: "none",
              background:
                selectedIds.size === 0
                  ? "var(--border)"
                  : "var(--primary)",
              color:
                selectedIds.size === 0
                  ? "var(--text-soft)"
                  : "var(--text-on-primary)",
              cursor:
                selectedIds.size === 0
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 700,
            }}
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}