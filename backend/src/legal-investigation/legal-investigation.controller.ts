import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type {
  Request,
  Response,
} from 'express';
import { pipeline } from 'stream/promises';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

import { LegalInvestigationService } from './legal-investigation.service';

import { LegalInvestigatorGuard } from './guards/legal-investigator.guard';

import { ListEvidenceByMessagesDto } from './dto/list-evidence-by-messages.dto';

import type {
  CompleteLegalInvestigationRequest,
  FailLegalInvestigationRequest,
  LegalMessageSearchInput,
  StartLegalInvestigationInput,
} from './legal-investigation.types';

import { LegalEvidenceService } from './legal-evidence.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
  };
}

@Controller('legal-investigation')
@UseGuards(
  JwtAuthGuard,
  LegalInvestigatorGuard,
)
export class LegalInvestigationController {
  constructor(
  private readonly legalInvestigationService: LegalInvestigationService,
  private readonly legalEvidenceService: LegalEvidenceService,
) {}

  // =========================================================
  // INICIAR INVESTIGAÇÃO
  // =========================================================

  @Get()
  async listMyInvestigations(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.legalInvestigationService.listMyInvestigations(
      req.user.sub,
    );
  }



  @Post('start')
async startInvestigation(
  @Req() req: AuthenticatedRequest,
  @Body() body: StartLegalInvestigationInput,
) {
  return this.legalInvestigationService.startInvestigation(
    body,
    req.user.sub,
    req.ip,
    req.get('user-agent') ?? undefined,
  );
}

  // =========================================================
  // PESQUISAR MENSAGENS
  // =========================================================

 @Post('messages/search')
async searchMessages(
  @Req() req: AuthenticatedRequest,
  @Body() body: LegalMessageSearchInput,
) {
  return this.legalInvestigationService.searchMessages(
    body,
    req.user.sub,
    req.ip,
    req.get('user-agent') ?? undefined,
  );
}

// =========================================================
// CONCLUIR INVESTIGAÇÃO
// =========================================================

@Post('complete')
async completeInvestigation(
  @Req() req: AuthenticatedRequest,
  @Body() body: CompleteLegalInvestigationRequest,
) {

  return this.legalInvestigationService.completeInvestigation(
  body,
  req.user.sub,
  req.ip,
  req.get('user-agent') ?? undefined,
);
}

// =========================================================
// MARCAR INVESTIGAÇÃO COMO FALHA
// =========================================================

@Post('fail')
async failInvestigation(
  @Req() req: AuthenticatedRequest,
  @Body() body: FailLegalInvestigationRequest,
) {

  return this.legalInvestigationService.failInvestigation(
  body,
  req.user.sub,
  req.ip,
  req.get('user-agent') ?? undefined,
);
}

// =========================================================
// LISTAR EVIDÊNCIAS DAS MENSAGENS INDICADAS
// =========================================================
@Post(':investigationId/evidence/by-messages')
async listEvidenceByMessages(
  @Req() req: AuthenticatedRequest,
  @Param('investigationId') investigationId: string,
  @Body() body: ListEvidenceByMessagesDto,
) {
  return this.legalInvestigationService.listEvidenceByMessages(
    investigationId,
    body.messageIds,
    req.user.sub,
  );
}

  // =========================================================
  // LISTAR EVIDÊNCIAS
  // =========================================================

  @Get(':investigationId/evidence')
  async listEvidence(
    @Req() req: AuthenticatedRequest,
    @Param('investigationId')
    investigationId: string,
  ) {
    return this.legalInvestigationService.listEvidence(
      investigationId,
      req.user.sub,
    );
  }

  // =========================================================
  // CONSULTAR UMA EVIDÊNCIA
  // =========================================================

