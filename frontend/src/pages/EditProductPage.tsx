import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getProduct,
  updateProduct,
} from "../services/products";

import { useAuth } from "../auth/AuthProvider";

import { api } from "../services/api";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId?: string | null;

  type?: "NORMAL" | "AUCTION";

  isPublished?: boolean;

  auctionStartPrice?: number | null;
  currentBid?: number | null;
  minimumIncrement?: number | null;
  reservePrice?: number | null;

  auctionStartsAt?: string | null;
  auctionEndsAt?: string | null;

  store?: {
    id: string;
    name: string;
    ownerId: string;
  };
};

export default function EditProductPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const { user } = useAuth();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

    const [categories, setCategories] =
  useState<any[]>([]);

  // ==============================
  // CAMPOS
  // ==============================

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [stock, setStock] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [publishToFeed, setPublishToFeed] =
    useState(true);

  // ==============================
  // LEILÃO
  // ==============================

  const [auctionStartPrice, setAuctionStartPrice] =
    useState("");

  const [minimumIncrement, setMinimumIncrement] =
    useState("");

  const [reservePrice, setReservePrice] =
    useState("");

  const [auctionStartsAt, setAuctionStartsAt] =
    useState("");

  const [auctionEndsAt, setAuctionEndsAt] =
    useState("");

  // ==============================
  // CARREGAR PRODUTO
  // ==============================

  useEffect(() => {
    async function loadProduct() {
      if (!id) {
        setError("Produto inválido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getProduct(id);

        if (!data) {
          setError(
            "Produto não encontrado.",
          );
          return;
        }

        setProduct(data);

        if (data.store?.id) {
  try {
    const res = await api.get(
      `/categories?storeId=${data.store.id}`,
    );

    const list =
      res.data.items ||
      res.data ||
      [];

    setCategories(
      Array.isArray(list)
        ? list
        : [],
    );
  } catch (err) {


    setCategories([]);
  }
}

        // ==========================
        // PREENCHER FORMULÁRIO
        // ==========================

        setName(data.name ?? "");

        setDescription(
          data.description ?? "",
        );

        setPrice(
          data.price !== undefined &&
          data.price !== null
            ? String(data.price)
            : "",
        );

        setStock(
          data.stock !== undefined &&
          data.stock !== null
            ? String(data.stock)
            : "",
        );

        setCategoryId(
          data.categoryId ?? "",
        );

        setPublishToFeed(
          data.isPublished ?? true,
        );

        // ==========================
        // LEILÃO
        // ==========================

        setAuctionStartPrice(
          data.auctionStartPrice != null
            ? String(data.auctionStartPrice)
            : "",
        );

        setMinimumIncrement(
          data.minimumIncrement != null
            ? String(data.minimumIncrement)
            : "",
        );

        setReservePrice(
          data.reservePrice != null
            ? String(data.reservePrice)
            : "",
        );

        setAuctionStartsAt(
          data.auctionStartsAt
            ? formatDateTimeLocal(
                data.auctionStartsAt,
              )
            : "",
        );

        setAuctionEndsAt(
          data.auctionEndsAt
            ? formatDateTimeLocal(
                data.auctionEndsAt,
              )
            : "",
        );

      } catch (err) {


        setError(
          "Não foi possível carregar o produto.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  // ==============================
  // VERIFICAR DONO
  // ==============================

  const isOwner =
  !!user?.id &&
  !!product?.store?.ownerId &&
  user.id === product.store.ownerId;

const auctionExpired =
  product?.type === "AUCTION" &&
  !!product.auctionEndsAt &&
  new Date() >= new Date(product.auctionEndsAt);

  // ==============================
  // SALVAR
  // ==============================

  async function handleSubmit(
    e: FormEvent,
  ) {
    e.preventDefault();

    if (!id) return;

    if (!isOwner) {
      setError(
        "Você não tem permissão para editar este produto.",
      );
      return;
    }

    if (auctionExpired) {
  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: 24,
        color: "var(--text)",
      }}
    >
      <h2>
        Leilão encerrado
      </h2>

      <p
        style={{
          color: "var(--text-soft)",
          marginTop: 8,
        }}
      >
        Este leilão já terminou e não pode mais ser editado.
      </p>

      <button
        type="button"
        onClick={() =>
          navigate(`/product/${product.id}`)
        }
      >
        Voltar ao leilão
      </button>
    </div>
  );
}

    const numericPrice =
      Number(price);

    const numericStock =
      Number(stock);

    if (!name.trim()) {
      setError(
        "O nome do produto é obrigatório.",
      );
      return;
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setError(
        "O preço deve ser maior que zero.",
      );
      return;
    }

    if (
      !Number.isFinite(numericStock) ||
      numericStock < 0
    ) {
      setError(
        "O stock não pode ser negativo.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: Parameters<
        typeof updateProduct
      >[1] = {
        name: name.trim(),

        description:
          description.trim() || undefined,

        price: numericPrice,

        stock: numericStock,

        categoryId:
          categoryId.trim() || null,

        publishToFeed,

      };

      // ==========================
      // CAMPOS DO LEILÃO
      // ==========================

      if (
        product.type === "AUCTION"
      ) {
        if (auctionStartPrice.trim()) {
          payload.auctionStartPrice =
            Number(
              auctionStartPrice,
            );
        }

        if (
          minimumIncrement.trim()
        ) {
          payload.minimumIncrement =
            Number(
              minimumIncrement,
            );
        }

        if (reservePrice.trim()) {
          payload.reservePrice =
            Number(
              reservePrice,
            );
        }

        if (auctionStartsAt) {
          payload.auctionStartsAt =
            new Date(
              auctionStartsAt,
            ).toISOString();
        }

        if (auctionEndsAt) {
          payload.auctionEndsAt =
            new Date(
              auctionEndsAt,
            ).toISOString();
        }
      }

      await updateProduct(
        id,
        payload,
      );

      // avisar outras telas
      window.dispatchEvent(
        new CustomEvent(
          "productUpdated",
          {
            detail: {
              productId: id,
            },
          },
        ),
      );

      // voltar ao produto
      navigate(
        `/product/${id}`,
      );

    } catch (err: any) {


      const message =
        err?.response?.data?.message;

      if (
        Array.isArray(message)
      ) {
        setError(
          message.join(", "),
        );
      } else {
        setError(
          message ||
            "Não foi possível atualizar o produto.",
        );
      }

    } finally {
      setSaving(false);
    }
  }

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div
        style={{
          padding: 30,
          color: "var(--text)",
        }}
      >
        Carregando produto...
      </div>
    );
  }

  // ==============================
  // ERRO / NÃO ENCONTRADO
  // ==============================

  if (!product) {
    return (
      <div
        style={{
          padding: 30,
          color: "var(--text)",
        }}
      >
        <h2>Produto não encontrado</h2>

        {error && (
          <p
            style={{
              color: "#d32f2f",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
        >
          Voltar
        </button>
      </div>
    );
  }

  // ==============================
  // NÃO É DONO
  // ==============================

  if (!isOwner) {
    return (
      <div
        style={{
          padding: 30,
          color: "var(--text)",
        }}
      >
        <h2>
          Sem permissão
        </h2>

        <p
          style={{
            color:
              "var(--text-soft)",
          }}
        >
          Você não é o dono deste
          produto.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/product/${product.id}`,
            )
          }
        >
          Voltar ao produto
        </button>
      </div>
    );
  }

  // ==============================
  // FORMULÁRIO
  // ==============================

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: 24,
        color: "var(--text)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            Editar produto
          </h2>

          <p
            style={{
              marginTop: 6,
              color:
                "var(--text-soft)",
            }}
          >
            {product.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/product/${product.id}`,
            )
          }
          disabled={saving}
        >
          Cancelar
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: 12,
            borderRadius: 8,
            background:
              "rgba(211, 47, 47, 0.10)",
            color: "#d32f2f",
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* NOME */}

        <label>
          <div
            style={{
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Nome do produto
          </div>

          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            disabled={saving}
            style={inputStyle}
          />
        </label>

        {/* DESCRIÇÃO */}

        <label>
          <div
            style={{
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Descrição
          </div>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value,
              )
            }
            disabled={saving}
            rows={5}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />
        </label>

        {/* PREÇO */}

        <label>
          <div
            style={{
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Preço
          </div>

          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            disabled={saving}
            style={inputStyle}
          />
        </label>

        {/* STOCK */}

        <label>
          <div
            style={{
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Stock
          </div>

          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) =>
              setStock(e.target.value)
            }
            disabled={saving}
            style={inputStyle}
          />
        </label>

        {/* CATEGORIA */}

        <label>
          <div
            style={{
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Categoria
          </div>

          <select
  value={categoryId}
  onChange={(e) =>
    setCategoryId(e.target.value)
  }
  disabled={saving}
  style={inputStyle}
>
  <option value="">
    Selecionar categoria
  </option>

  {categories.map((cat) => (
    <optgroup
      key={cat.id}
      label={cat.name}
    >
      <option value={cat.id}>
        {cat.name}
      </option>

      {cat.children?.map(
        (sub: any) => (
          <option
            key={sub.id}
            value={sub.id}
          >
            └ {sub.name}
          </option>
        ),
      )}
    </optgroup>
  ))}
</select>
        </label>

        {/* PUBLICAR */}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={publishToFeed}
            onChange={(e) =>
              setPublishToFeed(
                e.target.checked,
              )
            }
            disabled={saving}
          />

          <span>
            Publicar no feed
          </span>
        </label>

        {/* ====================== */}
        {/* LEILÃO */}
        {/* ====================== */}

        {product.type ===
          "AUCTION" && (
          <div
            style={{
              marginTop: 10,
              padding: 18,
              borderRadius: 10,
              border:
                "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              Configurações do leilão
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 16,
              }}
            >
              <label>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Lance inicial
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    auctionStartPrice
                  }
                  onChange={(e) =>
                    setAuctionStartPrice(
                      e.target.value,
                    )
                  }
                  disabled={saving}
                  style={inputStyle}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Incremento mínimo
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    minimumIncrement
                  }
                  onChange={(e) =>
                    setMinimumIncrement(
                      e.target.value,
                    )
                  }
                  disabled={saving}
                  style={inputStyle}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Preço de reserva
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    reservePrice
                  }
                  onChange={(e) =>
                    setReservePrice(
                      e.target.value,
                    )
                  }
                  disabled={saving}
                  style={inputStyle}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Início do leilão
                </div>

                <input
                  type="datetime-local"
                  value={
                    auctionStartsAt
                  }
                  onChange={(e) =>
                    setAuctionStartsAt(
                      e.target.value,
                    )
                  }
                  disabled={saving}
                  style={inputStyle}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Fim do leilão
                </div>

                <input
                  type="datetime-local"
                  value={
                    auctionEndsAt
                  }
                  onChange={(e) =>
                    setAuctionEndsAt(
                      e.target.value,
                    )
                  }
                  disabled={saving}
                  style={inputStyle}
                />
              </label>
            </div>
          </div>
        )}

        {/* SALVAR */}

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: 10,
            padding: "13px 18px",
            border: "none",
            borderRadius: 8,
            cursor: saving
              ? "default"
              : "pointer",
            fontWeight: 700,
          }}
        >
          {saving
            ? "A guardar..."
            : "Guardar alterações"}
        </button>
      </form>
    </div>
  );
}

// ==========================================
// HELPERS
// ==========================================

function formatDateTimeLocal(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const pad = (n: number) =>
    String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}

const inputStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  padding: "11px 12px",
  borderRadius: 8,
  border:
    "1px solid var(--border)",
  background:
    "var(--surface)",
  color: "var(--text)",
  fontSize: 14,
};