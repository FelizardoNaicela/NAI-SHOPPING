import { useNavigate } from "react-router-dom";

import FavoriteButton from "../FavoriteButton";

import ProductGallery from "./ProductGallery";

import AuctionCountdown from "../auction/AuctionCountdown";
import AuctionInfoCard from "../auction/AuctionInfoCard";
import BidBox from "../auction/BidBox";
import BidHistory from "../auction/BidHistory";
import { AlertCircle } from "lucide-react";

type Product = any;

type Props = {
    product: Product;

    images: string[];

    selectedImage: string | null;
    selectedIndex: number;

    onSelectImage: (index: number) => void;
    onPreviousImage: () => void;
    onNextImage: () => void;

    isAuction: boolean;
    isOwner: boolean;

    viewers: number;

    highlightBid: boolean;

    onBidPlaced: (bid: number) => void;
};

export default function ProductDesktop({

    product,

    images,

    selectedImage,
    selectedIndex,

    onSelectImage,
    onPreviousImage,
    onNextImage,

    isAuction,
    isOwner,

    viewers,

    highlightBid,

    onBidPlaced,

}: Props) {

    const navigate = useNavigate();

    const soldOut =
  !isAuction &&
  typeof product.stock === "number" &&
  product.stock <= 0;

    return (

        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 40,
                alignItems: "start",
            }}
        >

            {/* GALERIA */}

            <ProductGallery
                images={images}
                selectedImage={selectedImage}
                selectedIndex={selectedIndex}
                onSelect={onSelectImage}
                onPrevious={onPreviousImage}
                onNext={onNextImage}
            />

            {/* INFO */}

            <div>

                <div
                    onClick={() =>
                        navigate(`/stores/${product.store.id}`)
                    }
                    style={{
                        cursor: "pointer",
                        marginBottom: 10,
                        color: "#666",
                    }}
                >
                    Vendido por <strong>{product.store.name}</strong>
                </div>

                <h1
                    style={{
                        marginBottom: 20,
                    }}
                >
                    {product.name}
                </h1>

                {isAuction && (

                    <>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 15,
                            }}
                        >

                            <div>

                                👀 {viewers} pessoas acompanhando

                            </div>

                            <FavoriteButton
                                productId={product.id}
                                size={34}
                            />

                        </div>

                        <AuctionCountdown
                            endDate={product.auctionEndsAt}
                        />

                        {product.auctionClosed && (

                            <div
                                style={{
                                    marginTop: 15,
                                    padding: 15,
                                    borderRadius: 10,
                                    background: "silver",
                                }}
                            >
                                🏆 Este leilão terminou.
                            </div>

                        )}

                        <AuctionInfoCard
                            product={product}
                            highlight={highlightBid}
                        />

                        {!product.auctionClosed &&
                            !isOwner && (

                                <BidBox
                                    product={product}
                                    onBidPlaced={onBidPlaced}
                                />

                            )}

                        <BidHistory
                            productId={product.id}
                        />

                    </>

                )}

                {!isAuction && (
    <>
        {product.activeDiscount &&
        product.discountedPrice != null ? (
            <div
                style={{
                    marginBottom: 10,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <span
                        style={{
                            fontSize: 18,
                            color: "#888",
                            textDecoration: "line-through",
                        }}
                    >
                        {product.price.toLocaleString("pt-MZ")} MT
                    </span>

                    <span
                        style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#fff",
                            background: "#34d32f",
                            padding: "4px 8px",
                            borderRadius: 6,
                        }}
                    >
                        -{product.activeDiscount.discountPercent}%
                    </span>
                </div>

                <div
                    style={{
                        fontSize: 34,
                        fontWeight: 700,
                        marginTop: 4,
                    }}
                >
                    {product.discountedPrice.toLocaleString("pt-MZ")} MT
                </div>
            </div>
        ) : (
            <div
                style={{
                    fontSize: 34,
                    fontWeight: 700,
                }}
            >
                {product.price.toLocaleString("pt-MZ")} MT
            </div>
        )}

        {soldOut ? (
    <div
        style={{
            marginTop: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(229,72,77,.35)",
            background: "rgba(229,72,77,.1)",
            color: "#e5484d",
            fontWeight: 700,
        }}
    >
        <AlertCircle size={18} />
        Produto esgotado
    </div>
) : (
    <div style={{ marginTop: 10, color: "#666" }}>
        Stock: {product.stock}
    </div>
)}
    </>
)}

                {product.description && (

                    <div
                        style={{
                            marginTop: 40,
                            borderTop: "1px solid #eee",
                            paddingTop: 20,
                        }}
                    >

                        <h3>Descrição</h3>

                        <p>

                            {product.description}

                        </p>

                    </div>

                )}

            </div>

        </div>

    );

}