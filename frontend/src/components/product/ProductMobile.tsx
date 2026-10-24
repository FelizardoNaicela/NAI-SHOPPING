import { useNavigate } from "react-router-dom";
import { useState } from "react";

import FavoriteButton from "../FavoriteButton";
import SmartImage from "../SmartImage";

import BidHistory from "../auction/BidHistory";
import BidBox from "../auction/BidBox";
import ProductFullscreen from "../gallery/ProductFullscreen";
import styles from "./ProductMobile.module.css"
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

export default function ProductMobile({

    product,

    images,

    selectedImage,
    selectedIndex,

    onSelectImage,
    onPreviousImage,
    onNextImage,

    isAuction,

    viewers,

onBidPlaced,

isOwner

}: Props) {

    const navigate = useNavigate();

    const soldOut =
    !isAuction &&
    typeof product.stock === "number" &&
    product.stock <= 0;

    const hiddenImages =
        Math.max(images.length - 3, 0);


        const [showDescription, setShowDescription] = useState(false);

const [showHistory, setShowHistory] = useState(false);

const [showBidBox, setShowBidBox] = useState(false);

const [sheetStartY, setSheetStartY] = useState(0);

const [sheetOffset, setSheetOffset] = useState(0);

const [dragX, setDragX] = useState(0);

const [imageStartX, setImageStartX] = useState(0);

const [fullscreen, setFullscreen] = useState(false);

function handleTouchStart(
    e: React.TouchEvent
){

    setImageStartX(
        e.touches[0].clientX
    );

}

function handleTouchMove(
    e: React.TouchEvent
){

    const diff =
        e.touches[0].clientX -
        imageStartX;

    setDragX(diff);

}

function handleTouchEnd(){

    if(dragX < -80){

        onNextImage();

    }

    if(dragX > 80){

        onPreviousImage();

    }

    setDragX(0);

}

    function sheetTouchStart(
    e: React.TouchEvent
) {

    setSheetStartY(
        e.touches[0].clientY
    );

}

function sheetTouchMove(
    e: React.TouchEvent
) {

    const diff =
        e.touches[0].clientY - sheetStartY;

    if (diff > 0)
        setSheetOffset(diff);

}

function sheetTouchEnd(
    close: () => void
) {

    if (sheetOffset > 120) {

        close();

    }

    setSheetOffset(0);

}

    return (

        <div className={styles.container}>

            {/* HEADER */}

            <div className={styles.header}>

                <button
                    onClick={() =>
                        navigate(
                            `/stores/${product.store.id}`
                        )
                    }
                   className={styles.storeButton}>


                    🐾 {product.store.name}

                </button>

                <div className={styles.headerActions}>

                    {isAuction && (

                        <div className={styles.viewers}>

                            👀 {viewers}

                        </div>

                    )}
{isAuction&&(
                    <FavoriteButton
            productId={product.id}
            size={32}
        />
)}
                </div>

            </div>

            {/* DESCRIÇÃO */}
<div className={styles.productHeader}>

    <div className={styles.productInfo}>

        <h3 className={styles.productTitle}>
            {product.name}
        </h3>
        {soldOut && (
    <span className={styles.soldOut}>
        <AlertCircle size={14} />
        Esgotado
    </span>
)}

        <button
            onClick={() =>
                setShowDescription(!showDescription)
            }
            className={styles.detailsButton}
        >
            {showDescription
                ? "▲ Recolher"
                : "▼ Ver detalhes"}
        </button>

    </div>

     <div className={styles.productPrice}>
    {isAuction ? (
        `${product.currentBid ?? product.auctionStartPrice} MT`
    ) : product.activeDiscount &&
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
        `${product.price.toLocaleString("pt-MZ")} MT`
    )}
</div>

</div>

{showDescription && (

    <div className={styles.descriptionBox}>

        {!isAuction && (

           <div className={styles.stock}>

            <strong>Stock:</strong> {product.stock}

        </div>

        )}

        {product.description && (

            <div className={styles.descriptionText}>

            {product.description}

        </div>

        )}

    </div>

)}

{/* IMAGEM PRINCIPAL */}

<div
    className={styles.gallery}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
>

    <div
        className={styles.gallerySlider}
        style={{
            transform: `translateX(calc(-33.333% + ${dragX}px))`,
            transition:
                dragX === 0
                    ? "transform .25s ease"
                    : "none",
        }}
    >

        {/* imagem anterior */}

        <div className={styles.gallerySlide}>
            <SmartImage
                src={
                    images[
                        (selectedIndex - 1 + images.length) %
                        images.length
                    ]
                }
                aspectRatio="1 / 1"
                fit="contain"
                enableFullscreen
            />
        </div>

        {/* imagem atual */}

        <div

        onClick={() => setFullscreen(true)}
            className={styles.gallerySlide}
        >
            <SmartImage
                src={selectedImage}
                aspectRatio="1 / 1"
                fit="contain"
                enableFullscreen
            />
        </div>

        {/* próxima imagem */}

        <div
           className={styles.gallerySlide}
        >
            <SmartImage
                src={
                    images[
                        (selectedIndex + 1) %
                        images.length
                    ]
                }
                aspectRatio="1 / 1"
                fit="contain"
                enableFullscreen
            />
        </div>

    </div>

</div>


<div className={styles.galleryDots}>

    {images.map((_, index) => (

        <div
            key={index}
            className={`${styles.dot} ${
                selectedIndex === index
                    ? styles.activeDot
                    : ""
            }`}
        />

    ))}

</div>

            {/* MINIATURAS */}

            <div className={styles.thumbnails}>

                {images
                    .slice(0, 3)
                    .map((img, index) => (

                       <div
    key={index}
    onClick={() => onSelectImage(index)}
    className={`${styles.thumbnail} ${
        selectedIndex === index
            ? styles.thumbnailActive
            : ""
    }`}
>

                            <SmartImage
                                src={img}
                                aspectRatio="1 / 1"
                            />

                            {index === 2 &&
                                hiddenImages > 0 && (

                                   <div className={styles.moreImages}>

                                        +{hiddenImages}

                                    </div>

                                )}

                        </div>

                    ))}

            </div>

            {/* AÇÕES */}


            {isAuction&&(
            <div className={styles.actionButtons}>

                <button
                     onClick={() => setShowHistory(true)}
    className={styles.secondaryButton}
                >

                    📜 Histórico

                </button>

                <button
    onClick={() => setShowBidBox(true)}
    className={styles.primaryButton}
                >

                    💰 Licitar

                </button>

            </div>
            )}
{/* SHEET HISTÓRICO */}

{showHistory && (

    <div
    onClick={() => setShowHistory(false)}
    className={styles.sheetOverlay}
>

        <div
    onClick={(e)=>e.stopPropagation()}
    onTouchStart={sheetTouchStart}
    onTouchMove={sheetTouchMove}
    onTouchEnd={() =>
        sheetTouchEnd(() => setShowHistory(false))
    }
    className={styles.sheet}
    style={{
        transform: `translateY(${sheetOffset}px)`,
        transition:
            sheetOffset === 0
                ? "transform .25s ease"
                : "none",
    }}
>

            <div className={styles.sheetHandleWrapper}>
    <div className={styles.sheetHandle} />
</div>

<div className={styles.sheetContent}>

    <h3 className={styles.sheetTitle}>
        Histórico de lances
    </h3>

    <BidHistory
        productId={product.id}
    />

</div>

        </div>

    </div>

)}



{/* SHEET DAR LANCE */}

{showBidBox && (

    <div
    onClick={() => setShowBidBox(false)}
    className={styles.sheetOverlay}
>

        <div
    onClick={(e)=>e.stopPropagation()}
    onTouchStart={sheetTouchStart}
    onTouchMove={sheetTouchMove}
    onTouchEnd={() =>
        sheetTouchEnd(() => setShowBidBox(false))
    }
    className={styles.sheet}
    style={{
        transform: `translateY(${sheetOffset}px)`,
        transition:
            sheetOffset === 0
                ? "transform .25s ease"
                : "none",
    }}
>

            <div className={styles.sheetHandleWrapper}>

    <div className={styles.sheetHandle} />


            </div>

            <div className={styles.sheetContent}>

<h3 className={styles.sheetTitle}>
                    Dar lance
                </h3>

{!product.auctionClosed &&
                            !isOwner && (
                <BidBox
                    product={product}
                    onBidPlaced={(bid) => {

                        onBidPlaced(bid);

                        setShowBidBox(false);

                    }}
                />
                            )}

                            {product.auctionClosed &&

                                <h2 className={styles.closedAuction}>Leilão Encerrado</h2>
                            }

            </div>

        </div>

    </div>

)}

{fullscreen && (

    <ProductFullscreen

        images={images}

        selectedIndex={selectedIndex}

        onSelect={onSelectImage}

        onClose={() => setFullscreen(false)}

    />

)}
        </div>

    );

}