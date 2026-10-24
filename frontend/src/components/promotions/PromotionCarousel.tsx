import { useEffect, useRef } from "react";
import ProductCard from "../ProductCard";
import SmartImage from "../SmartImage";
import VerificationBadge from "../VerificationBadge";

type PromotionProduct = {
 id: string;
  name: string;
  type?: "NORMAL" | "AUCTION";
  price: number;
  stock?: number;
  imageUrl?: string | null;
  currentBid?: number;
  auctionStartPrice?: number;
  auctionEndsAt?: string;
  auctionClosed?: boolean;
  viewers?: number;
};

type Promotion = {
  id: string;
  name: string;
  priority?: number;

  store?: {
  id: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  verificationType?: string | null;
};

  products: {
    order: number;
    product: PromotionProduct;
  }[];
};

type PromotionCarouselProps = {
  promotion: Promotion;
  onImpression?: (promotionId: string) => void;
};

export default function PromotionCarousel({
  promotion,
  onImpression,
}: PromotionCarouselProps) {
  const impressionSent = useRef(false);

  useEffect(() => {
    if (impressionSent.current) return;

    impressionSent.current = true;

    onImpression?.(promotion.id);
  }, [promotion.id, onImpression]);

  const products = [...promotion.products]
    .sort((a, b) => a.order - b.order)
    .map((item) => item.product);

  if (!products.length) {
    return null;
  }

  return (
    <section
      style={{
        margin: "24px 0",
        padding: "18px",
        borderRadius: "20px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* CABEÇALHO DA PROMOÇÃO */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 800,
              fontSize: 16,
              color: "var(--text)",
            }}
          >
            🔥 Promovido
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              color: "var(--text-soft)",
            }}
          >
            {promotion.name}
          </div>
        </div>

        {promotion.store && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--text-soft)",
            }}
          >
            <div
  style={{
    width: 30,
    height: 30,
    borderRadius: "50%",
    overflow: "hidden",
    background: "var(--background)",
    flexShrink: 0,
  }}
>
  <SmartImage
    src={
      promotion.store.avatarUrl ??
      undefined
    }
    aspectRatio="1 / 1"
    fit="cover"
  />
</div>

            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
  {promotion.store.name}

  <VerificationBadge
    type={promotion.store.verificationType}
    verified={promotion.store.verified}
    size="sm"
  />
</span>
          </div>
        )}
      </div>

      {/* CARROSSEL */}

      <div
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          paddingBottom: 8,
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              flex: "0 0 220px",
              scrollSnapAlign: "start",
            }}
          >
            <ProductCard
              product={{
                ...product,
                storeId: promotion.store?.id,
                storeName: promotion.store?.name,
              }}
              showStore
            />
          </div>
        ))}
      </div>
    </section>
  );
}