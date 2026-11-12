import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  viewers?: number;
};

export type FeedPromotion = {
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

type BackendPromotionSlot = {
  position: number;
  promotion: FeedPromotion;
};

type BackendFeedPromotionsResponse = {
  start: number;
  limit: number;
  positions: number[];
  promotions: BackendPromotionSlot[];
};

type PromotionFeedSlotsProps<T> = {
  items: T[];

  renderItem: (
    item: T,
    index: number,
  ) => ReactNode;

    country?: string;
  region?: string;

  /**
   * Seed do feed.
   *
   * O mesmo seed mantém a mesma
   * distribuição durante o scroll.
   *
   * Um novo seed pode ser usado no refresh
   * para gerar uma nova rotação.
   */
  seed?: string;

  /**
   * Espaçamento vertical entre itens.
   */
  gap?: number | string;
};

export default function PromotionFeedSlots<T>({
  items,
  renderItem,
  seed = "default",
  gap = 24,
  country,
  region,
}: PromotionFeedSlotsProps<T>) {
  const [promotionSlots, setPromotionSlots] =
    useState<
      Map<number, FeedPromotion>
    >(new Map());

  const [loadingPromotions, setLoadingPromotions] =
    useState(false);

  const loadedUntilRef =
    useRef(0);

  /**
   * Evita fazer várias requisições
   * simultaneamente.
   */
    const requestVersionRef = useRef(0);

  const loadingVersionRef = useRef<number | null>(null);

  /**
   * Quantidade aproximada de posições
   * do feed que precisamos consultar.
   *
   * Como existem promoções no meio do feed,
   * acrescentamos algumas posições extras.
   */
  const requiredFeedPositions =
    useMemo(() => {
      return (
        items.length + 20
      );
    }, [items.length]);

  /**
   * ---------------------------------------------------------
   * CARREGAR PROMOÇÕES
   * ---------------------------------------------------------
   */
   async function loadPromotions(
    version = requestVersionRef.current,
  ) {
    if (version !== requestVersionRef.current) {
      return;
    }

    if (loadingVersionRef.current === version) {
      return;
    }

    if (
      loadedUntilRef.current >= requiredFeedPositions
    ) {
      return;
    }

    loadingVersionRef.current = version;
    setLoadingPromotions(true);

    try {
      const start = loadedUntilRef.current;

      const limit = Math.max(
        20,
        requiredFeedPositions - start,
      );

      const response =
        (await getFeedPromotions({
          start,
          limit,
          seed,
          country,
          region,
        })) as BackendFeedPromotionsResponse;

      // Ignorar respostas de pedidos antigos.
      if (version !== requestVersionRef.current) {
        return;
      }

      if (
        response &&
        Array.isArray(response.promotions)
      ) {
        setPromotionSlots(previous => {
          const next = new Map(previous);

          for (const slot of response.promotions) {
            if (!slot || !slot.promotion) {
              continue;
            }

            next.set(
              slot.position,
              slot.promotion,
            );
          }

          return next;
        });
      }

      loadedUntilRef.current = Math.max(
        loadedUntilRef.current,
        start + limit,
      );

    } catch (error) {

    } finally {
      // Só o pedido mais recente pode alterar
      // o estado de carregamento.
      if (loadingVersionRef.current === version) {
        loadingVersionRef.current = null;
        setLoadingPromotions(false);
      }
    }
  }

  /**
   * ---------------------------------------------------------
   * PRIMEIRO CARREGAMENTO
   * ---------------------------------------------------------
   */
   useEffect(() => {
    const version = ++requestVersionRef.current;

    loadedUntilRef.current = 0;
    loadingVersionRef.current = null;

    setPromotionSlots(new Map());

    loadPromotions(version);

  }, [seed, country, region]);

  /**
   * ---------------------------------------------------------
   * CARREGAR MAIS QUANDO O FEED CRESCER
   * ---------------------------------------------------------
   */
  useEffect(() => {
    loadPromotions();
  }, [
    requiredFeedPositions,
  ]);

  /**
   * ---------------------------------------------------------
   * MONTAR FEED
   * ---------------------------------------------------------
   *
   * A posição é controlada pelo backend.
   *
   * Exemplo:
   *
   * posição 1  -> promoção
   * posição 2  -> post
   * posição 3  -> post
   * posição 4  -> post
   * posição 5  -> promoção
   * posição 6  -> post
   * ...
   *
   * posição 10 -> promoção
   *
   * Não fazemos shuffle aqui.
   */
  const feedElements =
    useMemo(() => {
      const result: ReactNode[] = [];

      let itemIndex = 0;

      /**
       * Número máximo de posições
       * que conseguimos montar agora.
       */
      const totalPositions =
        items.length +
        promotionSlots.size;

      for (
        let position = 1;
        position <= totalPositions;
        position++
      ) {
        /**
         * Existe promoção nesta posição?
         */
        const promotion =
          promotionSlots.get(
            position,
          );

        if (promotion) {
          result.push(
            <PromotionCarousel
              key={`promotion-${promotion.id}-${position}`}
              promotion={promotion}
              onImpression={
                registerPromotionImpression
              }
            />,
          );

          continue;
        }

        /**
         * Caso contrário,
         * renderizamos uma publicação normal.
         */
        const item =
          items[itemIndex];

        if (!item) {
          break;
        }

        result.push(
          <div
            key={`feed-item-${itemIndex}`}
          >
            {renderItem(
              item,
              itemIndex,
            )}
          </div>,
        );

        itemIndex++;
      }

      return result;
    }, [
      items,
      promotionSlots,
      renderItem,
    ]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
      }}
    >
      {feedElements}

      {loadingPromotions && (
        <div
          style={{
            padding: 12,
            textAlign: "center",
            color:
              "var(--text-soft)",
            fontSize: 13,
          }}
        >
          Carregando promoções...
        </div>
      )}
    </div>
  );
}