 @Get(':investigationId/evidence/:evidenceId')
async getEvidence(
  @Req() req: AuthenticatedRequest,
  @Param('investigationId')
  investigationId: string,
  @Param('evidenceId')
  evidenceId: string,
) {
  return this.legalInvestigationService.getEvidence(
    investigationId,
    evidenceId,
    req.user.sub,
    req.ip,
    req.get('user-agent') ?? undefined,
  );
}

@Get(
  ':investigationId/evidence/:evidenceId/media/:mediaType',
)
async getEvidenceMedia(
  @Req() req: AuthenticatedRequest,
  @Param('investigationId')
  investigationId: string,
  @Param('evidenceId')
  evidenceId: string,
  @Param('mediaType')
  mediaType:
    | 'audio'
    | 'image'
    | 'video'
    | 'thumbnail'
    | 'document',
  @Res() res: Response,
) {
  const allowedMediaTypes = [
    'audio',
    'image',
    'video',
    'thumbnail',
    'document',
  ] as const;

  if (
    !allowedMediaTypes.includes(
      mediaType as typeof allowedMediaTypes[number],
    )
  ) {
    throw new BadRequestException(
      'Tipo de mídia jurídica inválido.',
    );
  }

  const media =
    await this.legalInvestigationService
      .getEvidenceMedia(
        investigationId,
        evidenceId,
        mediaType,
        req.user.sub,
        req.ip,
        req.get('user-agent') ?? undefined,
      );

  const safeContentType =
    this.getLegalEvidenceContentType(
      mediaType,
      media.originalName,
    );

  const safeFileName =
    this.sanitizeLegalEvidenceFileName(
      media.originalName,
      `${evidenceId}-${mediaType}`,
    );

  res.setHeader(
    'Content-Type',
    safeContentType,
  );

  res.setHeader(
    'Content-Length',
    media.originalSize.toString(),
  );

  res.setHeader(
    'Cache-Control',
    'no-store, private',
  );

  res.setHeader(
    'Pragma',
    'no-cache',
  );

  res.setHeader(
    'X-Content-Type-Options',
    'nosniff',
  );

  res.setHeader(
    'Content-Disposition',
    `inline; filename="${safeFileName}"`,
  );

  try {
    await pipeline(
      media.stream,
      res,
    );

    await this.legalEvidenceService
  .completeEvidenceAccessAudit(
    media.accessAuditId,
  );
  } catch (error) {
    await this.legalEvidenceService
  .failEvidenceAccessAudit(
    media.accessAuditId,
    error instanceof Error
      ? error.message
      : 'Falha durante o streaming da mídia da evidência.',
  );

    if (!res.headersSent) {
      throw error;
    }

    if (!res.destroyed) {
      res.destroy();
    }
  }
}

private getLegalEvidenceContentType(
  mediaType:
    | 'audio'
    | 'image'
    | 'video'
    | 'thumbnail'
    | 'document',
  originalName?: string,
): string {
  const extension =
    originalName
      ?.split('.')
      .pop()
      ?.toLowerCase();

  if (
    mediaType === 'image' ||
    mediaType === 'thumbnail'
  ) {
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';

      case 'png':
        return 'image/png';

      case 'gif':
        return 'image/gif';

      case 'webp':
        return 'image/webp';

      case 'bmp':
        return 'image/bmp';

      default:
        return 'application/octet-stream';
    }
  }

  if (mediaType === 'audio') {
    switch (extension) {
      case 'mp3':
        return 'audio/mpeg';

      case 'wav':
        return 'audio/wav';

      case 'ogg':
        return 'audio/ogg';

      case 'm4a':
        return 'audio/mp4';

      case 'aac':
        return 'audio/aac';

      default:
        return 'application/octet-stream';
    }
  }

  if (mediaType === 'video') {
    switch (extension) {
      case 'mp4':
        return 'video/mp4';

      case 'webm':
        return 'video/webm';

      case 'mov':
        return 'video/quicktime';

      case 'avi':
        return 'video/x-msvideo';

      case 'mkv':
        return 'video/x-matroska';

      default:
        return 'application/octet-stream';
    }
  }

  if (mediaType === 'document') {
    switch (extension) {
      case 'pdf':
        return 'application/pdf';

      case 'txt':
        return 'text/plain';

      case 'csv':
        return 'text/csv';

      case 'json':
        return 'application/json';

      case 'doc':
        return 'application/msword';

      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      case 'xls':
        return 'application/vnd.ms-excel';

      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      default:
        return 'application/octet-stream';
    }
  }

  return 'application/octet-stream';
}

private sanitizeLegalEvidenceFileName(
  originalName: string | undefined,
  fallback: string,
): string {
  const source =
    originalName?.trim() || fallback;

  const sanitized =
    source
      .replace(/[\r\n"]/g, '_')
      .replace(/[^\w.\- ()]/g, '_')
      .slice(0, 180);

  return sanitized || fallback;
}}
