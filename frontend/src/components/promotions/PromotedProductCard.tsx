import { useNavigate } from "react-router-dom";
import SmartImage from "../SmartImage";
import styles from "./PromotedProductCard.module.css";
import VerificationBadge from "../VerificationBadge";

type PromotedProduct = {
  id: string;
  name: string;
  type?: "NORMAL" | "AUCTION";
  price: number;
  imageUrl?: string | null;
  currentBid?: number;
  auctionStartPrice?: number;
  auctionEndsAt?: string;
  auctionClosed?: boolean;
};

type PromotedProductCardProps = {
  product: PromotedProduct;
  store?: {
  id: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  verificationType?: string | null;
};
};

export default function PromotedProductCard({
  product,
  store,
}: PromotedProductCardProps) {
  const navigate = useNavigate();

  function openProduct() {
    navigate(`/product/${product.id}`);
  }

  const price =
    product.type === "AUCTION"
      ? product.currentBid ?? product.auctionStartPrice
      : product.price;

  return (
    <article
      className={styles.card}
      onClick={openProduct}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          openProduct();
        }
      }}
    >
      {/* IMAGEM */}

      <div className={styles.imageContainer}>
        <SmartImage
          src={product.imageUrl}
          aspectRatio="1 / 1"
          fit="cover"
        />

        <div className={styles.promotedBadge}>
          🔥 Promovido
        </div>
      </div>

      {/* CONTEÚDO */}

      <div className={styles.content}>
        <h3 className={styles.productName}>
          {product.name}
        </h3>

        {store && (
          <div className={styles.store}>
            <div
  className={styles.storeAvatar}
  style={{
    overflow: "hidden",
    background: "var(--background)",
  }}
>
  <SmartImage
    src={
      store.avatarUrl ??
      undefined
    }
    aspectRatio="1 / 1"
    fit="cover"
  />
</div>

           <span className={styles.storeName}>
  {store.name}
  <VerificationBadge
    type={store.verificationType}
    verified={store.verified}
    size="sm"
  />
</span>
          </div>
        )}

        {price !== undefined && (
          <div className={styles.price}>
            {price} MT
          </div>
        )}

        {product.type === "AUCTION" && (
          <div
            className={
              product.auctionClosed
                ? styles.auctionClosed
                : styles.auction
            }
          >
            {product.auctionClosed
              ? "ENCERRADO"
              : "LEILÃO"}
          </div>
        )}
      </div>
    </article>
  );
}