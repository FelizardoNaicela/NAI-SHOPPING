import {
    useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import FloatingDrawers from "../components/drawer/FloatingDrawers";
import {
  createPromotion,
  type PromotionPlacement,
} from "../services/promotions";
import SmartImage from "../components/SmartImage";
import { api } from "../services/api";

type PromotionType =
  | "feed"
  | "search"
  | "category";

type PackageInfo = {
  impressions: number;
  price: number;
  name: string;
};

type ProductSummary = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
};

type PromotionLabel = {
  title: string;
  icon: string;
  description: string;
};

const packageInfo: Record<
  string,
  PackageInfo
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
  PromotionLabel
> = {
  feed: {
    icon: "🔥",
    title: "Promoção no Feed",
    description:
      "Seus produtos serão exibidos em áreas patrocinadas do feed.",
  },

  search: {
    icon: "🔎",
    title: "Promoção na Pesquisa",
    description:
      "Seus produtos terão maior visibilidade nos resultados de pesquisa.",
  },

  category: {
    icon: "🏷️",
    title: "Promoção nas Categorias",
    description:
      "Seus produtos serão exibidos como produtos promovidos dentro das categorias.",
  },
};

function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    "pt-MZ",
  ).format(value);
}

function formatPrice(
  value: number,
) {
  return `${formatNumber(value)} MT`;
}

