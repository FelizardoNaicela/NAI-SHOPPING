import { api } from "./api";

export type VerificationPaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type VerificationType =
  | "BASIC"
  | "PREMIUM";

export interface ConfirmedVerificationPayment {
  id: string;

  reference: string | null;

  status: VerificationPaymentStatus;

  amount: number;

  currency: string;

  provider: string | null;

  paidAt: string | null;

  type: "VERIFICATION";

  verificationRequestId: string | null;

  storeId: string | null;
}

export interface ConfirmedVerificationRequest {
  id: string;

  storeId: string;

  requestedType: VerificationType;

  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

  requestedById: string;

  reviewedById: string | null;

  rejectionReason: string | null;

  createdAt: string;

  reviewedAt: string | null;
}

export interface ConfirmedVerificationStore {
  id: string;

  name: string;

  ownerId: string;

  verified: boolean;

  verificationType:
    | VerificationType
    | null;

  countryCode: string | null;

  region: string | null;
}

export interface ConfirmVerificationPaymentResponse {
  message: string;

  alreadyPaid: boolean;

  confirmedBy: {
    id: string;

    email: string;

    name: string | null;
  };

  payment: ConfirmedVerificationPayment;

  request: ConfirmedVerificationRequest;

  store: ConfirmedVerificationStore;
}

/**
 * Confirmar manualmente o pagamento
 * de uma verificação através da referência.
 *
 * Apenas o SUPER_ADMIN deve utilizar esta função.
 */
export async function confirmVerificationPaymentByReference(
  reference: string,
): Promise<ConfirmVerificationPaymentResponse> {
  const normalizedReference =
    reference.trim();

  if (!normalizedReference) {
    throw new Error(
      "A referência do pagamento é obrigatória.",
    );
  }

  const response =
    await api.post<ConfirmVerificationPaymentResponse>(
      "/admin/payments/verifications/confirm",
      {
        reference: normalizedReference,
      },
    );

  return response.data;
}