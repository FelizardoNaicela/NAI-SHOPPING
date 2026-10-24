
import { api } from "./api";

export interface LegalInvestigationScope {
  userId?: string;
  storeId?: string;
  conversationId?: string;
  messageId?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export interface StartLegalInvestigationInput {
  legalReference: string;
  reason: string;
  scope: LegalInvestigationScope;
}

export interface LegalInvestigationResult {
  id: string;
  status: string;
  createdAt: string;
  preservedEvidenceCount?: number;
}

export interface LegalInvestigation {
  id: string;
  legalReference: string;
  reason: string;
  status: string;
  resultCount: number;
  errorMessage: string | null;
  createdAt: string;
}


export interface LegalMessageSearchInput {
  investigationId: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  limit?: number;
  cursor?: string;
}


export interface LegalMessageSearchResult {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  content: string | null;
  messageType: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  documentName: string | null;
  receiverId: string | null;
  latitude: number | null;
  longitude: number | null;
  replyToId: string | null;
  sharedMessageId: string | null;
  sharedProductId: string | null;
  sharedPostId: string | null;
}

export interface LegalMessageSearchResponse {
  messages: LegalMessageSearchResult[];
  hasMore: boolean;
  nextCursor: string | null;
  resultCount: number;
}

export async function startLegalInvestigation(
  input: StartLegalInvestigationInput,
): Promise<LegalInvestigationResult> {
  const response = await api.post(
    "/legal-investigation/start",
    input,
  );

  return response.data;
}

export async function listLegalInvestigations(): Promise<
  LegalInvestigation[]
> {
  const response = await api.get("/legal-investigation");
  return response.data;
}

export async function searchLegalMessages(
  input: LegalMessageSearchInput,
): Promise<LegalMessageSearchResponse> {
  const response = await api.post(
    "/legal-investigation/messages/search",
    input,
  );

  return response.data;
}


export interface LegalEvidence {
  id: string;
  messageId: string;
  investigationId: string;
  holdId: string;
  conversationId: string;
  senderId: string;
  receiverId: string | null;
  messageType: string;
  documentName: string | null;
  evidenceHash: string;
  capturedAt: string;
  originalDeletedAt: string | null;
  hasContent: boolean;
  hasAudio: boolean;
  hasImage: boolean;
  hasVideo: boolean;
  hasThumbnail: boolean;
  hasDocument: boolean;
}

export interface LegalEvidenceDetails extends LegalEvidence {
  integrityVerified: boolean;
  snapshot: unknown;
  media: {
    hasContent?: boolean;
    hasAudio?: boolean;
    hasImage?: boolean;
    hasVideo?: boolean;
    hasThumbnail?: boolean;
    hasDocument?: boolean;
  };
}

export type LegalMediaType =
  | "audio"
  | "image"
  | "video"
  | "thumbnail"
  | "document";

export async function listLegalEvidence(
  investigationId: string,
): Promise<LegalEvidence[]> {
  const response = await api.get(
    `/legal-investigation/${encodeURIComponent(investigationId)}/evidence`,
  );

  return response.data;
}

export async function listLegalEvidenceForMessages(
  investigationId: string,
  messageIds: string[],
): Promise<LegalEvidence[]> {
  if (messageIds.length === 0) {
    return [];
  }

  const response = await api.post(
    `/legal-investigation/${encodeURIComponent(investigationId)}/evidence/by-messages`,
    { messageIds },
  );

  return response.data;
}
export async function getLegalEvidence(
  investigationId: string,
  evidenceId: string,
): Promise<LegalEvidenceDetails> {
  const response = await api.get(
    `/legal-investigation/${encodeURIComponent(investigationId)}/evidence/${encodeURIComponent(evidenceId)}`,
  );

  return response.data;
}

export async function getLegalEvidenceMedia(
  investigationId: string,
  evidenceId: string,
  mediaType: LegalMediaType,
): Promise<Blob> {
  const response = await api.get(
    `/legal-investigation/${encodeURIComponent(investigationId)}/evidence/${encodeURIComponent(evidenceId)}/media/${mediaType}`,
    {
      responseType: "blob",
    },
  );

  return response.data;
}


export async function completeLegalInvestigation(
  investigationId: string,
  resultCount: number,
) {
  const response = await api.post("/legal-investigation/complete", {
    investigationId,
    resultCount,
  });

  return response.data as { id: string; status: string; createdAt: string };
}

export async function failLegalInvestigation(
  investigationId: string,
  errorMessage: string,
) {
  const response = await api.post("/legal-investigation/fail", {
    investigationId,
    errorMessage,
  });

  return response.data as { id: string; status: string; createdAt: string };
}