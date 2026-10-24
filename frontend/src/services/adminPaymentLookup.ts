import { api } from "./api";

export interface PaymentLookup {
  id: string;
  type: "VERIFICATION" | "PROMOTION" | "NATIONAL_RANKING" | "OTHER";
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  amount: number;
  currency: string;
  provider: string | null;
  reference: string | null;
  description: string | null;
  createdAt: string;
  paidAt: string | null;

  store: {
    id: string;
    name: string;
    verified?: boolean;
    verificationType?: "BASIC" | "PREMIUM" | null;
  } | null;

  payer: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;

  verification: {
    requestedType: "BASIC" | "PREMIUM";
    requestStatus: string;
  } | null;

  promotion: {
    id: string;
    name: string;
  } | null;
}

/**
 * Consulta (sem alterar nada) o que está associado a uma referência.
 */
export async function lookupPaymentByReference(
  reference: string,
): Promise<PaymentLookup> {
  const response = await api.get<PaymentLookup>("/admin/payments/lookup", {
    params: { reference },
  });

  return response.data;
}