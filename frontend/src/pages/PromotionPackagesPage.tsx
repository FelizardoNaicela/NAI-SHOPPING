import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import FloatingDrawers from "../components/drawer/FloatingDrawers";
import {
  getPromotionPackages,
} from "../services/promotions";

type PromotionType =
  | "feed"
  | "search"
  | "category";

type PromotionPackage = {
  id: string;
  impressions: number;
  price: number;
  isActive: boolean;
  popular?: boolean;
  badge?: string;
};

const packageVisuals: Record<
  string,
  {
    popular?: boolean;
    badge?: string;
  }
> = {
  popular: {
    popular: true,
    badge: "MAIS POPULAR",
  },

  large: {
    badge: "MELHOR VALOR",
  },
};

const promotionLabels: Record<
  PromotionType,
  {
    title: string;
    description: string;
    icon: string;
  }
> = {
  feed: {
    icon: "🔥",
    title: "Promoção no Feed",
    description:
      "Seu produto poderá aparecer em destaque no feed através de um carrossel patrocinado.",
  },

  search: {
    icon: "🔎",
    title: "Promoção na Pesquisa",
    description:
      "Seus produtos poderão aparecer em posições patrocinadas nos resultados de pesquisa.",
  },

  category: {
    icon: "🏷️",
    title: "Promoção nas Categorias",
    description:
      "Seus produtos poderão aparecer em destaque dentro das categorias.",
  },
};

function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    "pt-MZ",
  ).format(value);
}

function pricePerThousand(
  price: number,
  impressions: number,
) {
  if (impressions <= 0) {
    return 0;
  }

  return (
    (price / impressions) *
    1000
  );
}

