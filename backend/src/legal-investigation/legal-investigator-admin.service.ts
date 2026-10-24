import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  AdminRole,
  AdminStatus,
  LegalInvestigatorStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LegalInvestigatorAdminService {
  private readonly logger = new Logger(
    LegalInvestigatorAdminService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // SOMENTE SUPER_ADMIN ATIVO
  // ---------------------------------------------------------

  private async assertSuperAdmin(userId: string) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId },
      select: { adminRole: true, status: true },
    });

    if (
      !profile ||
      profile.adminRole !== AdminRole.SUPER_ADMIN ||
      profile.status !== AdminStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Esta operação está reservada a SUPER_ADMIN ativos.',
      );
    }
  }

  // ---------------------------------------------------------
  // LISTAR INVESTIGADORES
  // ---------------------------------------------------------

  async list(adminUserId: string) {
    await this.assertSuperAdmin(adminUserId);

    return this.prisma.legalInvestigatorProfile.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  // ---------------------------------------------------------
  // PROCURAR CANDIDATOS
  // ---------------------------------------------------------

  async searchCandidates(adminUserId: string, query: string) {
    await this.assertSuperAdmin(adminUserId);

    const q = query?.trim();

    if (!q || q.length < 2) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        role: UserRole.USER,
        adminProfile: null,
          deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        countryCode: true,
      },
    });
  }

  // ---------------------------------------------------------
  // PROMOVER
  // ---------------------------------------------------------

  async promote(adminUserId: string, targetUserId: string) {
    await this.assertSuperAdmin(adminUserId);

    if (adminUserId === targetUserId) {
      throw new BadRequestException(
        'Não podes promover a tua própria conta.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: targetUserId },
        select: {
  id: true,
  role: true,
  deletedAt: true,
  adminProfile: { select: { id: true } },
  legalInvestigatorProfile: { select: { status: true } },
},
      });

      if (!user) {
        throw new NotFoundException('Utilizador não encontrado.');
      }

      if (!user || user.deletedAt) {
  throw new NotFoundException('Utilizador não encontrado.');
}

      if (user.role === UserRole.ADMIN || user.adminProfile) {
        throw new BadRequestException(
          'Uma conta administrativa não pode ser investigador legal.',
        );
      }

      if (
        user.role === UserRole.LEGAL_INVESTIGATOR &&
        user.legalInvestigatorProfile?.status ===
          LegalInvestigatorStatus.ACTIVE
      ) {
        throw new BadRequestException(
          'Este utilizador já é investigador legal.',
        );
      }

      const profile = await tx.legalInvestigatorProfile.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          status: LegalInvestigatorStatus.ACTIVE,
        },
        update: {
          status: LegalInvestigatorStatus.ACTIVE,
        },
        select: { id: true, status: true },
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { role: UserRole.LEGAL_INVESTIGATOR },
      });

      // em promote(), antes do return profile:
await tx.legalInvestigatorRoleAudit.create({
  data: {
    actorId: adminUserId,
    targetUserId,
    fromStatus: user.legalInvestigatorProfile?.status ?? null,
    toStatus: 'ACTIVE',
  },
});

// em setStatus(), depois do update do perfil:
await tx.legalInvestigatorRoleAudit.create({
  data: {
    actorId: adminUserId,
    targetUserId,
    fromStatus: user.legalInvestigatorProfile?.status ?? null,
    toStatus: 'ACTIVE',
  },
});

      return profile;
    });

    this.logger.warn(
      `SUPER_ADMIN ${adminUserId} promoveu ${targetUserId} a investigador legal.`,
    );

    return result;
  }

  // ---------------------------------------------------------
  // ALTERAR ESTADO (ativar, suspender, revogar)
  // ---------------------------------------------------------

  async setStatus(
    adminUserId: string,
    profileId: string,
    status: LegalInvestigatorStatus,
  ) {
    await this.assertSuperAdmin(adminUserId);

    const result = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.legalInvestigatorProfile.findUnique({
        where: { id: profileId },
        select: { id: true, userId: true, status: true },
      });

      if (!profile) {
        throw new NotFoundException(
          'Perfil de investigador não encontrado.',
        );
      }

      if (profile.status === LegalInvestigatorStatus.REVOKED) {
        throw new BadRequestException(
          'Um perfil revogado só pode ser reposto promovendo o utilizador de novo.',
        );
      }

      if (profile.status === status) {
        return profile;
      }

      const updated = await tx.legalInvestigatorProfile.update({
        where: { id: profileId },
        data: { status },
        select: { id: true, userId: true, status: true },
      });

      await tx.user.update({
        where: { id: profile.userId },
        data: {
          role:
            status === LegalInvestigatorStatus.REVOKED
              ? UserRole.USER
              : UserRole.LEGAL_INVESTIGATOR,
        },
      });

      return updated;
    });

    this.logger.warn(
      `SUPER_ADMIN ${adminUserId} alterou o investigador ${result.userId} para ${status}.`,
    );

    return { id: result.id, status: result.status };
  }
}