import { useEffect, useState } from "react";
import {
  getFeedPromotions,
  registerPromotionImpression,
} from "../services/promotions";
import PromotionCarousel from "./promotions/PromotionCarousel";

type PromotionProduct = {
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

type Promotion = {
  id: string;
  name: string;
  priority?: number;

  store?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    verified?: boolean;
  };

  products: {
    order: number;
    product: PromotionProduct;
  }[];
};

export default function FeedPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPromotions() {
      try {
        const data = await getFeedPromotions();

        if (cancelled) return;

        setPromotions(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
      }
    }

    loadPromotions();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!promotions.length) {
    return null;
  }

  return (
    <>
      {promotions.map((promotion) => (
        <PromotionCarousel
          key={promotion.id}
          promotion={promotion}
          onImpression={registerPromotionImpression}
        />
      ))}
    </>
  );
}