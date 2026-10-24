import {
  LegalInvestigationQueryStatus,
  LegalInvestigationStatus,
  MessageType,
} from '@prisma/client';

export interface LegalInvestigationScope {
  userId?: string;
  storeId?: string;
  conversationId?: string;
  messageId?: string;

  fromDate?: Date | string;
toDate?: Date | string;

  searchTerm?: string;
}

export interface StartLegalInvestigationInput {
  legalReference: string;
  reason: string;
  scope: LegalInvestigationScope;
}

export interface CompleteLegalInvestigationRequest {
  investigationId: string;
  resultCount: number;
}

export interface FailLegalInvestigationRequest {
  investigationId: string;
  errorMessage: string;
}

export interface CompleteLegalInvestigationInput {
  investigationId: string;
  resultCount: number;
}

export interface FailLegalInvestigationInput {
  investigationId: string;
  errorMessage: string;
}

export interface LegalInvestigationAuditResult {
  id: string;
  status: LegalInvestigationStatus;
  createdAt: Date;
}

export interface LegalMessageSearchInput {
  investigationId: string;

  conversationId?: string;
  messageId?: string;

  userId?: string;
  storeId?: string;

  fromDate?: Date | string;
  toDate?: Date | string;

  searchTerm?: string;

  messageType?: MessageType;

  limit?: number;
  cursor?: string;
}

export interface LegalMessageSearchResult {
  id: string;
  conversationId: string;

  senderId: string;
  senderName: string | null;

  content: string | null;
  messageType: MessageType;

  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;

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

export interface LegalInvestigationQueryAuditResult {
  id: string;
  status: LegalInvestigationQueryStatus;
  createdAt: Date;
}