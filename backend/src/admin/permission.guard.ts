import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import {
  ADMIN_PERMISSION_KEY,
} from './permissions.decorator';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const permission =
      this.reflector.getAllAndOverride<string>(
        ADMIN_PERMISSION_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    /*
     * Se o endpoint não exigir uma permissão
     * específica, o AdminGuard continua sendo
     * suficiente.
     */
    if (!permission) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const user = request.user;

    if (!user?.sub) {
      throw new ForbiddenException(
        'Utilizador não autenticado.',
      );
    }

    /*
     * Procuramos novamente no banco.
     *
     * Não confiamos nas permissões do JWT.
     */
    const adminProfile =
      await this.prisma.adminProfile.findUnique({
        where: {
          userId: user.sub,
        },
        select: {
          adminRole: true,
          status: true,

          canManageVerifications: true,
          canApproveVerifications: true,
          canRevokeVerifications: true,
          canManageStores: true,
          canManageRanking: true,
          canPromoteRegionalAdmins: true,
        },
      });

    if (!adminProfile) {
      throw new ForbiddenException(
        'Administrador não encontrado.',
      );
    }

    if (adminProfile.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Este administrador está suspenso.',
      );
    }

    /*
     * SUPER_ADMIN possui autoridade máxima.
     *
     * Mesmo que uma permissão específica esteja
     * false no banco, o Super Admin continua tendo
     * acesso administrativo.
     */
    if (
      adminProfile.adminRole === 'SUPER_ADMIN'
    ) {
      request.adminProfile = adminProfile;
      return true;
    }

    const permissionValue =
      adminProfile[
        permission as keyof typeof adminProfile
      ];

    if (permissionValue !== true) {
      throw new ForbiddenException(
        `O administrador não possui a permissão: ${permission}.`,
      );
    }

    request.adminProfile = adminProfile;

    return true;
  }
}