export default function PromotionSummaryPage() {
  const navigate = useNavigate();

  const { id: storeId } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const typeParam =
    searchParams.get("type") ||
    "feed";

  const packageId =
    searchParams.get("package") ||
    "basic";

  const productsParam =
    searchParams.get("products") ||
    "";

  const durationParam =
    Number(
      searchParams.get(
        "duration",
      ) || "7",
    );

  const priorityParam =
    searchParams.get(
      "priority",
    ) || "normal";

  const type: PromotionType =
    typeParam === "search" ||
    typeParam === "category"
      ? typeParam
      : "feed";

  const selectedPackage =
    packageInfo[packageId] ||
    packageInfo.basic;

  const promotion =
    promotionLabels[type];

  const productIds = useMemo(
    () =>
      productsParam
        .split(",")
        .map(id =>
          id.trim(),
        )
        .filter(Boolean),
    [productsParam],
  );

  const [products, setProducts] =
  useState<ProductSummary[]>([]);

const [productsLoading, setProductsLoading] =
  useState(true);

useEffect(() => {
  async function loadProducts() {
    if (productIds.length === 0) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }

    try {
      setProductsLoading(true);

      const results =
        await Promise.all(
          productIds.map(async productId => {
            try {
              const response =
                await api.get(
                  `/products/${productId}`,
                );

              return response.data as ProductSummary;
            } catch (err) {

              return null;
            }
          }),
        );

      setProducts(
        results.filter(
          (
            product,
          ): product is ProductSummary =>
            product !== null,
        ),
      );
    } finally {
      setProductsLoading(false);
    }
  }

  loadProducts();
}, [productIds]);

  const duration =
    durationParam > 0
      ? durationParam
      : 7;

  const priority =
    priorityParam === "normal"
      ? "normal"
      : "normal";

  const [accepted, setAccepted] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // =========================================================
  // VOLTAR
  // =========================================================

  function goBack() {
    if (!storeId) return;

    const params =
      new URLSearchParams({
        type,
        package: packageId,
        products:
          productIds.join(","),
        duration:
          String(duration),
        priority,
      });

    navigate(
      `/stores/${storeId}/promote/configure?${params.toString()}`,
    );
  }

  // =========================================================
  // CRIAR CAMPANHA
  // =========================================================

  async function createCampaign() {
    if (!storeId) return;

    if (
      productIds.length === 0
    ) {
      return;
    }

    if (!accepted) {
      return;
    }

    if (creating) {
      return;
    }

    try {
      setCreating(true);
      setError(null);

      /*
       * =====================================================
       * DATAS
       * =====================================================
       *
       * A campanha começa agora.
       *
       * A duração escolhida determina
       * quando ela termina.
       */

      const startsAt =
        new Date();

      const endsAt =
        new Date(
          startsAt.getTime() +
            duration *
              24 *
              60 *
              60 *
              1000,
        );

      /*
       * =====================================================
       * PLACEMENT
       * =====================================================
       *
       * O tipo escolhido na interface
       * determina onde a campanha aparecerá.
       */

      const placements: PromotionPlacement[] =
  type === "feed"
    ? ["FEED"]
    : type === "search"
      ? ["SEARCH"]
      : ["CATEGORY"];

      /*
       * =====================================================
       * PRIORIDADE
       * =====================================================
       *
       * Por enquanto todas as campanhas
       * usam prioridade normal.
       */

      const priorityValue = 1;

      /*
       * =====================================================
       * CRIAR
       * =====================================================
       */

      await createPromotion({
  name:
    `${promotion.title} - ${selectedPackage.name}`,

  startsAt:
    startsAt.toISOString(),

  endsAt:
    endsAt.toISOString(),

  packageId,

  priority:
    priorityValue,

  placements,

  productIds,
});

      /*
       * =====================================================
       * SUCESSO
       * =====================================================
       *
       * Ainda não temos pagamento.
       *
       * Portanto, depois de criar,
       * voltamos para a banca.
       */

      navigate(
        `/stores/${storeId}`,
      );
    } catch (err) {

      setError(
        "Não foi possível criar a campanha. Tente novamente.",
      );
    } finally {
      setCreating(false);
    }
  }

  // =========================================================
  // ERRO
  // =========================================================

  if (!storeId) {
    return (
      <div
        style={{
          padding: 24,
          color:
            "var(--text)",
        }}
      >
        Banca não encontrada.
      </div>
    );
  }

  if (
    productIds.length === 0
  ) {
    return (
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: 24,
          color:
            "var(--text)",
        }}
      >
        <FloatingDrawers />

        <h1>
          🔥 Resumo da promoção
        </h1>

        <p
          style={{
            color:
              "var(--text-soft)",
          }}
        >
          Nenhum produto foi
          selecionado para esta
          campanha.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/stores/${storeId}/promote`,
            )
          }
          style={{
            padding:
              "10px 16px",
            borderRadius: 8,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
            color:
              "var(--text)",
            cursor:
              "pointer",
          }}
        >
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: 24,
        paddingBottom: 130,
        color:
          "var(--text)",
      }}
    >
      <FloatingDrawers />

      {/* ===================================================== */}
      {/* VOLTAR */}
      {/* ===================================================== */}

      <button
        type="button"
        onClick={goBack}
        disabled={creating}
        style={{
          marginBottom: 24,
          padding:
            "8px 14px",
          borderRadius: 8,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          color:
            "var(--text)",
          cursor:
            creating
              ? "not-allowed"
              : "pointer",
          opacity:
            creating ? 0.6 : 1,
        }}
      >
        ← Voltar
      </button>

      {/* ===================================================== */}
      {/* CABEÇALHO */}
      {/* ===================================================== */}

      <div
        style={{
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontSize: 38,
            marginBottom: 8,
          }}
        >
          {promotion.icon}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 30,
          }}
        >
          Resumo da campanha
        </h1>

        <p
          style={{
            marginTop: 8,
            color:
              "var(--text-soft)",
            lineHeight: 1.5,
          }}
        >
          Confira todos os detalhes
          antes de criar a campanha.
        </p>
      </div>

      {/* ===================================================== */}
      {/* DESTAQUE PRINCIPAL */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 24,
          borderRadius: 18,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          marginBottom: 20,
          boxShadow:
            "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              fontSize: 30,
              background:
                "var(--surface-glass)",
              border:
                "1px solid var(--border)",
            }}
          >
            {promotion.icon}
          </div>

          <div>
            <div
              style={{
                fontSize: 13,
                color:
                  "var(--text-soft)",
                marginBottom: 4,
              }}
            >
              Tipo de promoção
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 21,
              }}
            >
              {promotion.title}
            </h2>
          </div>
        </div>

        <p
          style={{
            margin:
              "18px 0 0",
            color:
              "var(--text-soft)",
            lineHeight: 1.5,
          }}
        >
          {promotion.description}
        </p>
      </section>

      {/* ===================================================== */}
      {/* RESUMO DO PACOTE */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 24,
          borderRadius: 18,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin:
              "0 0 20px",
            fontSize: 20,
          }}
        >
          Pacote escolhido
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
          }}
        >
          <SummaryItem
            label="Pacote"
            value={
              selectedPackage.name
            }
          />

          <SummaryItem
            label="Impressões"
            value={`${formatNumber(
              selectedPackage.impressions,
            )} impressões`}
          />

          <SummaryItem
            label="Duração"
            value={`${duration} ${
              duration === 1
                ? "dia"
                : "dias"
            }`}
          />

          <SummaryItem
            label="Prioridade"
            value="Normal"
          />
        </div>
      </section>

      {/* ===================================================== */}
      {/* PRODUTOS */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 24,
          borderRadius: 18,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
              }}
            >
              Produtos
            </h2>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "var(--text-soft)",
                fontSize: 14,
              }}
            >
              Produtos incluídos
              nesta campanha.
            </p>
          </div>

          <div
            style={{
              padding:
                "7px 12px",
              borderRadius:
                999,
              background:
                "var(--surface-glass)",
              border:
                "1px solid var(--border)",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {productIds.length}{" "}
            {productIds.length === 1
              ? "produto"
              : "produtos"}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {productsLoading ? (
  <div
    style={{
      padding: 20,
      color: "var(--text-soft)",
      fontSize: 14,
    }}
  >
    Carregando produtos...
  </div>
) : products.length === 0 ? (
  <div
    style={{
      padding: 20,
      color: "var(--text-soft)",
      fontSize: 14,
    }}
  >
    Não foi possível carregar os produtos selecionados.
  </div>
) : (
  <div
    style={{
      display: "flex",
      gap: 10,
      overflowX: "auto",
      paddingBottom: 4,
    }}
  >
    {products.map(item => (
      <div
        key={item.id}
        style={{
          minWidth: 180,
          maxWidth: 180,
          padding: 10,
          borderRadius: 12,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface-glass)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: 100,
            borderRadius: 9,
            overflow: "hidden",
            background:
              "var(--border)",
            marginBottom: 8,
          }}
        >
          {item.imageUrl ? (
            <SmartImage
              src={item.imageUrl}
              aspectRatio="1 / 1"
              fit="cover"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              📦
            </div>
          )}
        </div>

        <strong
          style={{
            display: "block",
            fontSize: 14,
            overflow: "hidden",
            textOverflow:
              "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </strong>

        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color:
              "var(--text-soft)",
          }}
        >
          {formatPrice(item.price)}
        </div>
      </div>
    ))}
  </div>
)}
        </div>
      </section>

      {/* ===================================================== */}
      {/* IMPRESSÕES */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 24,
          borderRadius: 18,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin:
              "0 0 16px",
            fontSize: 20,
          }}
        >
          Como as impressões
          funcionarão
        </h2>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems:
              "flex-start",
            padding: 18,
            borderRadius: 14,
            background:
              "var(--surface-glass)",
            border:
              "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 28,
            }}
          >
            👁️
          </div>

          <div>
            <strong
              style={{
                fontSize: 18,
              }}
            >
              {formatNumber(
                selectedPackage.impressions,
              )}{" "}
              impressões totais
            </strong>

            <p
              style={{
                margin:
                  "8px 0 0",
                color:
                  "var(--text-soft)",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Essas impressões serão
              distribuídas entre os{" "}
              <strong
                style={{
                  color:
                    "var(--text)",
                }}
              >
                {productIds.length}
              </strong>{" "}
              produtos selecionados.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* VALOR */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 26,
          borderRadius: 18,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface-glass)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color:
                  "var(--text-soft)",
                marginBottom: 5,
              }}
            >
              Valor da campanha
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              {formatPrice(
                selectedPackage.price,
              )}
            </div>
          </div>

          <div
            style={{
              textAlign:
                "right",
              color:
                "var(--text-soft)",
              fontSize: 13,
            }}
          >
            {selectedPackage.name}
            <br />
            {formatNumber(
              selectedPackage.impressions,
            )}{" "}
            impressões
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* ACEITAÇÃO */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 18,
          borderRadius: 14,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          marginBottom: 110,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems:
              "flex-start",
            gap: 12,
            cursor:
              creating
                ? "not-allowed"
                : "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={accepted}
            disabled={creating}
            onChange={event =>
              setAccepted(
                event.target.checked,
              )
            }
            style={{
              marginTop: 3,
              width: 18,
              height: 18,
              accentColor:
                "var(--primary)",
            }}
          />

          <span
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color:
                "var(--text-soft)",
            }}
          >
            Confirmo que os dados desta
            campanha estão corretos e
            quero criar a campanha.
          </span>
        </label>

        {/* ERRO */}

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 10,
              border:
                "1px solid var(--border)",
              background:
                "var(--surface-glass)",
              color:
                "var(--text)",
              fontSize: 14,
            }}
          >
            ⚠️ {error}
          </div>
        )}
      </section>

      {/* ===================================================== */}
      {/* BARRA INFERIOR */}
      {/* ===================================================== */}

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
          padding:
            "14px 20px",
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
            maxWidth: 1000,
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: 20,
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
              Total
            </div>

            <strong
              style={{
                fontSize: 19,
              }}
            >
              {formatPrice(
                selectedPackage.price,
              )}
            </strong>
          </div>

          <button
            type="button"
            disabled={
              !accepted ||
              creating
            }
            onClick={
              createCampaign
            }
            style={{
              padding:
                "12px 24px",
              borderRadius: 9,
              border: "none",
              background:
                accepted &&
                !creating
                  ? "var(--primary)"
                  : "var(--border)",
              color:
                accepted &&
                !creating
                  ? "var(--text-on-primary)"
                  : "var(--text-soft)",
              cursor:
                accepted &&
                !creating
                  ? "pointer"
                  : "not-allowed",
              fontWeight: 700,
              minWidth: 170,
            }}
          >
            {creating
              ? "Criando..."
              : "Criar campanha"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* COMPONENTE AUXILIAR                                      */
/* ========================================================= */

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border:
          "1px solid var(--border)",
        background:
          "var(--surface-glass)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color:
            "var(--text-soft)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <strong>
        {value}
      </strong>
    </div>
  );
}