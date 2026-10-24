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
  ForbiddenException,
} from '@nestjs/common';

import { Request } from 'express';

import {
  VerificationRequestStatus,
} from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

import { PaymentsService } from '../payments/payments.service';

import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { PermissionGuard } from './permission.guard';
import { RequirePermission } from './permissions.decorator';
import {
  ConfirmPaymentByReferenceDto,
} from './confirm-payment-by-reference.dto';

// =========================================================
// REQUEST AUTENTICADO
// =========================================================

interface AuthenticatedRequest
  extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

// =========================================================
// DTO — PROMOVER ADMIN REGIONAL
// =========================================================

interface PromoteRegionalAdminDto {
  userId: string;

  region?: string;

  permissions?: {
    canManageVerifications?: boolean;
    canApproveVerifications?: boolean;
    canRevokeVerifications?: boolean;
    canManageStores?: boolean;
    canManageRanking?: boolean;
    canPromoteRegionalAdmins?: boolean;
  };
}

// =========================================================
// DTO — ALTERAR PERMISSÕES
// =========================================================

interface UpdatePermissionsDto {
  canManageVerifications?: boolean;
  canApproveVerifications?: boolean;
  canRevokeVerifications?: boolean;
  canManageStores?: boolean;
  canManageRanking?: boolean;
  canPromoteRegionalAdmins?: boolean;
}

// =========================================================
// DTO — ALTERAR REGIÃO DO ADMIN
// =========================================================

interface UpdateRegionDto {
  region: string;
}

// =========================================================
// DTO — REJEITAR VERIFICAÇÃO
// =========================================================

interface RejectVerificationDto {
  rejectionReason?: string;
}

// =========================================================
// DTO — REVOGAR VERIFICAÇÃO
// =========================================================

interface RevokeVerificationDto {
  reason?: string;
}

// =========================================================
// DTO — REGIÃO DA LOJA
// =========================================================

interface StoreRegionDto {
  region: string;
}

// =========================================================
// DTO — BLOQUEIO DA GESTÃO REGIONAL
// =========================================================

interface StoreRegionalManagementLockDto {
  locked: boolean;
}

// =========================================================
// DTO — CONFIRMAR PAGAMENTO DE PROMOÇÃO
// =========================================================

interface ConfirmPromotionPaymentByReferenceDto {
  reference: string;
}


interface NationalRankingAssignmentDto {
  countryCode: string;
  storeId: string;
  position: number;
}

// =========================================================
// DTO — LEILÃO DO RANKING NACIONAL
// =========================================================
//
// O leilão representa a própria posição do ranking.
//
// NÃO é um Product.
// NÃO possui auctionProductId.
//
// Cada posição pode ter apenas um leilão.
// =========================================================

interface NationalRankingAuctionDto {
  name: string;

  imageUrl?: string;

  startPrice: number;

  currentBid?: number;

  minimumIncrement?: number;

  reservePrice?: number;

  startsAt: string;

  endsAt: string;
}

// =========================================================
// CONTROLLER
// =========================================================
//
// IMPORTANTE:
//
// Este controller é EXCLUSIVAMENTE administrativo.
//
// Todas as rotas passam por:
//
// JwtAuthGuard
//      ↓
// AdminGuard
//      ↓
// PermissionGuard
//
// As operações do proprietário da loja para solicitar
// ou cancelar uma verificação NÃO ficam aqui.
//
// Elas serão colocadas no VerificationController.
// =========================================================

@Controller('admin')
@UseGuards(
  JwtAuthGuard,
  AdminGuard,
  PermissionGuard,
)
export class AdminController {
  constructor(
  private readonly adminService: AdminService,
  private readonly paymentsService: PaymentsService,
) {}

  // =========================================================
  // MEU PERFIL ADMINISTRATIVO
  // =========================================================

  @Get('me')
  async getMyAdminProfile(
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.adminService.getMyAdminProfile(
      req.user.sub,
    );
  }

  // =========================================================
  // LISTAR ADMINISTRADORES
  // =========================================================

  @Get('admins')
  async listAdmins(
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.adminService.listAdmins(
      req.user.sub,
    );
  }

  // =========================================================
  // PESQUISAR UTILIZADORES ELEGÍVEIS
  // =========================================================

