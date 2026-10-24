import { api } from "./api";

export type VerificationType =
  | "BASIC"
  | "PREMIUM";

export type VerificationRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface VerificationRequest {
  id: string;
  storeId: string;

  requestedType: VerificationType;

  status: VerificationRequestStatus;

  requestedById?: string;

  rejectionReason?: string | null;

  createdAt: string;

  reviewedAt?: string | null;

  reviewedBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export interface RequestVerificationResponse
  extends VerificationRequest {}

export interface VerificationStatusResponse {
  id: string;
  storeId: string;
  requestedType: VerificationType;
  status: VerificationRequestStatus;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

/**
 * Solicitar uma verificação para uma banca.
 */
export async function requestVerification(
  storeId: string,
  requestedType: VerificationType,
): Promise<RequestVerificationResponse> {
  const response =
    await api.post<RequestVerificationResponse>(
      "/verification/request",
      {
        storeId,
        requestedType,
      },
    );

  return response.data;
}

/**
 * Listar as solicitações de verificação
 * do utilizador, opcionalmente filtradas
 * por banca.
 */
export async function listMyVerificationRequests(
  storeId?: string,
): Promise<VerificationRequest[]> {
  const response =
    await api.get<VerificationRequest[] | {
      items?: VerificationRequest[];
    }>("/verification/my", {
      params: storeId
        ? { storeId }
        : undefined,
    });

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.items ?? [];
}

/**
 * Cancelar uma solicitação PENDING.
 */
export async function cancelVerificationRequest(
  requestId: string,
) {
  const response =
    await api.patch(
      `/verification/requests/${requestId}/cancel`,
    );

  return response.data;
}

/**
 * Consultar o estado de uma solicitação.
 */
export async function getVerificationStatus(
  requestId: string,
): Promise<VerificationStatusResponse> {
  const response =
    await api.get<VerificationStatusResponse>(
      `/verification/${requestId}/status`,
    );

  return response.data;
}