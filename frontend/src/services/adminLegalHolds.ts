import { api } from "./api";

export type LegalHoldStatus = "ACTIVE" | "RELEASED";

export interface LegalHoldItem {
  id: string;
  status: LegalHoldStatus;
  createdAt: string;
  releasedAt: string | null;
  releaseReason: string | null;
  releasedBy: { name: string | null; email: string } | null;

  scope: {
    userId: string | null;
    storeId: string | null;
    conversationId: string | null;
    messageId: string | null;
    fromDate: string | null;
    toDate: string | null;
  };

  evidenceCount: number;

  investigation: {
    id: string;
    legalReference: string;
    reason: string;
    status: string;
    requestedBy: { name: string | null; email: string };
  };
}

export async function listLegalHolds(
  status?: LegalHoldStatus,
  q?: string,
) {
  const res = await api.get<LegalHoldItem[]>("/legal-hold-admin", {
    params: {
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
    },
  });

  return res.data;
}

export async function releaseLegalHold(holdId: string, reason: string) {
  const res = await api.post(
    `/legal-hold-admin/${encodeURIComponent(holdId)}/release`,
    { reason },
  );

  return res.data;
}