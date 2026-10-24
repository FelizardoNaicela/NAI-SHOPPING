import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../services/api";
import FloatingDrawers from "../components/drawer/FloatingDrawers";

type PromotionPlacement = "FEED" | "SEARCH" | "CATEGORY";

type PromotionProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
};

type CreatePromotionState = {
  name: string;
  startsAt: string;
  endsAt: string;
  impressionLimit: number;
  placements: PromotionPlacement[];
  productIds: string[];
  products?: PromotionProduct[];
};

export default function PromotionCreatePage() {
  const navigate = useNavigate();
  const { id: storeId } = useParams();

  const location = useLocation();

  const state =
    location.state as CreatePromotionState | null;

  const [name, setName] = useState(
    state?.name ?? "Campanha de produtos",
  );

  const [startsAt, setStartsAt] = useState(
    state?.startsAt ?? "",
  );

  const [endsAt, setEndsAt] = useState(
    state?.endsAt ?? "",
  );

  const [impressionLimit, setImpressionLimit] =
    useState<number>(
      state?.impressionLimit ?? 100,
    );

  const [placements, setPlacements] = useState<
    PromotionPlacement[]
  >(
    state?.placements ?? ["FEED"],
  );

 const [productIds] = useState<string[]>(
  state?.productIds ?? [],
);

  const [products] = useState<
    PromotionProduct[]
  >(
    state?.products ?? [],
  );

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  function togglePlacement(
    placement: PromotionPlacement,
  ) {
    setPlacements((current) => {
      if (current.includes(placement)) {
        return current.filter(
          (item) => item !== placement,
        );
      }

      return [
        ...current,
        placement,
      ];
    });
  }

  async function handleCreate() {
    setError("");

    if (!name.trim()) {
      setError(
        "Informe o nome da campanha.",
      );
      return;
    }

    if (!startsAt || !endsAt) {
      setError(
        "Informe as datas da campanha.",
      );
      return;
    }

    if (
      new Date(endsAt) <=
      new Date(startsAt)
    ) {
      setError(
        "A data final deve ser posterior à inicial.",
      );
      return;
    }

    if (impressionLimit <= 0) {
      setError(
        "O limite de impressões deve ser maior que zero.",
      );
      return;
    }

    if (!placements.length) {
      setError(
        "Selecione pelo menos um local de exibição.",
      );
      return;
    }

    if (!productIds.length) {
      setError(
        "Selecione pelo menos um produto.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post(
        "/promotions",
        {
          name: name.trim(),

          startsAt: new Date(
            startsAt,
          ).toISOString(),

          endsAt: new Date(
            endsAt,
          ).toISOString(),

          impressionLimit,

          // A prioridade permanece sempre Normal.
          priority: 0,

          placements,

          productIds,
        },
      );

      const promotion =
        response.data;

      navigate(
        `/stores/${storeId}/promote/summary`,
        {
          state: {
            promotion,
            created: true,
          },
        },
      );
    } catch (err: any) {


      setError(
        err?.response?.data?.message ||
          "Não foi possível criar a campanha.",
      );
    } finally {
      setSubmitting(false);
    }
  }

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
      {/* CABEÇALHO */}

      <div
        style={{
          marginBottom: 28,
        }}
      >
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          style={{
            border: "none",
            background: "transparent",
            color: "var(--primary)",
            cursor: "pointer",
            padding: 0,
            marginBottom: 12,
            fontWeight: 700,
          }}
        >
          ← Voltar
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: 28,
          }}
        >
          Criar campanha
        </h1>

        <p
          style={{
            marginTop: 8,
            color: "var(--text-soft)",
          }}
        >
          Configure a campanha e crie-a
          como rascunho.
        </p>
      </div>

      {/* ERRO */}

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 10,
            border:
              "1px solid rgba(220, 38, 38, 0.4)",
            background:
              "rgba(220, 38, 38, 0.08)",
            color: "var(--text)",
          }}
        >
          {error}
        </div>
      )}

      {/* INFORMAÇÕES */}

      <section
        style={{
          padding: 20,
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Informações da campanha
        </h2>

        <label
          style={{
            display: "block",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            Nome da campanha
          </span>

          <input
            value={name}
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
            placeholder="Ex.: Promoção de fim de semana"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "11px 12px",
              borderRadius: 9,
              border:
                "1px solid var(--border)",
              background:
                "var(--surface-glass)",
              color: "var(--text)",
            }}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <label>
            <span
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 700,
              }}
            >
              Início
            </span>

            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) =>
                setStartsAt(
                  event.target.value,
                )
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 12px",
                borderRadius: 9,
                border:
                  "1px solid var(--border)",
                background:
                  "var(--surface-glass)",
                color: "var(--text)",
              }}
            />
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 700,
              }}
            >
              Fim
            </span>

            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) =>
                setEndsAt(
                  event.target.value,
                )
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 12px",
                borderRadius: 9,
                border:
                  "1px solid var(--border)",
                background:
                  "var(--surface-glass)",
                color: "var(--text)",
              }}
            />
          </label>
        </div>
      </section>

      {/* IMPRESSÕES */}

      <section
        style={{
          padding: 20,
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Impressões
        </h2>

        <p
          style={{
            color: "var(--text-soft)",
            marginTop: -8,
          }}
        >
          A campanha ficará ativa até
          atingir este limite ou chegar
          à data final.
        </p>

        <input
          type="number"
          min={1}
          value={impressionLimit}
          onChange={(event) =>
            setImpressionLimit(
              Number(event.target.value),
            )
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 12px",
            borderRadius: 9,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface-glass)",
            color: "var(--text)",
          }}
        />
      </section>

      {/* LOCAIS */}

      <section
        style={{
          padding: 20,
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Onde exibir
        </h2>

        <p
          style={{
            color: "var(--text-soft)",
          }}
        >
          Escolha onde os produtos
          promovidos poderão aparecer.
        </p>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          {[
            {
              value: "FEED" as const,
              label: "Feed",
              description:
                "Mostrar no feed principal.",
            },
            {
              value: "SEARCH" as const,
              label: "Pesquisa",
              description:
                "Mostrar nos resultados de pesquisa.",
            },
            {
              value: "CATEGORY" as const,
              label: "Categorias",
              description:
                "Mostrar nas páginas de categoria.",
            },
          ].map((item) => (
            <label
              key={item.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 10,
                border:
                  "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={placements.includes(
                  item.value,
                )}
                onChange={() =>
                  togglePlacement(
                    item.value,
                  )
                }
              />

              <div>
                <strong>
                  {item.label}
                </strong>

                <div
                  style={{
                    fontSize: 13,
                    color:
                      "var(--text-soft)",
                    marginTop: 3,
                  }}
                >
                  {item.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* PRODUTOS */}

      <section
        style={{
          padding: 20,
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Produtos selecionados
        </h2>

        {!products.length && (
          <p
            style={{
              color: "var(--text-soft)",
            }}
          >
            Nenhum produto foi recebido
            nesta etapa.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 14,
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                border:
                  "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                background:
                  "var(--surface-glass)",
              }}
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                  }}
                />
              )}

              <div
                style={{
                  padding: 12,
                }}
              >
                <strong>
                  {product.name}
                </strong>

                <div
                  style={{
                    marginTop: 5,
                    color:
                      "var(--text-soft)",
                  }}
                >
                  {product.price} MT
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRIORIDADE */}

      <section
        style={{
          padding: 18,
          borderRadius: 14,
          border:
            "1px solid var(--border)",
          background:
            "var(--surface-glass)",
          marginBottom: 24,
        }}
      >
        <strong>
          Prioridade: Normal
        </strong>

        <p
          style={{
            margin:
              "6px 0 0",
            fontSize: 13,
            color:
              "var(--text-soft)",
          }}
        >
          A prioridade da campanha é
          definida automaticamente como
          Normal.
        </p>
      </section>

      {/* AÇÃO */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        <button
          type="button"
          disabled={submitting}
          onClick={() =>
            navigate(-1)
          }
          style={{
            padding: "11px 18px",
            borderRadius: 9,
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={handleCreate}
          style={{
            padding: "11px 20px",
            borderRadius: 9,
            border: "none",
            background:
              "var(--primary)",
            color:
              "var(--text-on-primary)",
            cursor: submitting
              ? "wait"
              : "pointer",
            fontWeight: 800,
          }}
        >
          {submitting
            ? "Criando..."
            : "Criar campanha"}
        </button>
      </div>
    </div>
  );
}