import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PromotedProductCard from "./promotions/PromotedProductCard";

import {
  getPromotionsByPlacement,
  registerPromotionImpression,
  type PromotionPlacement,
} from "../services/promotions";

type MarketplaceProduct = {
  id: string;
  name: string;
  type?: "NORMAL" | "AUCTION";
  price: number;
  imageUrl?: string | null;
  stock: number;

  currentBid?: number;
  auctionStartPrice?: number;
  auctionEndsAt?: string;
  auctionClosed?: boolean;

  store?: {
    id: string;
    name: string;
    ownerId: string;
    avatarUrl?: string | null;
    verified?: boolean;
    verificationType?: "BASIC" | "PREMIUM" | null;
  };

  storeName?: string;

  discountedPrice?: number | null;

  activeDiscount?: {
    id: string;
    name?: string | null;
    discountPercent: number;
    startsAt?: string;
    endsAt?: string;
  } | null;
};

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

  store?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    verified?: boolean;
    verificationType?: "BASIC" | "PREMIUM" | null;
  };
};

type Promotion = {
  id: string;

  store?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    verified?: boolean;
    verificationType?: "BASIC" | "PREMIUM" | null;
  };

  products?: {
    product?: PromotionProduct | null;
    order?: number;
  }[];
};

type PromotedMarketplaceSlotsProps = {
  items: MarketplaceProduct[];

  /*
   * Produto PREMIUM reservado para o
   * primeiro card da pesquisa.
   *
   * IMPORTANTE:
   * não faz parte de items.
   */
  premiumProduct?: MarketplaceProduct | null;

  placement: Extract<
    PromotionPlacement,
    "SEARCH" | "CATEGORY"
  >;

  renderItem: (
    product: MarketplaceProduct,
  ) => React.ReactNode;

  loading?: boolean;
};

/*
 * Slots reservados para publicidade.
 *
 * Importante:
 *
 * Estes números representam a posição
 * dos PRODUTOS NORMAIS.
 *
 * O produto PREMIUM não entra nesta contagem.
 *
 * Exemplo com PREMIUM:
 *
 * PREMIUM
 * produto 1
 * promoção
 *
 * produto 2
 * produto 3
 * produto 4
 * produto 5
 * promoção
 *
 * produto 6...
 *
 * Sem PREMIUM:
 *
 * produto 1
 * promoção
 *
 * produto 2
 * produto 3
 * ...
 */
const SEARCH_CATEGORY_PROMOTION_POSITIONS = [
  1,
  5,
  10,
  15,
  20,
  25,
];

function getPromotionProducts(
  promotion: Promotion,
): PromotionProduct[] {
  return (
    promotion.products
      ?.map(item => item.product)
      .filter(
        (
          product,
        ): product is PromotionProduct =>
          !!product,
      ) ?? []
  );
}

