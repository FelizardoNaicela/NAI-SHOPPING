import { useNavigate, useParams } from "react-router-dom";
import FloatingDrawers from "../components/drawer/FloatingDrawers";
import {
  Flame,
  Search,
  Tag,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

type PromotionType =
  | "FEED"
  | "SEARCH"
  | "CATEGORY";

type PromotionOption = {
  type: PromotionType;
  icon: React.ElementType;
  title: string;
  description: string;
  effect: string;
};

const promotionOptions: PromotionOption[] = [
  {
    type: "FEED",
    icon: Flame,
    title: "Promoção no Feed",
    description:
      "Seus produtos aparecem em um carrossel patrocinado no feed.",
    effect:
      "Ideal para apresentar vários produtos da sua banca.",
  },
  {
    type: "SEARCH",
    icon: Search,
    title: "Promoção na Pesquisa",
    description:
      "Seus produtos aparecem entre os resultados patrocinados.",
    effect:
      "Ideal para aumentar a visibilidade quando clientes procuram produtos.",
  },
  {
    type: "CATEGORY",
    icon: Tag,
    title: "Promoção nas Categorias",
    description:
      "Seus produtos aparecem como produtos promovidos dentro das categorias.",
    effect:
      "Ideal para alcançar clientes navegando por categorias.",
  },
];

export default function PromotionPage() {
  const navigate = useNavigate();
  const { id: storeId } = useParams();

  function choosePromotion(type: PromotionType) {
    if (!storeId) return;

    navigate(`/stores/${storeId}/promote/${type.toLowerCase()}`);
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
      <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={() => navigate(-1)}
    style={{
      padding: "8px 14px",
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      color: "var(--text)",
      cursor: "pointer",
      fontWeight: 600,
      display: "flex",
alignItems: "center",
gap: 8,
    }}
  >
   <ArrowLeft size={17} />
Voltar
  </button>

  <button
    type="button"
    onClick={() => navigate("/promotions")}
    style={{
      padding: "9px 16px",
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      color: "var(--text)",
      cursor: "pointer",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}
  >
<ClipboardList size={18} />
Minhas promoções
  </button>
</div>

      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
          }}
        >
          <span
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  }}
>
  <Flame size={27} />
  Promover produtos
</span>
        </h1>

        <p
          style={{
            marginTop: 8,
            color: "var(--text-soft)",
            fontSize: 15,
          }}
        >
          Escolha onde você quer divulgar os produtos da sua banca.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {promotionOptions.map((option) => (
          <article
            key={option.type}
            style={{
              padding: 24,
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
  style={{
    width: 54,
    height: 54,
    marginBottom: 14,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--surface-glass)",
    border: "1px solid var(--border)",
  }}
>
  <option.icon
    size={28}
    strokeWidth={1.8}
  />
</div>

            <h2
              style={{
                margin: "0 0 10px",
                fontSize: 19,
              }}
            >
              {option.title}
            </h2>

            <p
              style={{
                margin: "0 0 12px",
                color: "var(--text-soft)",
                lineHeight: 1.5,
              }}
            >
              {option.description}
            </p>

            <p
              style={{
                margin: "0 0 20px",
                fontSize: 13,
                color: "var(--text-soft)",
              }}
            >
              {option.effect}
            </p>

            <button
              type="button"
              onClick={() =>
                choosePromotion(option.type)
              }
              style={{
                width: "100%",
                padding: "11px 16px",
                borderRadius: 9,
                border: "none",
                background: "var(--primary)",
                color: "var(--text-on-primary)",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Escolher
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}