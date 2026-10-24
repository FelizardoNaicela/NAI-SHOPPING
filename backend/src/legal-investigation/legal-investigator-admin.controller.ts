import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { IsIn, IsString, IsUUID } from 'class-validator';
import type { Request } from 'express';
import { LegalInvestigatorStatus } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { LegalInvestigatorAdminService } from './legal-investigator-admin.service';

interface AuthenticatedRequest extends Request {
  user: { sub: string };
}

class PromoteLegalInvestigatorDto {
  @IsString()
  @IsUUID()
  userId!: string;
}

class SetLegalInvestigatorStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED', 'REVOKED'])
  status!: LegalInvestigatorStatus;
}

@Controller('legal-investigator-admin')
@UseGuards(JwtAuthGuard)
export class LegalInvestigatorAdminController {
  constructor(
    private readonly service: LegalInvestigatorAdminService,
  ) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.service.list(req.user.sub);
  }

  @Get('candidates')
  candidates(
    @Req() req: AuthenticatedRequest,
    @Query('q') q?: string,
  ) {
    return this.service.searchCandidates(req.user.sub, q ?? '');
  }

  @Post('promote')
  promote(
    @Req() req: AuthenticatedRequest,
    @Body() body: PromoteLegalInvestigatorDto,
  ) {
    return this.service.promote(req.user.sub, body.userId);
  }

  @Patch(':profileId/status')
  setStatus(
    @Req() req: AuthenticatedRequest,
    @Param('profileId') profileId: string,
    @Body() body: SetLegalInvestigatorStatusDto,
  ) {
    return this.service.setStatus(
      req.user.sub,
      profileId,
      body.status,
    );
  }
}