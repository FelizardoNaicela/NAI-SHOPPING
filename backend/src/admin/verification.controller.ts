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

import { Request } from 'express';

import {
  VerificationType,
} from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

import { VerificationService } from './verification.service';

interface AuthenticatedRequest
  extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

interface RequestVerificationDto {
  storeId: string;
  requestedType: VerificationType;
}

@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
  ) {}

  // =========================================================
  // SOLICITAR VERIFICAÇÃO
  // =========================================================

  @Post('request')
  async requestVerification(
    @Req()
    req: AuthenticatedRequest,

    @Body()
    body: RequestVerificationDto,
  ) {
    return this.verificationService.requestVerification(
      req.user.sub,
      body.storeId,
      body.requestedType,
    );
  }

  // =========================================================
  // MINHAS SOLICITAÇÕES
  // =========================================================

  @Get('my')
  async listMyVerificationRequests(
    @Req()
    req: AuthenticatedRequest,

    @Query('storeId')
    storeId?: string,
  ) {
    return this.verificationService.listMyVerificationRequests(
      req.user.sub,
      storeId,
    );
  }

  // =========================================================
  // CANCELAR SOLICITAÇÃO
  // =========================================================

  @Patch('requests/:requestId/cancel')
  async cancelVerificationRequest(
    @Req()
    req: AuthenticatedRequest,

    @Param('requestId')
    requestId: string,
  ) {
    return this.verificationService.cancelVerificationRequest(
      req.user.sub,
      requestId,
    );
  }

   // =======================================================
  // CONSULTAR ESTADO COMPLETO DA VERIFICAÇÃO
  // =======================================================

  @Get(':requestId/status')
  async getVerificationStatus(
    @Req() req: any,
    @Param('requestId') requestId: string,
  ) {
    return this.verificationService
      .getVerificationStatus(
        req.user.sub,
        requestId,
      );
  }
}