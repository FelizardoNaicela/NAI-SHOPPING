import { api } from "./api";

// =====================================================
// TIPOS
// =====================================================

export interface ConfirmPromotionPaymentRequest {
  reference: string;
}

export interface ConfirmedPromotionPayment {
  id: string;
  reference: string | null;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  amount: number;
  currency: string;
  provider: string | null;
  paidAt: string | null;
  promotionId: string | null;
}

export interface ConfirmPromotionPaymentResponse {
  message: string;

  alreadyPaid: boolean;

  confirmedBy?: {
    id: string;
    name: string | null;
    email: string;
  };

  payment: ConfirmedPromotionPayment;
}

// =====================================================
// CONFIRMAR PAGAMENTO DE PROMOÇÃO
// =====================================================

export async function confirmPromotionPaymentByReference(
  reference: string,
): Promise<ConfirmPromotionPaymentResponse> {
  const normalizedReference = reference.trim();

  if (!normalizedReference) {
    throw new Error(
      "A referência do pagamento é obrigatória.",
    );
  }

  const response =
    await api.post<ConfirmPromotionPaymentResponse>(
      "/admin/payments/promotions/confirm",
      {
        reference: normalizedReference,
      },
    );

  return response.data;
}