import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!user?.sub) {
      throw new UnauthorizedException(
        'Utilizador não autenticado.',
      );
    }

    const adminProfile =
      await this.prisma.adminProfile.findUnique({
        where: {
          userId: user.sub,
        },
        select: {
          id: true,
          userId: true,
          adminRole: true,
          status: true,
          region: true,

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
        'Este utilizador não é administrador.',
      );
    }

    if (adminProfile.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Este administrador está suspenso.',
      );
    }

    request.adminProfile = adminProfile;

    return true;
  }
}