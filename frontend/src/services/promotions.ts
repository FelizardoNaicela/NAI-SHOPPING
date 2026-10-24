import { api } from "./api";

// =========================================================
// TIPOS
// =========================================================

export type PromotionPlacement =
  | "FEED"
  | "SEARCH"
  | "CATEGORY";

// =========================================================
// PAGAMENTO DE PROMOÇÃO
// =========================================================

export type PromotionPaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PromotionPayment = {
  id: string;
  type: "PROMOTION";
  status: PromotionPaymentStatus;
  amount: number;
  currency: string;
  description?: string | null;
  reference?: string | null;
  provider?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;

  metadata?: {
    packageId?: string;
    impressions?: number;
    promotionId?: string;
    storeId?: string;
  } | null;
};

// =========================================================
// CHECKOUT DE PAGAMENTO
// =========================================================

export type PromotionCheckout = {
  provider: string;
  reference: string;
  checkoutUrl?: string | null;
  instructions?: string | null;
  status: "PENDING" | "PAID" | "FAILED";
};

export type CreatePromotionPaymentResponse = {
  alreadyPaid: boolean;
  alreadyPending: boolean;
  payment: PromotionPayment;
  checkout?: PromotionCheckout;
};

// =========================================================
// FEED
// =========================================================

export async function getFeedPromotions(options?: {
  start?: number;
  limit?: number;
  seed?: string;
}) {
  const response = await api.get(
    "/promotions/public/feed",
    {
      params: {
        start: options?.start ?? 0,
        limit: options?.limit ?? 10,
        seed:
          options?.seed ??
          "default",
      },
    },
  );

  return response.data;
}

// =========================================================
// PESQUISA
// =========================================================

export async function getSearchPromotions(
  options?: {
    seed?: string;
  },
) {
  const response = await api.get(
    "/promotions/public/search",
    {
      params: {
        seed:
          options?.seed ??
          "default",
      },
    },
  );

  return response.data;
}

// =========================================================
// CATEGORIA
// =========================================================

export async function getCategoryPromotions(
  options?: {
    seed?: string;
  },
) {
  const response = await api.get(
    "/promotions/public/category",
    {
      params: {
        seed:
          options?.seed ??
          "default",
      },
    },
  );

  return response.data;
}

// =========================================================
// PROMOÇÕES POR LOCAL
// =========================================================

export async function getPromotionsByPlacement(
  placement: PromotionPlacement,
  options?: {
    start?: number;
    limit?: number;
    seed?: string;
  },
) {
  switch (placement) {
    case "FEED":
      return getFeedPromotions(options);

    case "SEARCH":
      return getSearchPromotions({
        seed: options?.seed,
      });

    case "CATEGORY":
      return getCategoryPromotions({
        seed: options?.seed,
      });

    default:
      return [];
  }
}

// =========================================================
// REGISTRAR IMPRESSÃO
// =========================================================

export async function registerPromotionImpression(
  promotionId: string,
) {
  const response = await api.post(
    `/promotions/${promotionId}/impression`,
  );

  return response.data;
}

// =========================================================
// CRIAR CAMPANHA
// =========================================================

export async function createPromotion(data: {
  name: string;
  startsAt: string;
  endsAt: string;
  packageId: string;
  priority?: number;
  placements: PromotionPlacement[];
  productIds: string[];
}) {
  const response = await api.post(
    "/promotions",
    data,
  );

  return response.data;
}

// =========================================================
// MINHAS CAMPANHAS
// =========================================================

export async function getMyPromotions() {
  const response = await api.get(
    "/promotions/mine",
  );

  return response.data;
}

// =========================================================
// BUSCAR UMA CAMPANHA
// =========================================================

export async function getPromotion(
  id: string,
) {
  const response = await api.get(
    `/promotions/${id}`,
  );

  return response.data;
}

// =========================================================
// ATIVAR
// =========================================================

export async function activatePromotion(
  promotionId: string,
) {
  const response = await api.post(
    `/promotions/${promotionId}/activate`,
  );

  return response.data;
}

// =========================================================
// PAUSAR
// =========================================================

export async function pausePromotion(
  promotionId: string,
) {
  const response = await api.post(
    `/promotions/${promotionId}/pause`,
  );

  return response.data;
}

// =========================================================
// CANCELAR
// =========================================================

export async function cancelPromotion(
  promotionId: string,
) {
  const response = await api.post(
    `/promotions/${promotionId}/cancel`,
  );

  return response.data;
}

// =========================================================
// LISTAR PACOTES
// =========================================================

export async function getPromotionPackages() {
  const response = await api.get(
    "/promotions/packages",
  );

  return response.data;
}

// =========================================================
// MUDAR PACOTE
// =========================================================

export async function changePromotionPackage(
  promotionId: string,
  packageId: string,
) {
  const response = await api.post(
    `/promotions/${promotionId}/change-package`,
    {
      packageId,
    },
  );

  return response.data;
}

// =========================================================
// ELIMINAR UMA CAMPANHA DO HISTÓRICO
// =========================================================

export async function deletePromotionHistoryItem(
  promotionId: string,
) {
  const response = await api.delete(
    `/promotions/${promotionId}/history`,
  );

  return response.data;
}

// =========================================================
// ELIMINAR TODO O HISTÓRICO
// =========================================================

export async function deleteAllPromotionHistory() {
  const response = await api.delete(
    "/promotions/history/all",
  );

  return response.data;
}

// =========================================================
// CRIAR PEDIDO DE PAGAMENTO
// =========================================================

export async function createPromotionPayment(
  promotionId: string,
): Promise<CreatePromotionPaymentResponse> {
  const response = await api.post(
    `/promotions/${promotionId}/payment`,
  );

  return response.data as CreatePromotionPaymentResponse;
}

// =========================================================
// CONSULTAR PAGAMENTOS
// =========================================================
//
// O backend retorna:
//
// {
//   promotionId: string,
//   payments: PromotionPayment[]
// }
//
// =========================================================

export async function getPromotionPayment(
  promotionId: string,
): Promise<{
  promotionId: string;
  payments: PromotionPayment[];
}> {
  const response = await api.get(
    `/promotions/${promotionId}/payment`,
  );

  return response.data as {
    promotionId: string;
    payments: PromotionPayment[];
  };
}