  @Get('admins/candidates')
  @RequirePermission(
    'canPromoteRegionalAdmins',
  )
  async searchEligibleUsers(
    @Req()
    req: AuthenticatedRequest,

    @Query('q')
    query?: string,
  ) {
    return this.adminService.searchEligibleUsers(
      req.user.sub,
      query ?? '',
    );
  }

  // =========================================================
  // PROMOVER ADMIN REGIONAL
  // =========================================================

  @Post('admins/regional')
  @RequirePermission(
    'canPromoteRegionalAdmins',
  )
  async promoteRegionalAdmin(
    @Req()
    req: AuthenticatedRequest,

    @Body()
    body: PromoteRegionalAdminDto,
  ) {
    return this.adminService.promoteRegionalAdmin(
      req.user.sub,
      body.userId,
      body.region,
      body.permissions,
    );
  }

  // =========================================================
  // ALTERAR PERMISSÕES
  // =========================================================

  @Patch(
    'admins/:adminId/permissions',
  )
  @RequirePermission(
    'canPromoteRegionalAdmins',
  )
  async updatePermissions(
    @Req()
    req: AuthenticatedRequest,

    @Param('adminId')
    adminId: string,

    @Body()
    body: UpdatePermissionsDto,
  ) {
    return this.adminService.updatePermissions(
      req.user.sub,
      adminId,
      body,
    );
  }

  // =========================================================
  // ALTERAR REGIÃO DO ADMIN
  //
  // SOMENTE SUPER ADMIN
  //
  // A validação definitiva fica no Service.
  // =========================================================

  @Patch(
    'admins/:adminId/region',
  )
  async updateRegion(
    @Req()
    req: AuthenticatedRequest,

    @Param('adminId')
    adminId: string,

    @Body()
    body: UpdateRegionDto,
  ) {
    return this.adminService.updateRegion(
      req.user.sub,
      adminId,
      body.region,
    );
  }

  // =========================================================
  // SUSPENDER ADMIN
  // =========================================================

  @Patch(
    'admins/:adminId/suspend',
  )
  @RequirePermission(
    'canPromoteRegionalAdmins',
  )
  async suspendAdmin(
    @Req()
    req: AuthenticatedRequest,

    @Param('adminId')
    adminId: string,
  ) {
    return this.adminService.suspendAdmin(
      req.user.sub,
      adminId,
    );
  }

  // =========================================================
  // REATIVAR ADMIN
  // =========================================================

  @Patch(
    'admins/:adminId/reactivate',
  )
  @RequirePermission(
    'canPromoteRegionalAdmins',
  )
  async reactivateAdmin(
    @Req()
    req: AuthenticatedRequest,

    @Param('adminId')
    adminId: string,
  ) {
    return this.adminService.reactivateAdmin(
      req.user.sub,
      adminId,
    );
  }

  // =========================================================
  // DESPROMOVER ADMIN
  // =========================================================

  @Patch(
    'admins/:adminId/demote',
  )
  @RequirePermission(
    'canPromoteRegionalAdmins',
  )
  async demoteAdmin(
    @Req()
    req: AuthenticatedRequest,

    @Param('adminId')
    adminId: string,
  ) {
    return this.adminService.demoteAdmin(
      req.user.sub,
      adminId,
    );
  }

  // =========================================================
  // =========================================================
  // GERENCIAR LOJAS
  // =========================================================
  // =========================================================

  // =========================================================
  // LISTAR LOJAS
  //
  // SUPER_ADMIN:
  //   todas as lojas.
  //
  // REGIONAL_ADMIN:
  //   país + região.
  // =========================================================

