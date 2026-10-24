
import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

import { LegalInvestigationService } from './legal-investigation.service';
import { LegalHoldReleaseDto } from './legal-hold-release.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
  };
}

@Controller('legal-hold-admin')
@UseGuards(JwtAuthGuard)
export class LegalHoldAdminController {
  constructor(
    private readonly legalInvestigationService: LegalInvestigationService,
  ) {}

  @Get()
async listHolds(
  @Req() req: AuthenticatedRequest,
  @Query('status') status?: string,
  @Query('q') q?: string,
) {
  return this.legalInvestigationService.listLegalHolds(
    req.user.sub,
    status,
    q,
  );
}

  @Post(':holdId/release')
  async releaseLegalHold(
    @Req() req: AuthenticatedRequest,
    @Param('holdId') holdId: string,
    @Body() body: LegalHoldReleaseDto,
  ) {
    return this.legalInvestigationService.releaseLegalHold(
      holdId,
      req.user.sub,
      body.reason,
      req.ip,
      req.get('user-agent') ?? undefined,
    );
  }
}