export default function PromotionPackagesPage() {
  const navigate = useNavigate();

  const {
    id: storeId,
    type,
  } = useParams();

  const [promotionPackages, setPromotionPackages] =
    useState<PromotionPackage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const promotionType: PromotionType =
    type === "search" ||
    type === "category"
      ? type
      : "feed";

  const promotion =
    promotionLabels[promotionType];

  useEffect(() => {
    let mounted = true;

    async function loadPackages() {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getPromotionPackages();

        if (!mounted) {
          return;
        }

        const activePackages =
          Array.isArray(data)
            ? data
                .filter(
                  (
                    promotionPackage,
                  ) =>
                    promotionPackage &&
                    promotionPackage.isActive !==
                      false,
                )
                .map(
                  (
                    promotionPackage,
                  ) => ({
                    ...promotionPackage,
                    ...packageVisuals[
                      promotionPackage.id
                    ],
                  }),
                )
            : [];

        setPromotionPackages(
          activePackages,
        );
      } catch (err) {

        if (mounted) {
          setError(
            "Não foi possível carregar os pacotes de promoção.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPackages();

    return () => {
      mounted = false;
    };
  }, []);

  function selectPackage(
    promotionPackage: PromotionPackage,
  ) {
    if (!storeId) {
      return;
    }

    const params =
      new URLSearchParams({
        type: promotionType,
        package:
          promotionPackage.id,
      });

    navigate(
      `/stores/${storeId}/promote/products?${params.toString()}`,
    );
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 24,
        color: "var(--text)",
      }}
    >
      <FloatingDrawers />

      {/* VOLTAR */}

      <button
        type="button"
        onClick={() =>
          navigate(-1)
        }
        style={{
          marginBottom: 28,
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
          marginBottom: 32,
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
          {promotion.title}
        </h1>

        <p
          style={{
            marginTop: 10,
            maxWidth: 700,
            color:
              "var(--text-soft)",
            lineHeight: 1.5,
          }}
        >
          {promotion.description}
        </p>

        <p
          style={{
            marginTop: 12,
            fontSize: 14,
            color:
              "var(--text-soft)",
          }}
        >
          Escolha quantas
          impressões você deseja
          contratar.
        </p>
      </div>

      {/* CARREGANDO */}

      {loading && (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            borderRadius: 16,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
            color:
              "var(--text-soft)",
          }}
        >
          Carregando pacotes...
        </div>
      )}

      {/* ERRO */}

      {!loading && error && (
        <div
          style={{
            padding: 18,
            borderRadius: 12,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
            color:
              "var(--text)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* NENHUM PACOTE */}

      {!loading &&
        !error &&
        promotionPackages.length ===
          0 && (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              borderRadius: 16,
              border:
                "1px solid var(--border)",
              background:
                "var(--surface)",
              color:
                "var(--text-soft)",
            }}
          >
            Nenhum pacote de promoção
            está disponível no momento.
          </div>
        )}

      {/* PACOTES */}

      {!loading &&
        !error &&
        promotionPackages.length >
          0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            {promotionPackages.map(
              (
                promotionPackage,
              ) => {
                const costPerThousand =
                  pricePerThousand(
                    promotionPackage.price,
                    promotionPackage.impressions,
                  );

                return (
                  <article
                    key={
                      promotionPackage.id
                    }
                    style={{
                      position:
                        "relative",
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      padding: 22,
                      borderRadius: 16,
                      border:
                        promotionPackage.popular
                          ? "2px solid var(--primary)"
                          : "1px solid var(--border)",
                      background:
                        "var(--surface)",
                      boxShadow:
                        promotionPackage.popular
                          ? "var(--shadow-lg)"
                          : "var(--shadow-sm)",
                    }}
                  >
                    {/* BADGE */}

                    {promotionPackage.badge && (
                      <div
                        style={{
                          position:
                            "absolute",
                          top: 12,
                          right: 12,
                          padding:
                            "4px 8px",
                          borderRadius:
                            999,
                          background:
                            promotionPackage.popular
                              ? "var(--primary)"
                              : "var(--surface-glass)",
                          color:
                            promotionPackage.popular
                              ? "var(--text-on-primary)"
                              : "var(--text)",
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      >
                        {
                          promotionPackage.badge
                        }
                      </div>
                    )}

                    {/* IMPRESSÕES */}

                    <div
                      style={{
                        fontSize: 13,
                        color:
                          "var(--text-soft)",
                        marginBottom: 8,
                      }}
                    >
                      Pacote
                    </div>

                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      {formatNumber(
                        promotionPackage.impressions,
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color:
                          "var(--text-soft)",
                      }}
                    >
                      impressões
                    </div>

                    {/* PREÇO */}

                    <div
                      style={{
                        marginTop: 22,
                        fontSize: 25,
                        fontWeight: 800,
                      }}
                    >
                      {formatNumber(
                        promotionPackage.price,
                      )}{" "}
                      MT
                    </div>

                    {/* CUSTO */}

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color:
                          "var(--text-soft)",
                      }}
                    >
                      {costPerThousand.toFixed(
                        0,
                      )}{" "}
                      MT / 1.000
                      impressões
                    </div>

                    {/* BENEFÍCIO */}

                    {promotionPackage.impressions >=
                      5000 && (
                      <div
                        style={{
                          marginTop: 14,
                          padding:
                            "7px 9px",
                          borderRadius: 8,
                          background:
                            "var(--surface-glass)",
                          fontSize: 12,
                        }}
                      >
                        💰 Melhor custo
                        por impressão
                      </div>
                    )}

                    {/* BOTÃO */}

                    <button
                      type="button"
                      onClick={() =>
                        selectPackage(
                          promotionPackage,
                        )
                      }
                      style={{
                        marginTop:
                          "auto",
                        padding:
                          "11px 14px",
                        borderRadius: 9,
                        border:
                          "none",
                        background:
                          "var(--primary)",
                        color:
                          "var(--text-on-primary)",
                        cursor:
                          "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Escolher pacote
                    </button>
                  </article>
                );
              },
            )}
          </div>
        )}

      {/* NOTA */}

      <div
        style={{
          marginTop: 30,
          padding: 16,
          borderRadius: 12,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface-glass)",
          color:
            "var(--text-soft)",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        💡 O número de impressões
        representa a quantidade máxima
        de vezes que a campanha poderá
        ser exibida. O pagamento ainda
        não está integrado nesta etapa.
      </div>
    </div>
  );
}