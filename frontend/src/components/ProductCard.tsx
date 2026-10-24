import { useNavigate } from "react-router-dom";
import SmartImage from "./SmartImage";
import AuctionCardCountdown from "./auction/AuctionCardCountdown";
import FavoriteButton from "./FavoriteButton";
import ProductActions from "./share/ProductActions";
import styles from "./ProductCard.module.css";
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import VerificationBadge from "./VerificationBadge";

type Product = {
  id: string;
  name: string;
  type?: "NORMAL" | "AUCTION";
  price: number;
  stock?: number;
  discountedPrice?: number | null;

  activeDiscount?: {
    id: string;
    name?: string | null;
    discountPercent: number;
    startsAt?: string;
    endsAt?: string;
  } | null;

  imageUrl?: string | null;
  storeName?: string | null;
  storeId?: string;

 store?: {
  id: string;
  name: string;
  ownerId?: string;
  verified?: boolean;
  verificationType?: string | null;
  type?: string | null;
};

  currentBid?: number;
  auctionStartPrice?: number;
  auctionEndsAt?: string;
  auctionClosed?: boolean;
  viewers?: number;
};

type Props = {
  product: Product;
  showStore?: boolean;
};

export default function ProductCard({ product, showStore = false }: Props) {

  const navigate = useNavigate();

  const soldOut =
  product.type !== "AUCTION" &&
  typeof product.stock === "number" &&
  product.stock <= 0;

const [showSoldOut, setShowSoldOut] = useState(false);
const timer = useRef<number | null>(null);

useEffect(() => {
  return () => {
    if (timer.current) window.clearTimeout(timer.current);
  };
}, []);

function toggleSoldOut(event: React.MouseEvent) {
  // não abrir a página do produto
  event.stopPropagation();

  if (timer.current) window.clearTimeout(timer.current);

  if (showSoldOut) {
    setShowSoldOut(false);
    return;
  }

  setShowSoldOut(true);
  timer.current = window.setTimeout(() => setShowSoldOut(false), 3000);
}

  function openProduct() {
    navigate(`/product/${product.id}`);
  }

  return (

    <div
      onClick={openProduct}
      className={styles.cardWrapper}
    >

      <div className={styles.card}>

        {/* imagem */}

        <div
  className={`${styles.imageContainer} ${
    soldOut ? styles.soldOutImage : ""
  }`}
>

          <ProductActions
            productId={product.id}
            storeId={product.storeId}
            storeOwnerId={product.store?.ownerId}
          />

          <SmartImage
            src={product.imageUrl}
            aspectRatio="1 / 1"
            fit="cover"
          />

          <div
            className={`${styles.badge} ${
              product.type === "AUCTION"
                ? styles.auctionBadge
                : styles.productBadge
            }`}
          >
            {product.type === "AUCTION"
              ? "🏛 LEILÃO"
              : "🛒 PRODUTO"}
          </div>

          {soldOut && (
  <div className={styles.soldOutWrap}>
    {showSoldOut && (
      <div className={styles.soldOutMsg} role="status">
        Produto esgotado
      </div>
    )}

    <button
      type="button"
      className={styles.soldOutBtn}
      aria-label="Produto esgotado"
      onClick={toggleSoldOut}
    >
      <AlertCircle size={20} strokeWidth={2.4} />
    </button>
  </div>
)}

        </div>

        {/* info */}

        <div className={styles.content}>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.4,
              minHeight: 40,
            }}
          >
            {product.name}
          </div>

          {showStore && product.storeName && (
  <div
    style={{
      marginTop: 4,
      fontSize: 12,
      color: "var(--text-soft)",
      display: "flex",
      alignItems: "center",
      gap: 4,
    }}
  >
    {product.storeName}

    <VerificationBadge
      type={product.store?.verificationType}
      verified={product.store?.verified}
      size="sm"
    />
  </div>
)}

          {product.type === "AUCTION" ? (

            <>

              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >

                <div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-soft)",
                    }}
                  >
                    Lance atual
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 18,
                      color: "var(--text)",
                    }}
                  >
                    {product.currentBid ??
                      product.auctionStartPrice}{" "}
                    MT
                  </div>

                </div>

                <FavoriteButton
                  productId={product.id}
                  size={18}
                />

              </div>

              {product.viewers !== undefined && (

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "var(--text-soft)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  👀 {product.viewers}
                </div>

              )}

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >

                <AuctionCardCountdown
                  endDate={product.auctionEndsAt}
                  auctionClosed={product.auctionClosed}
                />

                <span
                  style={{
                    color: product.auctionClosed
                      ? "#d32f2f"
                      : "#ff9800",
                    fontWeight: 700,
                  }}
                >
                  {product.auctionClosed
                    ? "ENCERRADO"
                    : "LEILÃO"}
                </span>

              </div>

            </>

          ) : (

            <div className={styles.priceRow}>

              {product.activeDiscount &&
              product.discountedPrice != null ? (

                <div className={styles.discountPriceBox}>

                  <div className={styles.discountOldPriceRow}>

                    <span className={styles.discountOldPrice}>
                      {product.price.toLocaleString("pt-MZ")} MT
                    </span>

                    <span className={styles.discountBadge}>
                      -{product.activeDiscount.discountPercent}%
                    </span>

                  </div>

                  <div className={styles.discountedPrice}>
                    {product.discountedPrice.toLocaleString("pt-MZ")} MT
                  </div>

                </div>

              ) : (

                <div className={styles.normalPrice}>
                  {product.price.toLocaleString("pt-MZ")} MT
                </div>

              )}

            </div>

          )}

        </div>

      </div>

    </div>

  );
}