function createPromotionSeed() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default function PromotedMarketplaceSlots({
  items,
  premiumProduct = null,
  placement,
  renderItem,
  loading = false,
}: PromotedMarketplaceSlotsProps) {
  const [
    promotions,
    setPromotions,
  ] = useState<Promotion[]>([]);

  const loadedPlacement =
    useRef<string | null>(null);

  const registeredImpressions =
    useRef(
      new Set<string>(),
    );

  const promotionSeed = useRef(
    createPromotionSeed(),
  );

  /*
   * ---------------------------------------------------------
   * CARREGAR PROMOÇÕES
   * ---------------------------------------------------------
   *
   * A campanha continua completamente
   * independente da pesquisa/categoria.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadPromotions() {
      try {
        const result =
          await getPromotionsByPlacement(
            placement,
            {
              seed: promotionSeed.current,
            },
          );

        if (cancelled) {
          return;
        }

        setPromotions(
          Array.isArray(result)
            ? result
            : [],
        );

        loadedPlacement.current =
          placement;
      } catch {
        if (cancelled) {
          return;
        }

        setPromotions([]);
      }
    }

    /*
     * Só recarrega quando muda
     * o tipo de espaço publicitário.
     */
    if (
      loadedPlacement.current !==
      placement
    ) {
      loadPromotions();
    }

    return () => {
      cancelled = true;
    };
  }, [placement]);

  /*
   * ---------------------------------------------------------
   * POSIÇÕES RESERVADAS
   * ---------------------------------------------------------
   *
   * Continuam contando SOMENTE os produtos
   * normais.
   */
  const positions = useMemo(
    () =>
      SEARCH_CATEGORY_PROMOTION_POSITIONS.filter(
        position =>
          position <= items.length,
      ),
    [items.length],
  );

  /*
   * ---------------------------------------------------------
   * PROMOÇÕES DISPONÍVEIS
   * ---------------------------------------------------------
   */
  const promotionEntries =
    useMemo(() => {
      if (!promotions.length) {
        return [];
      }

      return promotions.flatMap(
        promotion => {
          const products =
            getPromotionProducts(
              promotion,
            );

          return products.map(
            product => ({
              promotion,
              product,
            }),
          );
        },
      );
    }, [promotions]);

  /*
   * ---------------------------------------------------------
   * REGISTRAR IMPRESSÃO
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (
      loading ||
      !promotionEntries.length ||
      !positions.length
    ) {
      return;
    }

    const visibleCount =
      Math.min(
        positions.length,
        promotionEntries.length,
      );

    for (
      let index = 0;
      index < visibleCount;
      index++
    ) {
      const promotion =
        promotionEntries[index]
          .promotion;

      if (
        registeredImpressions.current.has(
          promotion.id,
        )
      ) {
        continue;
      }

      registeredImpressions.current.add(
        promotion.id,
      );

      registerPromotionImpression(
        promotion.id,
      ).catch(() => {
        /*
         * A falha no contador
         * não pode quebrar o feed.
         */
      });
    }
  }, [
    loading,
    positions.length,
    promotionEntries,
  ]);

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  /*
   * Se não existe Premium e também
   * não existem produtos normais,
   * não há nada para renderizar.
   */
  if (
    !items.length &&
    !premiumProduct
  ) {
    return null;
  }

  const result: React.ReactNode[] = [];

  /*
   * ---------------------------------------------------------
   * PREMIUM
   * ---------------------------------------------------------
   *
   * Somente SEARCH.
   *
   * O Premium fica ANTES de todos os
   * produtos normais.
   *
   * Não entra na contagem dos slots
   * publicitários.
   */
  if (
  (placement === "SEARCH" ||
    placement === "CATEGORY") &&
  premiumProduct
) {
    result.push(
      <div
        key={`premium-${premiumProduct.id}`}
        data-premium-product="true"
      >
        {renderItem(premiumProduct)}
      </div>,
    );
  }

  /*
   * ---------------------------------------------------------
   * PRODUTOS NORMAIS + PUBLICIDADE
   * ---------------------------------------------------------
   */
  items.forEach(
    (item, index) => {
      const productPosition =
        index + 1;

      /*
       * Primeiro colocamos
       * o produto normal.
       */
      result.push(
        <div
          key={`product-${item.id}`}
        >
          {renderItem(item)}
        </div>,
      );

      /*
       * Depois verificamos se
       * existe um slot publicitário
       * depois deste produto.
       */
      const promotionSlotIndex =
        positions.indexOf(
          productPosition,
        );

      if (
        promotionSlotIndex === -1
      ) {
        return;
      }

      const entry =
        promotionEntries[
          promotionSlotIndex
        ];

      if (!entry?.product) {
        return;
      }

      const product =
        entry.product;

      result.push(
        <div
          key={`promotion-${entry.promotion.id}-${product.id}-${promotionSlotIndex}`}
          data-promotion-placement={
            placement
          }
        >
          <PromotedProductCard
            product={{
              id: product.id,
              name: product.name,
              type: product.type,
              price: product.price,
              imageUrl:
                product.imageUrl,
              currentBid:
                product.currentBid,
              auctionStartPrice:
                product.auctionStartPrice,
              auctionEndsAt:
                product.auctionEndsAt,
              auctionClosed:
                product.auctionClosed,
            }}
            store={
              product.store ??
              entry.promotion.store
            }
          />
        </div>,
      );
    },
  );

  return <>{result}</>;
}