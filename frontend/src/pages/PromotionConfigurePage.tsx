import { useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import FloatingDrawers from "../components/drawer/FloatingDrawers";

type PromotionType =
  | "feed"
  | "search"
  | "category";

type PackageInfo = {
  impressions: number;
  price: number;
  name: string;
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

const durationOptions = [
  {
    value: 1,
    label: "1 dia",
  },
  {
    value: 3,
    label: "3 dias",
  },
  {
    value: 7,
    label: "7 dias",
  },
  {
    value: 14,
    label: "14 dias",
  },
  {
    value: 30,
    label: "30 dias",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat(
    "pt-MZ",
  ).format(value);
}

function formatPrice(value: number) {
  return `${formatNumber(value)} MT`;
}

export default function PromotionConfigurePage() {
  const navigate = useNavigate();

  const { id: storeId } = useParams();

  const [searchParams] =
    useSearchParams();

  const typeParam =
    searchParams.get("type") || "feed";

  const packageId =
    searchParams.get("package") || "basic";

  const productsParam =
    searchParams.get("products") || "";

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

  const productIds = useMemo(() => {
    return productsParam
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);
  }, [productsParam]);

  const [duration, setDuration] =
    useState(7);

  const [priority] =
    useState<"normal">("normal");

  function goBack() {
    if (!storeId) return;

    const params =
      new URLSearchParams({
        type,
        package: packageId,
      });

    navigate(
      `/stores/${storeId}/promote/products?${params.toString()}`,
    );
  }

  function continueToSummary() {
    if (!storeId) return;

    if (productIds.length === 0) {
      return;
    }

    const params =
      new URLSearchParams({
        type,
        package: packageId,
        products: productIds.join(","),
        duration: String(duration),
        priority,
      });

    navigate(
      `/stores/${storeId}/promote/summary?${params.toString()}`,
    );
  }

  if (!storeId) {
    return (
      <div
        style={{
          padding: 24,
          color: "var(--text)",
        }}
      >
        Banca não encontrada.
      </div>
    );
  }

  if (productIds.length === 0) {
    return (
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: 24,
          color: "var(--text)",
        }}
      >
        <FloatingDrawers />

        <h1
          style={{
            marginBottom: 12,
          }}
        >
          🔥 Configurar promoção
        </h1>

        <p
          style={{
            color: "var(--text-soft)",
            marginBottom: 24,
          }}
        >
          Nenhum produto foi selecionado
          para esta campanha.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/stores/${storeId}/promote`,
            )
          }
          style={{
            padding: "10px 16px",
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
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: 24,
        paddingBottom: 120,
        color: "var(--text)",
      }}
    >
      <FloatingDrawers />

      {/* ===================================================== */}
      {/* VOLTAR */}
      {/* ===================================================== */}

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

      {/* ===================================================== */}
      {/* CABEÇALHO */}
      {/* ===================================================== */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <div
          style={{
            fontSize: 36,
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
          Configurar promoção
        </h1>

        <p
          style={{
            marginTop: 8,
            color: "var(--text-soft)",
            lineHeight: 1.5,
          }}
        >
          Defina por quanto tempo a campanha
          poderá entregar as impressões
          contratadas.
        </p>
      </div>

      {/* ===================================================== */}
      {/* RESUMO PRINCIPAL */}
      {/* ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {/* TIPO */}

        <div
          style={{
            padding: 18,
            borderRadius: 14,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
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
            Tipo
          </div>

          <strong>
            {promotion.icon}{" "}
            {promotion.title}
          </strong>
        </div>

        {/* PACOTE */}

        <div
          style={{
            padding: 18,
            borderRadius: 14,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
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
            Pacote
          </div>

          <strong>
            {selectedPackage.name}
          </strong>
        </div>

        {/* IMPRESSÕES */}

        <div
          style={{
            padding: 18,
            borderRadius: 14,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
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
            Impressões
          </div>

          <strong>
            {formatNumber(
              selectedPackage.impressions,
            )}
          </strong>
        </div>

        {/* VALOR */}

        <div
          style={{
            padding: 18,
            borderRadius: 14,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
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
            Valor
          </div>

          <strong>
            {formatPrice(
              selectedPackage.price,
            )}
          </strong>
        </div>
      </div>

      {/* ===================================================== */}
      {/* DURAÇÃO */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 24,
          borderRadius: 16,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 19,
          }}
        >
          Duração da campanha
        </h2>

        <p
          style={{
            margin: "0 0 20px",
            color:
              "var(--text-soft)",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          A campanha poderá entregar as
          impressões contratadas durante
          este período.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          {durationOptions.map(
            option => {
              const active =
                duration ===
                option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setDuration(
                      option.value,
                    )
                  }
                  style={{
                    padding:
                      "14px 12px",
                    borderRadius: 10,
                    border: active
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                    background: active
                      ? "var(--surface-glass)"
                      : "var(--surface)",
                    color:
                      "var(--text)",
                    cursor:
                      "pointer",
                    fontWeight:
                      active
                        ? 700
                        : 500,
                  }}
                >
                  {option.label}
                </button>
              );
            },
          )}
        </div>
      </section>

      {/* ===================================================== */}
      {/* IMPRESSÕES */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 24,
          borderRadius: 16,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 19,
          }}
        >
          Impressões
        </h2>

        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: 16,
            padding: 18,
            borderRadius: 12,
            background:
              "var(--surface-glass)",
            border:
              "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 30,
            }}
          >
            👁️
          </div>

          <div>
            <strong
              style={{
                fontSize: 20,
              }}
            >
              {formatNumber(
                selectedPackage.impressions,
              )}{" "}
              impressões
            </strong>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "var(--text-soft)",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Este número é definido pelo
              pacote escolhido e não pode
              ser alterado nesta etapa.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 10,
            background:
              "var(--surface-glass)",
            color:
              "var(--text-soft)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          As impressões serão distribuídas
          entre os{" "}
          <strong
            style={{
              color: "var(--text)",
            }}
          >
            {productIds.length}
          </strong>{" "}
          produtos selecionados quando
          a campanha for executada.
        </div>
      </section>

      {/* ===================================================== */}
      {/* PRIORIDADE */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 24,
          borderRadius: 16,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 19,
          }}
        >
          Prioridade
        </h2>

        <p
          style={{
            margin: "0 0 18px",
            color:
              "var(--text-soft)",
            fontSize: 14,
          }}
        >
          Define como a campanha poderá
          concorrer com outras campanhas.
        </p>

        <div
          style={{
            padding: 18,
            borderRadius: 12,
            border:
              "2px solid var(--primary)",
            background:
              "var(--surface-glass)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius:
                  "50%",
                border:
                  "6px solid var(--primary)",
                boxSizing:
                  "border-box",
              }}
            />

            <div>
              <strong>
                Prioridade normal
              </strong>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color:
                    "var(--text-soft)",
                }}
              >
                Incluída neste pacote.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* PRODUTOS SELECIONADOS */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 24,
          borderRadius: 16,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface)",
          marginBottom: 30,
        }}
      >
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 19,
          }}
        >
          Produtos selecionados
        </h2>

        <p
          style={{
            margin: "0 0 16px",
            color:
              "var(--text-soft)",
            fontSize: 14,
          }}
        >
          Esta campanha será aplicada aos
          seguintes produtos:
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {productIds.map(
            (productId, index) => (
              <span
                key={productId}
                style={{
                  padding:
                    "7px 11px",
                  borderRadius: 999,
                  background:
                    "var(--surface-glass)",
                  border:
                    "1px solid var(--border)",
                  fontSize: 13,
                }}
              >
                Produto {index + 1}
              </span>
            ),
          )}
        </div>
      </section>

      {/* ===================================================== */}
      {/* RESUMO FINAL */}
      {/* ===================================================== */}

      <section
        style={{
          padding: 22,
          borderRadius: 16,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface-glass)",
          marginBottom: 100,
        }}
      >
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: 19,
          }}
        >
          Resumo da configuração
        </h2>

        <div
          style={{
            display: "grid",
            gap: 10,
            fontSize: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 20,
            }}
          >
            <span
              style={{
                color:
                  "var(--text-soft)",
              }}
            >
              Tipo
            </span>

            <strong>
              {promotion.title}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 20,
            }}
          >
            <span
              style={{
                color:
                  "var(--text-soft)",
              }}
            >
              Pacote
            </span>

            <strong>
              {selectedPackage.name}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 20,
            }}
          >
            <span
              style={{
                color:
                  "var(--text-soft)",
              }}
            >
              Produtos
            </span>

            <strong>
              {productIds.length}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 20,
            }}
          >
            <span
              style={{
                color:
                  "var(--text-soft)",
              }}
            >
              Duração
            </span>

            <strong>
              {duration}{" "}
              {duration === 1
                ? "dia"
                : "dias"}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 20,
            }}
          >
            <span
              style={{
                color:
                  "var(--text-soft)",
              }}
            >
              Impressões
            </span>

            <strong>
              {formatNumber(
                selectedPackage.impressions,
              )}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 20,
              paddingTop: 12,
              marginTop: 4,
              borderTop:
                "1px solid var(--border)",
            }}
          >
            <span
              style={{
                color:
                  "var(--text-soft)",
              }}
            >
              Valor
            </span>

            <strong
              style={{
                fontSize: 18,
              }}
            >
              {formatPrice(
                selectedPackage.price,
              )}
            </strong>
          </div>
        </div>
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
    justifyContent: "center",
    pointerEvents: "none",
  }}
>
  <div
    style={{
      width: "100%",
      maxWidth: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 20,
      padding: "14px 20px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      boxShadow: "0 -4px 20px rgba(0,0,0,.12)",
      pointerEvents: "auto",
    }}
  >
    <div>
      <strong>
        {duration}{" "}
        {duration === 1
          ? "dia"
          : "dias"}
      </strong>

      <span
        style={{
          color: "var(--text-soft)",
          marginLeft: 8,
        }}
      >
        ·{" "}
        {formatNumber(
          selectedPackage.impressions,
        )}{" "}
        impressões
      </span>
    </div>

    <button
      type="button"
      onClick={continueToSummary}
      style={{
        padding: "12px 24px",
        borderRadius: 9,
        border: "none",
        background: "var(--primary)",
        color: "var(--text-on-primary)",
        cursor: "pointer",
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