import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getProduct } from "../services/products";
import { getSocket } from "../socket/socket";
import { useAuth } from "../auth/AuthProvider";

import ProductDesktop from "../components/product/ProductDesktop";
import ProductMobile from "../components/product/ProductMobile";
import useIsMobile from "../hooks/useIsMobile";


type ProductImage = {
  id: string;
  url: string;
};

type Product = {
  id: string;
  type: "NORMAL" | "AUCTION";

  name: string;
  description?: string;

  price: number;

  activeDiscount?: {
    id: string;
    discountPercent: number;
    startsAt: string;
    endsAt: string;
  } | null;

  discountedPrice?: number | null;

  imageUrl?: string;
  images?: ProductImage[];

  stock?: number;

  auctionStartPrice?: number;
  currentBid?: number;
  minimumIncrement?: number;
  reservePrice?: number;

  auctionStartsAt?: string;
  auctionEndsAt?: string;

  auctionClosed?: boolean;

  store: {
    id: string;
    name: string;
    ownerId: string;
  };
};

export default function ProductPage() {

  const { id } = useParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [selectedIndex, setSelectedIndex] =
    useState(0);

    const [highlightBid, setHighlightBid] =
    useState(false);

    const [viewers, setViewers] =
    useState(1);

    const { user } = useAuth();

    const isOwner =
    !!user &&
    product?.store.ownerId === user.id;

    const isMobile = useIsMobile();

  useEffect(() => {

    if (!id) return;

    getProduct(id)
      .then((p) => {

        setProduct(p);

        if (p.images?.length) {

          setSelectedImage(p.images[0].url);
          setSelectedIndex(0);

        } else if (p.imageUrl) {

          setSelectedImage(p.imageUrl);
          setSelectedIndex(0);

        }

      })
      .finally(() => setLoading(false));

  }, [id]);

  useEffect(() => {

    if (!product?.id) return;

    const socket = getSocket();

    if (!socket) return;

    socket.emit("auction:join", product.id);

    return () => {
        socket.emit("auction:leave", product.id);
    };

}, [product?.id]);

useEffect(() => {

    if (!product) return;

    const socket = getSocket();

    if (!socket) return;

    function handleNewBid(data: any) {

    if (data.productId !== product!.id)
        return;

    setProduct(prev => {

        if (!prev) return prev;

        return {

            ...prev,

            currentBid: data.currentBid,

        };

    });

    setHighlightBid(true);

setTimeout(() => {

    setHighlightBid(false);

}, 700);

    if (!user)
        return;

    // fui eu que licitei
    if (data.winnerId === user.id)
        return;

    // aqui entram apenas os restantes utilizadores
    // (mais tarde podemos mostrar toast ou animação)
}

    socket.on(
        "auction:newBid",
        handleNewBid,
    );

    function handleExtended(data:any){

    if(data.productId!==product!.id)
        return;

    setProduct(prev=>{

        if(!prev) return prev;

        return{

            ...prev,

            auctionEndsAt:data.newEndDate,

        };

    });

}

socket.on(
    "auction:extended",
    handleExtended,
);

function handleClosed(data:any){

    if(data.productId!==product!.id)
        return;

    setProduct(prev=>{

        if(!prev) return prev;

        return{

            ...prev,

            auctionClosed:true,

        };

    });

}

socket.on(
    "auction:closed",
    handleClosed,
);

function handleViewers(data:any){

    if(data.productId!==product!.id)
        return;

    setViewers(data.viewers);

}

socket.on(
    "auction:viewers",
    handleViewers,
);

    return () => {

        socket.off(
            "auction:newBid",
            handleNewBid,
        );

        socket.off(
    "auction:extended",
    handleExtended,
);

socket.off(
    "auction:closed",
    handleClosed,
);

socket.off(
    "auction:viewers",
    handleViewers,
);

    };

}, [product]);

  if (loading || !product)
    return <p style={{ padding: 24 }}>Carregando...</p>;

  const isAuction = product.type === "AUCTION";

  const images =
    product.images?.length
      ? product.images.map(i => i.url)
      : product.imageUrl
      ? [product.imageUrl]
      : [];

  function nextImage() {

    if (!images.length) return;

    const next =
      (selectedIndex + 1) % images.length;

    setSelectedIndex(next);
    setSelectedImage(images[next]);

  }

  function previousImage() {

    if (!images.length) return;

    const prev =
      (selectedIndex - 1 + images.length) %
      images.length;

    setSelectedIndex(prev);
    setSelectedImage(images[prev]);

  }

return (

    <div
        style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: 24,
        }}
    >

        {isMobile ? (

            <ProductMobile
                product={product}
                images={images}
                selectedImage={selectedImage}
                selectedIndex={selectedIndex}
                onSelectImage={(i) => {
                    setSelectedIndex(i);
                    setSelectedImage(images[i]);
                }}
                onPreviousImage={previousImage}
                onNextImage={nextImage}
                isAuction={isAuction}
                isOwner={isOwner}
                viewers={viewers}
                highlightBid={highlightBid}
                onBidPlaced={(bid) =>
                    setProduct({
                        ...product,
                        currentBid: bid,
                    })
                }
            />

        ) : (

            <ProductDesktop
                product={product}
                images={images}
                selectedImage={selectedImage}
                selectedIndex={selectedIndex}
                onSelectImage={(i) => {
                    setSelectedIndex(i);
                    setSelectedImage(images[i]);
                }}
                onPreviousImage={previousImage}
                onNextImage={nextImage}
                isAuction={isAuction}
                isOwner={isOwner}
                viewers={viewers}
                highlightBid={highlightBid}
                onBidPlaced={(bid) =>
                    setProduct({
                        ...product,
                        currentBid: bid,
                    })
                }
            />

        )}

    </div>

);

}