  @Get('stores')
  @RequirePermission(
    'canManageStores',
  )
  async listManagedStores(
    @Req()
    req: AuthenticatedRequest,

    @Query('q')
    query?: string,

    @Query('page')
    page?: string,

    @Query('limit')
    limit?: string,
  ) {
    return this.adminService.listManagedStores(
      req.user.sub,
      query ?? '',
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  // =========================================================
  // VISUALIZAR UMA LOJA
  // =========================================================

  @Get('stores/:storeId')
  @RequirePermission(
    'canManageStores',
  )
  async getManagedStore(
    @Req()
    req: AuthenticatedRequest,

    @Param('storeId')
    storeId: string,
  ) {
    return this.adminService.getManagedStore(
      req.user.sub,
      storeId,
    );
  }

  // =========================================================
  // ATIVAR LOJA
  // =========================================================

  @Patch(
    'stores/:storeId/activate',
  )
  @RequirePermission(
    'canManageStores',
  )
  async activateStore(
    @Req()
    req: AuthenticatedRequest,

    @Param('storeId')
    storeId: string,
  ) {
    return this.adminService.activateStore(
      req.user.sub,
      storeId,
    );
  }

  // =========================================================
  // DESATIVAR LOJA
  // =========================================================

  @Patch(
    'stores/:storeId/deactivate',
  )
  @RequirePermission(
    'canManageStores',
  )
  async deactivateStore(
    @Req()
    req: AuthenticatedRequest,

    @Param('storeId')
    storeId: string,
  ) {
    return this.adminService.deactivateStore(
      req.user.sub,
      storeId,
    );
  }

  // =========================================================
  // =========================================================
  // VERIFICAÇÃO
  // =========================================================
  // =========================================================

  // =========================================================
  // LISTAR SOLICITAÇÕES DE VERIFICAÇÃO
  //
  // SUPER_ADMIN:
  //   pode visualizar todas.
  //
  // REGIONAL_ADMIN:
  //   apenas as que estão dentro do seu âmbito.
  //
  // A proteção de região fica no AdminService.
  // =========================================================

  @Get('verification/requests')
  @RequirePermission(
    'canManageVerifications',
  )
  async listVerificationRequests(
    @Req()
    req: AuthenticatedRequest,

    @Query('status')
    status?: VerificationRequestStatus,

    @Query('q')
    query?: string,
  ) {
    return this.adminService.listVerificationRequests(
      req.user.sub,
      status,
      query ?? '',
    );
  }

  // =========================================================
  // VISUALIZAR UMA SOLICITAÇÃO
  // =========================================================

  @Get(
    'verification/requests/:requestId',
  )
  @RequirePermission(
    'canManageVerifications',
  )
  async getVerificationRequest(
    @Req()
    req: AuthenticatedRequest,

    @Param('requestId')
    requestId: string,
  ) {
    return this.adminService.getVerificationRequest(
      req.user.sub,
      requestId,
    );
  }

  // =========================================================
  // APROVAR VERIFICAÇÃO
  //
  // BASIC:
  //   Regional Admin autorizado pode aprovar,
  //   se possuir canApproveVerifications.
  //
  // PREMIUM:
  //   somente SUPER_ADMIN.
  //
  // O Service faz a validação definitiva.
  // =========================================================

  @Patch(
    'verification/requests/:requestId/approve',
  )
  @RequirePermission(
    'canApproveVerifications',
  )
  async approveVerification(
    @Req()
    req: AuthenticatedRequest,

    @Param('requestId')
    requestId: string,
  ) {
    return this.adminService.approveVerification(
      req.user.sub,
      requestId,
    );
  }

  // =========================================================
  // REJEITAR VERIFICAÇÃO
  //
  // BASIC:
  //   Regional Admin autorizado.
  //
  // PREMIUM:
  //   somente SUPER_ADMIN.
  //
  // O Service faz a validação definitiva.
  // =========================================================

  @Patch(
    'verification/requests/:requestId/reject',
  )
  @RequirePermission(
    'canApproveVerifications',
  )
  async rejectVerification(
    @Req()
    req: AuthenticatedRequest,

    @Param('requestId')
    requestId: string,

    @Body()
    body: RejectVerificationDto,
  ) {
    return this.adminService.rejectVerification(
      req.user.sub,
      requestId,
      body.rejectionReason,
    );
  }

  // =========================================================
  // REVOGAR VERIFICAÇÃO
  //
  // BASIC:
  //   Regional Admin autorizado.
  //
  // PREMIUM:
  //   somente SUPER_ADMIN.
  //
  // O Service faz a validação definitiva.
  // =========================================================

  @Patch(
    'verification/stores/:storeId/revoke',
  )
  @RequirePermission(
    'canRevokeVerifications',
  )
  async revokeVerification(
    @Req()
    req: AuthenticatedRequest,

    @Param('storeId')
    storeId: string,

    @Body()
    body: RevokeVerificationDto,
  ) {
    return this.adminService.revokeVerification(
      req.user.sub,
      storeId,
      body.reason,
    );
  }

  // =========================================================
  // =========================================================
  // REGIÕES DAS LOJAS
  // =========================================================
  // =========================================================

  // =========================================================
  // ADICIONAR REGIÃO À LOJA
  //
  // SOMENTE SUPER_ADMIN.
  //
  // O AdminService valida a autoridade.
  // =========================================================

  @Post(
    'stores/:storeId/regions',
  )
  async addStoreRegion(
    @Req()
    req: AuthenticatedRequest,

    @Param('storeId')
    storeId: string,

    @Body()
    body: StoreRegionDto,
  ) {
    return this.adminService.addStoreRegion(
      req.user.sub,
      storeId,
      body.region,
    );
  }

  // =========================================================
  // REMOVER REGIÃO DA LOJA
  //
  // SOMENTE SUPER_ADMIN.
  // =========================================================

  @Patch(
    'stores/:storeId/regions/:regionId/remove',
  )
  async removeStoreRegion(
    @Req()
    req: AuthenticatedRequest,

    @Param('storeId')
    storeId: string,

    @Param('regionId')
    regionId: string,
  ) {
    return this.adminService.removeStoreRegion(
      req.user.sub,
      storeId,
      regionId,
    );
  }

  // =========================================================
  // BLOQUEAR/DESBLOQUEAR GESTÃO REGIONAL
  //
  // SOMENTE SUPER_ADMIN.
  // =========================================================

  @Patch(
    'stores/:storeId/regional-management-lock',
  )
  async setStoreRegionalManagementLock(
    @Req()
    req: AuthenticatedRequest,

    @Param('storeId')
    storeId: string,

    @Body()
    body: StoreRegionalManagementLockDto,
  ) {
    return this.adminService.setStoreRegionalManagementLock(
      req.user.sub,
      storeId,
      body.locked,
    );
  }

  // =========================================================
// =========================================================
// PAGAMENTOS
// =========================================================
// =========================================================

// =========================================================
// CONFIRMAR PAGAMENTO DE PROMOÇÃO POR REFERÊNCIA
//
// Apenas SUPER_ADMIN pode confirmar o pagamento.
//
// Exemplo:
//
// POST /admin/payments/promotions/confirm
//
// Body:
//
// {
//   "reference": "PROMO-ABC123"
// }
// =========================================================

@Post(
  'payments/promotions/confirm',
)
async confirmPromotionPaymentByReference(
  @Req()
  req: AuthenticatedRequest,

  @Body()
  body: ConfirmPromotionPaymentByReferenceDto,
) {
  return this.adminService
    .confirmPromotionPaymentByReference(
      req.user.sub,
      body.reference,
    );
}

// =========================================================
// CONFIRMAR PAGAMENTO DE VERIFICAÇÃO
// =========================================================
//
// Apenas SUPER_ADMIN pode confirmar manualmente
// pagamentos de verificação MOCK.
//
// A confirmação também aplica o selo à loja.
// =========================================================

@Post('payments/verifications/confirm')
@RequirePermission('canApproveVerifications')
async confirmVerificationPaymentByReference(
  @Req() req: any,
  @Body() dto: ConfirmPaymentByReferenceDto,
) {
  return this.adminService
    .confirmVerificationPaymentByReference(
      req.user.sub,
      dto.reference,
    );
}

// =========================================================
// CONSULTAR PAGAMENTO POR REFERÊNCIA (pré-visualização)
//
// SOMENTE SUPER_ADMIN. Não altera nada.
// =========================================================

@Get('payments/lookup')
async lookupPayment(
  @Req()
  req: AuthenticatedRequest,

  @Query('reference')
  reference: string,
) {
  const profile =
    await this.adminService.getMyAdminProfile(
      req.user.sub,
    );

  if (profile.adminRole !== 'SUPER_ADMIN') {
    throw new ForbiddenException(
      'Apenas o Super Admin pode consultar pagamentos.',
    );
  }

  return this.paymentsService.findByReferenceForAdmin(
    reference,
  );
}

// =========================================================
// GANHOS DA PLATAFORMA (estatísticas por mês)
//
// SOMENTE SUPER_ADMIN. Só lê, não altera nada.
// =========================================================

@Get('payments/revenue')
async revenueStats(
  @Req()
  req: AuthenticatedRequest,

  @Query('year')
  year?: string,

  @Query('region')
  region?: string,
) {
  const profile =
    await this.adminService.getMyAdminProfile(
      req.user.sub,
    );

  if (profile.adminRole !== 'SUPER_ADMIN') {
    throw new ForbiddenException(
      'Apenas o Super Admin pode consultar os ganhos.',
    );
  }

  return this.paymentsService.getRevenueStats(
    Number(year) || new Date().getFullYear(),
    region,
  );
}
    // =========================================================
  // =========================================================
  // RANKING NACIONAL
  // =========================================================
  // =========================================================

  // =========================================================
  // PESQUISAR BANCAS PREMIUM
  //
  // O painel usa esta rota para pesquisar
  // a banca que deseja colocar no ranking.
  //
  // Exemplo:
  //
  // GET /admin/ranking/national/stores
  //   ?countryCode=MZ
  //   &q=nome
  // =========================================================

  @Get('ranking/national/stores')
  @RequirePermission(
    'canManageRanking',
  )
  async searchNationalRankingStores(
    @Req()
    req: AuthenticatedRequest,

    @Query('countryCode')
    countryCode?: string,

    @Query('q')
    query?: string,
  ) {
    return this.adminService.searchNationalRankingStores(
      req.user.sub,
      countryCode ?? '',
      query ?? '',
    );
  }

  // =========================================================
  // LISTAR RANKING NACIONAL
  //
  // Exemplo:
  //
  // GET /admin/ranking/national?countryCode=MZ
  // =========================================================

  @Get('ranking/national')
  @RequirePermission(
    'canManageRanking',
  )
  async listNationalRanking(
    @Req()
    req: AuthenticatedRequest,

    @Query('countryCode')
    countryCode?: string,
  ) {
    return this.adminService.listNationalRanking(
      req.user.sub,
      countryCode ?? '',
    );
  }

  // =========================================================
  // ATRIBUIR / MOVER BANCA
  //
  // Exemplo:
  //
  // POST /admin/ranking/national
  //
  // {
  //   "countryCode": "MZ",
  //   "storeId": "...",
  //   "position": 1
  // }
  // =========================================================

  @Post('ranking/national')
  @RequirePermission(
    'canManageRanking',
  )
  async assignNationalRankingPosition(
    @Req()
    req: AuthenticatedRequest,

    @Body()
    body: NationalRankingAssignmentDto,
  ) {
    return this.adminService.assignNationalRankingPosition(
      req.user.sub,
      body.countryCode,
      body.storeId,
      body.position,
    );
  }


  // =========================================================
  // ASSOCIAR LEILÃO FIXO À POSIÇÃO
  //
  // Exemplo:
  //
  // PATCH /admin/ranking/national/1/auction
  //
  // // {
//   "name": "Leilão da posição 1",
//   "imageUrl": "/uploads/auction-position-1.jpg",
//   "startPrice": 5000,
//   "currentBid": 5000,
//   "minimumIncrement": 500,
//   "reservePrice": 10000,
//   "startsAt": "2026-10-01T08:00:00.000Z",
//   "endsAt": "2026-10-31T18:00:00.000Z"
// }
  //
  // O leilão fica permanentemente associado
  // à posição até que outro leilão seja configurado.
  // =========================================================

  @Patch(
  'ranking/national/:position/auction',
)
@RequirePermission(
  'canManageRanking',
)
async setNationalRankingAuction(
  @Req()
  req: AuthenticatedRequest,

  @Param('position')
  position: string,

  @Body()
  body: NationalRankingAuctionDto,

  @Query('countryCode')
  countryCode?: string,
) {
  return this.adminService.setNationalRankingAuction(
    req.user.sub,
    countryCode ?? '',
    Number(position),
    body,
  );
}
  // =========================================================
  // REMOVER POSIÇÃO
  //
  // Exemplo:
  //
  // DELETE /admin/ranking/national/1?countryCode=MZ
  //
  // Como o controller atual não importa Delete,
  // usamos PATCH para manter o padrão atual.
  // =========================================================

  @Patch(
    'ranking/national/:position/remove',
  )
  @RequirePermission(
    'canManageRanking',
  )
  async removeNationalRankingPosition(
    @Req()
    req: AuthenticatedRequest,

    @Param('position')
    position: string,

    @Query('countryCode')
    countryCode?: string,
  ) {
    return this.adminService.removeNationalRankingPosition(
      req.user.sub,
      countryCode ?? '',
      Number(position),
    );
  }
}