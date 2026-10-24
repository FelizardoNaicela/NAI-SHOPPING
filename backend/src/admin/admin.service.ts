import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AdminRole,
  AdminStatus,
  UserRole,
  VerificationType,
  VerificationRequestStatus,
  PaymentStatus,
  PaymentType,
} from '@prisma/client';

import { InternalServerErrorException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentsService,
} from '../payments/payments.service';
import {
  PaymentGatewayService,
} from '../payments/gateways/payment-gateway.service';
import { REGIONS } from '../common/regions';

interface AdminPermissions {
  canManageVerifications?: boolean;
  canApproveVerifications?: boolean;
  canRevokeVerifications?: boolean;
  canManageStores?: boolean;
  canManageRanking?: boolean;
  canPromoteRegionalAdmins?: boolean;
}

interface SetNationalRankingAuctionData {
  name: string;
  imageUrl?: string;
  startPrice: number;
  currentBid?: number;
  minimumIncrement?: number;
  reservePrice?: number;
  startsAt: string;
  endsAt: string;
}

@Injectable()
export class AdminService {
  constructor(
  private readonly prisma: PrismaService,

  private readonly paymentsService: PaymentsService,

  private readonly paymentGatewayService: PaymentGatewayService,
) {}

  // =========================================================
  // ADMIN ATUAL
  // =========================================================

  async getMyAdminProfile(userId: string) {
    const admin =
      await this.prisma.adminProfile.findUnique({
        where: {
          userId,
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              username: true,
              role: true,
              countryCode: true,
              region: true,
              createdAt: true,
            },
          },
        },
      });

    if (!admin) {
      throw new ForbiddenException(
        'Este usuário não possui perfil administrativo.',
      );
    }

    if (
      admin.status !==
      AdminStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Este administrador está suspenso.',
      );
    }

    return admin;
  }

  // =========================================================
  // VERIFICAR SUPER ADMIN
  // =========================================================

  private async requireSuperAdmin(
    userId: string,
  ) {
    const admin =
      await this.getMyAdminProfile(
        userId,
      );

    if (
      admin.adminRole !==
      AdminRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Apenas o Super Admin pode realizar esta operação.',
      );
    }

    return admin;
  }

  // =========================================================
  // VERIFICAR ADMIN ATIVO
  // =========================================================

  private async requireActiveAdmin(
    userId: string,
  ) {
    return this.getMyAdminProfile(
      userId,
    );
  }

  // =========================================================
  // VERIFICAR QUEM PODE GERIR ADMINS
  // =========================================================


private async requireAdminManager(
  requesterId: string,
  targetAdminId: string,
) {
  // =========================================
  // VALIDAR ADMINISTRADOR SOLICITANTE
  // =========================================

  const requester =
    await this.requireActiveAdmin(
      requesterId,
    );

  // =========================================
  // BUSCAR ADMINISTRADOR DE DESTINO
  // =========================================

  const targetAdmin =
    await this.prisma.adminProfile.findUnique({
      where: {
        id: targetAdminId,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            role: true,
            countryCode: true,
            region: true,
            createdAt: true,
          },
        },
      },
    });

  if (!targetAdmin) {
    throw new NotFoundException(
      'Administrador não encontrado.',
    );
  }

  // =========================================
  // O SUPER ADMIN NÃO PODE SER GERIDO
  // POR ESTA OPERAÇÃO
  // =========================================

  if (
    targetAdmin.adminRole ===
    AdminRole.SUPER_ADMIN
  ) {
    throw new ForbiddenException(
      'O Super Admin não pode ser gerido por esta operação.',
    );
  }

  // =========================================
  // SUPER ADMIN: ACESSO GLOBAL
  // =========================================
  // Não aplicar restrições de país ou região.
  // =========================================

  if (
    requester.adminRole ===
    AdminRole.SUPER_ADMIN
  ) {
    return {
      requester,
      targetAdmin,
    };
  }

  // =========================================
  // ADMIN REGIONAL: VALIDAR PERMISSÃO
  // =========================================

  if (
    requester.adminRole !==
    AdminRole.REGIONAL_ADMIN
  ) {
    throw new ForbiddenException(
      'Este administrador não tem autorização para gerir outros administradores.',
    );
  }

  if (
    !requester.canPromoteRegionalAdmins
  ) {
    throw new ForbiddenException(
      'Este administrador não possui permissão para gerir outros administradores.',
    );
  }

  // =========================================
  // VALIDAR PAÍS E REGIÃO DO SOLICITANTE
  // =========================================

  const requesterCountry =
    requester.user.countryCode
      ?.trim()
      .toUpperCase();

  const requesterRegion =
    requester.region?.trim();

  if (!requesterCountry || !requesterRegion) {
    throw new BadRequestException(
      'O administrador regional precisa ter país e região definidos.',
    );
  }

  // =========================================
  // VALIDAR PAÍS E REGIÃO DO DESTINO
  // =========================================

  const targetCountry =
    targetAdmin.user.countryCode
      ?.trim()
      .toUpperCase();

  const targetRegion =
    targetAdmin.region?.trim();

  if (
    targetCountry !== requesterCountry ||
    targetRegion !== requesterRegion
  ) {
    throw new ForbiddenException(
      'Um Admin Regional só pode gerir administradores do próprio país e região.',
    );
  }

  return {
    requester,
    targetAdmin,
  };
}


  // =========================================================
  // LISTAR ADMINISTRADORES
  // =========================================================

  async listAdmins(
    requesterId: string,
  ) {
    const requester =
      await this.requireActiveAdmin(
        requesterId,
      );

    const where =
      requester.adminRole ===
      AdminRole.SUPER_ADMIN
        ? {}
       : {
    adminRole: AdminRole.REGIONAL_ADMIN,
    region: requester.region,
    user: {
      countryCode: requester.user.countryCode,
    },
  };

    return this.prisma.adminProfile.findMany({
      where,

      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            role: true,
            countryCode: true,
            region: true,
            createdAt: true,
          },
        },
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // =========================================================
  // PESQUISAR UTILIZADORES ELEGÍVEIS PARA PROMOÇÃO
  // =========================================================

  async searchEligibleUsers(
    requesterId: string,
    query: string,
  ) {
    const requester =
      await this.requireActiveAdmin(
        requesterId,
      );

    if (
      requester.adminRole !==
        AdminRole.SUPER_ADMIN &&
      !requester.canPromoteRegionalAdmins
    ) {
      throw new ForbiddenException(
        'Este administrador não possui permissão para promover outros administradores.',
      );
    }

    const search =
      query?.trim() ?? '';

    if (search.length < 2) {
      return [];
    }

    const where: any = {
      role: UserRole.USER,

      adminProfile: null,
        deletedAt: null,

      OR: [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },

        {
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    };

    if (
  requester.adminRole ===
  AdminRole.REGIONAL_ADMIN
) {
  if (!requester.region) {
    throw new BadRequestException(
      'O administrador não possui uma região definida.',
    );
  }

  if (!requester.user.countryCode) {
    throw new BadRequestException(
      'O administrador não possui um país definido.',
    );
  }

  where.countryCode =
    requester.user.countryCode;

  where.region =
    requester.region;
}

    return this.prisma.user.findMany({
      where,

      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        countryCode: true,
        region: true,
      },

      orderBy: [
        {
          name: 'asc',
        },

        {
          email: 'asc',
        },
      ],

      take: 20,
    });
  }

  // =========================================================
  // PROMOVER PARA ADMIN REGIONAL
  // =========================================================

  async promoteRegionalAdmin(
    requesterId: string,
    targetUserId: string,
    region?: string,
    permissions?: AdminPermissions,
  ) {
    const requester =
      await this.requireActiveAdmin(
        requesterId,
      );

    const targetUser =
      await this.prisma.user.findUnique({
        where: {
          id: targetUserId,
        },

        include: {
          adminProfile: true,
        },
      });

    if (!targetUser) {
      throw new NotFoundException(
        'Usuário que será promovido não foi encontrado.',
      );
    }

    if (targetUser.deletedAt) {
  throw new NotFoundException(
    'Usuário que será promovido não foi encontrado.',
  );
}

    if (
      targetUser.role !==
      UserRole.USER
    ) {
      throw new BadRequestException(
        'Somente usuários normais podem ser promovidos para Admin Regional.',
      );
    }

    if (targetUser.adminProfile) {
      throw new BadRequestException(
        'Este usuário já possui um perfil administrativo.',
      );
    }




if (
  requester.adminRole === AdminRole.REGIONAL_ADMIN &&
  targetUser.countryCode !== requester.user.countryCode
) {
  throw new ForbiddenException(
    'Um Admin Regional só pode promover utilizadores do próprio país.',
  );
}


    let adminRegion: string | null =
      null;

    if (
      requester.adminRole ===
      AdminRole.SUPER_ADMIN
    ) {
      if (!region?.trim()) {
        throw new BadRequestException(
          'A região do Admin Regional é obrigatória.',
        );
      }

      adminRegion =
        region.trim();
    } else {
      if (
        !requester.canPromoteRegionalAdmins
      ) {
        throw new ForbiddenException(
          'Este administrador não possui permissão para promover outros administradores.',
        );
      }

      if (!requester.region) {
        throw new BadRequestException(
          'O administrador solicitante não possui uma região definida.',
        );
      }

      adminRegion =
        requester.region;

      if (
        region &&
        region.trim() !==
          requester.region
      ) {
        throw new ForbiddenException(
          'Um Admin Regional só pode promover administradores para a própria região.',
        );
      }
    }

    if (
      requester.adminRole ===
        AdminRole.REGIONAL_ADMIN &&
      targetUser.region !==
        requester.region
    ) {
      throw new ForbiddenException(
        'Um Admin Regional só pode promover usuários da própria região.',
      );
    }

    if (!targetUser.countryCode) {
  throw new BadRequestException(
    'O utilizador não possui um país definido.',
  );
}

this.assertValidRegion(
  targetUser.countryCode,
  adminRegion!,
);

    let finalPermissions:
      Required<AdminPermissions>;

    if (
      requester.adminRole ===
      AdminRole.SUPER_ADMIN
    ) {
      finalPermissions = {
        canManageVerifications:
          permissions?.canManageVerifications ??
          false,

        canApproveVerifications:
          permissions?.canApproveVerifications ??
          false,

        canRevokeVerifications:
          permissions?.canRevokeVerifications ??
          false,

        canManageStores:
          permissions?.canManageStores ??
          false,

        canManageRanking:
          permissions?.canManageRanking ??
          false,

        canPromoteRegionalAdmins:
          permissions?.canPromoteRegionalAdmins ??
          false,
      };
    } else {
      const permissionEntries: Array<
        keyof AdminPermissions
      > = [
        'canManageVerifications',
        'canApproveVerifications',
        'canRevokeVerifications',
        'canManageStores',
        'canManageRanking',
      ];

      for (
        const permission of permissionEntries
      ) {
        if (
          permissions?.[permission] ===
            true &&
          requester[permission] !==
            true
        ) {
          throw new ForbiddenException(
            `Você não possui a permissão "${permission}" e não pode atribuí-la.`,
          );
        }
      }

      if (
        permissions?.canPromoteRegionalAdmins ===
        true
      ) {
        throw new ForbiddenException(
          'Um Admin Regional não pode atribuir a permissão para promover outros administradores.',
        );
      }

      finalPermissions = {
        canManageVerifications:
          permissions?.canManageVerifications ??
          false,

        canApproveVerifications:
          permissions?.canApproveVerifications ??
          false,

        canRevokeVerifications:
          permissions?.canRevokeVerifications ??
          false,

        canManageStores:
          permissions?.canManageStores ??
          false,

        canManageRanking:
          permissions?.canManageRanking ??
          false,

        canPromoteRegionalAdmins:
          false,
      };
    }

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          await tx.user.update({
            where: {
              id: targetUserId,
            },

            data: {
              role: UserRole.ADMIN,
              region: adminRegion,
            },
          });

          return tx.adminProfile.create({
            data: {
              userId:
                targetUserId,

              adminRole:
                AdminRole.REGIONAL_ADMIN,

              status:
                AdminStatus.ACTIVE,

              region:
                adminRegion,

              canManageVerifications:
                finalPermissions.canManageVerifications ??
                false,

              canApproveVerifications:
                finalPermissions.canApproveVerifications ??
                false,

              canRevokeVerifications:
                finalPermissions.canRevokeVerifications ??
                false,

              canManageStores:
                finalPermissions.canManageStores ??
                false,

              canManageRanking:
                finalPermissions.canManageRanking ??
                false,

              canPromoteRegionalAdmins:
                finalPermissions.canPromoteRegionalAdmins ??
                false,
            },

            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  username: true,
                  role: true,
                  countryCode: true,
                  region: true,
                },
              },
            },
          });
        },
      );

    return result;
  }

  // =========================================================
  // ALTERAR PERMISSÕES
  // =========================================================

  async updatePermissions(
    requesterId: string,
    targetAdminId: string,
    permissions: AdminPermissions,
  ) {
    const {
      requester,
      targetAdmin,
    } =
      await this.requireAdminManager(
        requesterId,
        targetAdminId,
      );

    if (
      requester.adminRole ===
      AdminRole.REGIONAL_ADMIN
    ) {
      const permissionEntries: Array<
        keyof AdminPermissions
      > = [
        'canManageVerifications',
        'canApproveVerifications',
        'canRevokeVerifications',
        'canManageStores',
        'canManageRanking',
      ];

      for (
        const permission of permissionEntries
      ) {
        if (
          permissions[permission] ===
            true &&
          requester[permission] !==
            true
        ) {
          throw new ForbiddenException(
            `Você não possui a permissão "${permission}" e não pode atribuí-la.`,
          );
        }
      }

      if (
        permissions.canPromoteRegionalAdmins ===
        true
      ) {
        throw new ForbiddenException(
          'Um Admin Regional não pode atribuir a permissão para promover outros administradores.',
        );
      }
    }

    return this.prisma.adminProfile.update({
      where: {
        id: targetAdmin.id,
      },

      data: {
        ...(permissions.canManageVerifications !==
          undefined && {
          canManageVerifications:
            permissions.canManageVerifications,
        }),

        ...(permissions.canApproveVerifications !==
          undefined && {
          canApproveVerifications:
            permissions.canApproveVerifications,
        }),

        ...(permissions.canRevokeVerifications !==
          undefined && {
          canRevokeVerifications:
            permissions.canRevokeVerifications,
        }),

        ...(permissions.canManageStores !==
          undefined && {
          canManageStores:
            permissions.canManageStores,
        }),

        ...(permissions.canManageRanking !==
          undefined && {
          canManageRanking:
            permissions.canManageRanking,
        }),

        ...(permissions.canPromoteRegionalAdmins !==
          undefined && {
          canPromoteRegionalAdmins:
            permissions.canPromoteRegionalAdmins,
        }),
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            role: true,
            countryCode: true,
            region: true,
          },
        },
      },
    });
  }

  // =========================================================
  // ALTERAR REGIÃO
  //
  // SOMENTE SUPER ADMIN.
  // =========================================================

  async updateRegion(
    requesterId: string,
    targetAdminId: string,
    region: string,
  ) {
    await this.requireSuperAdmin(
      requesterId,
    );

    if (!region?.trim()) {
      throw new BadRequestException(
        'A região é obrigatória.',
      );
    }

    const targetAdmin =
  await this.prisma.adminProfile.findUnique({
    where: {
      id: targetAdminId,
    },
    include: {
      user: {
        select: {
          countryCode: true,
        },
      },
    },
  });

if (!targetAdmin) {
  throw new NotFoundException(
    'Administrador não encontrado.',
  );
}

if (
  targetAdmin.adminRole ===
  AdminRole.SUPER_ADMIN
) {
  throw new BadRequestException(
    'O Super Admin não possui região administrativa.',
  );
}

if (!targetAdmin.user.countryCode) {
  throw new BadRequestException(
    'O administrador-alvo não possui um país definido.',
  );
}

const normalizedRegion = region.trim();

this.assertValidRegion(
  targetAdmin.user.countryCode,
  normalizedRegion,
);

    return this.prisma.$transaction(
      async (tx) => {
        const admin =
          await tx.adminProfile.update({
            where: {
              id: targetAdminId,
            },

            data: {
              region:
                region.trim(),
            },
          });

        await tx.user.update({
          where: {
            id: admin.userId,
          },

          data: {
            region:
              region.trim(),
          },
        });

        return admin;
      },
    );
  }

  // =========================================================
  // SUSPENDER ADMIN
  // =========================================================

  async suspendAdmin(
    requesterId: string,
    targetAdminId: string,
  ) {
    const {
      targetAdmin,
    } =
      await this.requireAdminManager(
        requesterId,
        targetAdminId,
      );

    return this.prisma.adminProfile.update({
      where: {
        id: targetAdmin.id,
      },

      data: {
        status:
          AdminStatus.SUSPENDED,
      },
    });
  }

  // =========================================================
  // REATIVAR ADMIN
  // =========================================================

  async reactivateAdmin(
    requesterId: string,
    targetAdminId: string,
  ) {
    const {
      targetAdmin,
    } =
      await this.requireAdminManager(
        requesterId,
        targetAdminId,
      );

    return this.prisma.adminProfile.update({
      where: {
        id: targetAdmin.id,
      },

      data: {
        status:
          AdminStatus.ACTIVE,
      },
    });
  }

  // =========================================================
  // DESPROMOVER ADMIN
  // =========================================================

  async demoteAdmin(
    requesterId: string,
    targetAdminId: string,
  ) {
    const {
      targetAdmin,
    } =
      await this.requireAdminManager(
        requesterId,
        targetAdminId,
      );

    if (
      targetAdmin.adminRole !==
      AdminRole.REGIONAL_ADMIN
    ) {
      throw new ForbiddenException(
        'Somente administradores regionais podem ser despromovidos.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.adminProfile.delete({
          where: {
            id: targetAdmin.id,
          },
        });

        const user =
          await tx.user.update({
            where: {
              id:
                targetAdmin.userId,
            },

            data: {
              role: UserRole.USER,
            },

            select: {
              id: true,
              email: true,
              name: true,
              username: true,
              role: true,
              countryCode: true,
              region: true,
            },
          });

        return {
          success: true,
          message:
            'Administrador despromovido com sucesso.',
          user,
        };
      },
    );
  }

  // =========================================================
  // VERIFICAR QUEM PODE GERIR LOJAS
  // =========================================================

  private async requireStoreManager(
    requesterId: string,
  ) {
    const requester =
      await this.requireActiveAdmin(
        requesterId,
      );

    if (
      requester.adminRole ===
      AdminRole.SUPER_ADMIN
    ) {
      return requester;
    }

    if (
      !requester.canManageStores
    ) {
      throw new ForbiddenException(
        'Este administrador não possui permissão para gerir lojas.',
      );
    }

    if (!requester.region) {
      throw new BadRequestException(
        'Este administrador não possui uma região definida.',
      );
    }

    return requester;
  }

  // =========================================================
  // CONSTRUIR ESCOPO DAS LOJAS
  // =========================================================

  private async buildManagedStoreWhere(
  requesterId: string,
  query?: string,
) {
  const requester =
    await this.requireStoreManager(
      requesterId,
    );

  const search =
    query?.trim() ?? '';

  const where: any = {};

  // =======================================================
  // ADMIN REGIONAL
  // =======================================================
  //
  // Só pode administrar lojas:
  //
  // 1. do próprio país;
  // 2. da própria região;
  // 3. que NÃO estejam bloqueadas para gestão regional.
  //
  // IMPORTANTE:
  //
  // Não usamos:
  //
  // regions: { none: {} }
  //
  // porque uma loja pode possuir UMA StoreRegion
  // sem ser uma loja de múltiplas regiões.
  //
  // A regra de múltiplas regiões é controlada pelo
  // regionalManagementLocked.
  // =======================================================

  if (
    requester.adminRole ===
    AdminRole.REGIONAL_ADMIN
  ) {
    where.countryCode =
      requester.user.countryCode;

    where.region =
      requester.region;

    where.regionalManagementLocked =
      false;
  }

  // =======================================================
  // PESQUISA
  // =======================================================

  if (search.length > 0) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  return {
    requester,
    where,
  };
}

  // =========================================================
  // LISTAR LOJAS GERENCIADAS
  // =========================================================

  async listManagedStores(
    requesterId: string,
    search = '',
    page = 1,
    limit = 20,
  ) {
    const trimmedSearch =
      search.trim();

    if (trimmedSearch.length < 2) {
      return {
        stores: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      };
    }

    await this.requireStoreManager(
      requesterId,
    );

    const safePage =
      Math.max(
        1,
        Number(page) || 1,
      );

    const safeLimit =
      Math.min(
        50,
        Math.max(
          1,
          Number(limit) || 20,
        ),
      );

    const {
      where,
    } =
      await this.buildManagedStoreWhere(
        requesterId,
        trimmedSearch,
      );

    const [
      stores,
      total,
    ] =
      await Promise.all([
        this.prisma.store.findMany({
          where,

          orderBy: [
            {
              isActive: 'desc',
            },

            {
              lastActivity: 'desc',
            },

            {
              createdAt: 'desc',
            },
          ],

          skip:
            (safePage - 1) *
            safeLimit,

          take:
            safeLimit,

          select: {
            id: true,
            name: true,
            description: true,
            countryCode: true,
            region: true,
            verified: true,
            verificationType: true,
            regionalManagementLocked: true,
            isActive: true,
            ratingAverage: true,
            ratingCount: true,
            avatarUrl: true,
            bannerUrl: true,
            createdAt: true,
            updatedAt: true,
            lastActivity: true,
            type: true,

            owner: {
              select: {
                id: true,
                email: true,
                name: true,
                username: true,
              },
            },

            _count: {
              select: {
                products: true,
                followers: true,
                posts: true,
              },
            },
          },
        }),

        this.prisma.store.count({
          where,
        }),
      ]);

    return {
      stores,

      page: safePage,

      limit: safeLimit,

      total,

      totalPages:
        Math.ceil(
          total / safeLimit,
        ),
    };
  }

  // =========================================================
  // VISUALIZAR UMA LOJA
  // =========================================================

  async getManagedStore(
    requesterId: string,
    storeId: string,
  ) {
    const {
      where,
    } =
      await this.buildManagedStoreWhere(
        requesterId,
      );

    const store =
      await this.prisma.store.findFirst({
        where: {
          ...where,
          id: storeId,
        },

        select: {
          id: true,
          name: true,
          description: true,

          countryCode: true,
          region: true,

          verified: true,
          verificationType: true,

          regionalManagementLocked: true,

          isActive: true,

          ratingAverage: true,
          ratingCount: true,

          avatarUrl: true,
          bannerUrl: true,

          createdAt: true,
          updatedAt: true,
          lastActivity: true,
          type: true,

          regions: {
            select: {
              id: true,
              region: true,
              createdAt: true,
            },
            orderBy: {
              region: 'asc',
            },
          },

          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              countryCode: true,
              region: true,
            },
          },

          _count: {
            select: {
              products: true,
              followers: true,
              posts: true,
              conversations: true,
            },
          },
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Loja não encontrada ou fora do seu âmbito administrativo.',
      );
    }

    return store;
  }

  // =========================================================
  // ATIVAR LOJA
  // =========================================================

  async activateStore(
    requesterId: string,
    storeId: string,
  ) {
    await this.getManagedStore(
      requesterId,
      storeId,
    );

    return this.prisma.store.update({
      where: {
        id: storeId,
      },

      data: {
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        isActive: true,
        countryCode: true,
        region: true,
      },
    });
  }

  // =========================================================
  // DESATIVAR LOJA
  // =========================================================

  async deactivateStore(
    requesterId: string,
    storeId: string,
  ) {
    await this.getManagedStore(
      requesterId,
      storeId,
    );

    return this.prisma.store.update({
      where: {
        id: storeId,
      },

      data: {
        isActive: false,
      },

      select: {
        id: true,
        name: true,
        isActive: true,
        countryCode: true,
        region: true,
      },
    });
  }

  // =========================================================
  // VERIFICAÇÃO
  // =========================================================
  //
  // REGRAS:
  //
  // BASIC:
  //   pode ser gerida por Admin Regional
  //   quando ele possuir as permissões necessárias.
  //
  // PREMIUM:
  //   aprovação e revogação são exclusivas
  //   do SUPER_ADMIN.
  //
  // REGIONAL ADMIN:
  //   só pode atuar em lojas da própria
  //   região + país.
  //
  // regionalManagementLocked:
  //   somente SUPER_ADMIN pode administrar
  //   esta loja.
  // =========================================================

  private async requireVerificationManager(
    requesterId: string,
  ) {
    const requester =
      await this.requireActiveAdmin(
        requesterId,
      );

    if (
      requester.adminRole ===
      AdminRole.SUPER_ADMIN
    ) {
      return requester;
    }

    if (
      !requester.canManageVerifications
    ) {
      throw new ForbiddenException(
        'Este administrador não possui permissão para gerir verificações.',
      );
    }

    if (!requester.region) {
      throw new BadRequestException(
        'Este administrador não possui uma região definida.',
      );
    }

    return requester;
  }

  // =========================================================
  // CONSTRUIR ESCOPO DE VERIFICAÇÃO
  // =========================================================

  private async buildVerificationStoreWhere(
  requesterId: string,
  query?: string,
) {
  const requester =
    await this.requireVerificationManager(
      requesterId,
    );

  const search =
    query?.trim() ?? '';

  const where: any = {};

  // =======================================================
  // ADMIN REGIONAL
  // =======================================================
  //
  // O Regional só pode trabalhar:
  //
  // - no próprio país;
  // - na própria região;
  // - em lojas que não estejam bloqueadas.
  //
  // IMPORTANTE:
  //
  // NÃO usamos:
  //
  // regions: { none: {} }
  //
  // porque uma StoreRegion não significa
  // necessariamente múltiplas regiões.
  //
  // O bloqueio automático de múltiplas regiões
  // é controlado por regionalManagementLocked.
  // =======================================================

  if (
    requester.adminRole ===
    AdminRole.REGIONAL_ADMIN
  ) {
    where.countryCode =
      requester.user.countryCode;

    where.region =
      requester.region;

    where.regionalManagementLocked =
      false;
  }

  // =======================================================
  // PESQUISA
  // =======================================================

  if (search.length > 0) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  return {
    requester,
    where,
  };
}

  // =========================================================
  // SOLICITAR VERIFICAÇÃO
  //
  // Normalmente chamada pelo dono da loja.
  //
  // Mantemos aqui no AdminService porque
  // a entidade VerificationRequest pertence
  // ao fluxo administrativo.
  // =========================================================


  async requestVerification(
    userId: string,
    storeId: string,
    requestedType: VerificationType,
  ) {
    // =======================================================
    // PROCURAR BANCA
    // =======================================================

    const store =
      await this.prisma.store.findUnique({
        where: {
          id: storeId,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Loja não encontrada.',
      );
    }

    // =======================================================
    // VALIDAR PROPRIETÁRIO
    // =======================================================

    if (store.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não é o proprietário desta loja.',
      );
    }

    // =======================================================
    // VALIDAR ESTADO DA BANCA
    // =======================================================

    if (!store.isActive) {
      throw new BadRequestException(
        'Não é possível solicitar verificação para uma loja inativa.',
      );
    }

    // =======================================================
    // VALIDAR TIPO SOLICITADO
    // =======================================================

    if (
      requestedType !== VerificationType.BASIC &&
      requestedType !== VerificationType.PREMIUM
    ) {
      throw new BadRequestException(
        'Tipo de verificação inválido.',
      );
    }

    // =======================================================
    // PROTEGER A VERIFICAÇÃO PREMIUM
    // =======================================================
    //
    // Uma banca que já possui o tipo PREMIUM
    // não pode solicitar uma verificação BASIC.
    //
    // A subida de BASIC para PREMIUM continua permitida.
    // =======================================================

    if (
      store.verificationType === VerificationType.PREMIUM &&
      requestedType === VerificationType.BASIC
    ) {
      throw new BadRequestException(
        'Uma banca PREMIUM não pode solicitar uma verificação BASIC. A verificação PREMIUM deve ser preservada.',
      );
    }

    // =======================================================
    // IMPEDIR PEDIDO DA VERIFICAÇÃO QUE JÁ POSSUI
    // =======================================================

    if (
      store.verified &&
      store.verificationType === requestedType
    ) {
      throw new BadRequestException(
        `A loja já possui verificação ${requestedType}.`,
      );
    }

    // =======================================================
    // IMPEDIR SOLICITAÇÕES DUPLICADAS
    // =======================================================

    const pending =
      await this.prisma.verificationRequest.findFirst({
        where: {
          storeId,
          status: VerificationRequestStatus.PENDING,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    if (pending) {
      throw new BadRequestException(
        'Esta loja já possui uma solicitação de verificação pendente.',
      );
    }

    // =======================================================
    // CRIAR SOLICITAÇÃO
    // =======================================================

    return this.prisma.verificationRequest.create({
      data: {
        storeId,

        requestedType,

        requestedById: userId,

        status: VerificationRequestStatus.PENDING,
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            verified: true,
            verificationType: true,
            countryCode: true,
            region: true,
          },
        },

        requestedBy: {
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

  // =========================================================
  // LISTAR SOLICITAÇÕES DE VERIFICAÇÃO
  //
  // Super Admin:
  //   todas.
  //
  // Regional:
  //   apenas lojas da sua região/país
  //   e que não estejam bloqueadas.
  // =========================================================

  async listVerificationRequests(
    requesterId: string,
    status?: VerificationRequestStatus,
    query = '',
      type?: VerificationType,
  ) {
    const {
      where: storeWhere,
    } =
      await this.buildVerificationStoreWhere(
        requesterId,
        query,
      );

    const where: any = {
      store: storeWhere,
    };

    if (type === VerificationType.BASIC || type === VerificationType.PREMIUM) {
    where.requestedType = type;
  }

    if (status) {
      where.status = status;
    }

    return this.prisma.verificationRequest.findMany({
      where,

      include: {
        store: {
          select: {
            id: true,
            name: true,
            description: true,
            countryCode: true,
            region: true,
            verified: true,
            verificationType: true,
            regionalManagementLocked: true,
            ratingAverage: true,
            ratingCount: true,
            avatarUrl: true,
            bannerUrl: true,
            type: true,

            regions: {
              select: {
                id: true,
                region: true,
              },
              orderBy: {
                region: 'asc',
              },
            },

            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                countryCode: true,
                region: true,
              },
            },
          },
        },

        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            countryCode: true,
            region: true,
          },
        },

        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },

      orderBy: [
        {
          status: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  // =========================================================
  // BUSCAR UMA SOLICITAÇÃO
  // =========================================================

  async getVerificationRequest(
    requesterId: string,
    requestId: string,
  ) {
    const {
      where: storeWhere,
    } =
      await this.buildVerificationStoreWhere(
        requesterId,
      );

    const request =
      await this.prisma.verificationRequest.findFirst({
        where: {
          id: requestId,

          store: storeWhere,
        },

        include: {
          store: {
            include: {
              regions: {
                orderBy: {
                  region: 'asc',
                },
              },

              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                  countryCode: true,
                  region: true,
                },
              },
            },
          },

          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },

          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Solicitação de verificação não encontrada ou fora do seu âmbito administrativo.',
      );
    }

    return request;
  }

  // =========================================================
  // VERIFICAR SE O ADMIN PODE APROVAR
  // =========================================================

  private async requireVerificationApprover(
    requesterId: string,
    requestedType: VerificationType,
  ) {
    const requester =
      await this.requireVerificationManager(
        requesterId,
      );

    // PREMIUM: somente SUPER_ADMIN.
    if (
      requestedType ===
      VerificationType.PREMIUM &&
      requester.adminRole !==
        AdminRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'A aprovação de verificação PREMIUM é exclusiva do Super Admin.',
      );
    }

    // BASIC:
    // Regional precisa possuir canApproveVerifications.
    if (
      requestedType ===
        VerificationType.BASIC &&
      requester.adminRole ===
        AdminRole.REGIONAL_ADMIN &&
      !requester.canApproveVerifications
    ) {
      throw new ForbiddenException(
        'Este administrador não possui permissão para aprovar verificações BASIC.',
      );
    }

    return requester;
  }

  // =========================================================
  // APROVAR SOLICITAÇÃO
  // =========================================================

 // =========================================================
// APROVAR SOLICITAÇÃO DE VERIFICAÇÃO
//
// NOVO FLUXO:
//
// 1. Valida as permissões administrativas.
// 2. Aprova o pedido.
// 3. Procura o pacote BASIC ou PREMIUM.
// 4. Cria a fatura SitePayment como PENDING.
// 5. Cria o checkout no gateway.
// 6. Não atribui o selo nesta etapa.
//
// O selo só será atribuído depois de o pagamento
// ser confirmado como PAID.
// =========================================================



async approveVerification(
  requesterId: string,
  requestId: string,
) {
  // =========================================
  // PROCURAR SOLICITAÇÃO
  // =========================================

  const request =
    await this.prisma.verificationRequest.findUnique({
      where: {
        id: requestId,
      },

      include: {
        store: {
          include: {
            regions: true,

            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

  if (!request) {
    throw new NotFoundException(
      'Solicitação de verificação não encontrada.',
    );
  }

  // =========================================
  // VALIDAR PERMISSÕES
  // =========================================

  const requester =
    await this.requireVerificationApprover(
      requesterId,
      request.requestedType,
    );

  // =========================================
  // VALIDAR ÂMBITO DO ADMIN REGIONAL
  // =========================================

  if (
    requester.adminRole ===
    AdminRole.REGIONAL_ADMIN
  ) {
    if (request.store.regionalManagementLocked) {
      throw new ForbiddenException(
        'Esta loja só pode ser administrada pelo Super Admin.',
      );
    }

    if (request.store.regions.length > 1) {
      throw new ForbiddenException(
        'Lojas com múltiplas regiões só podem ser administradas pelo Super Admin.',
      );
    }

    if (
      request.store.countryCode
        ?.trim()
        .toUpperCase() !==
        requester.user.countryCode
          ?.trim()
          .toUpperCase() ||
      request.store.region !== requester.region
    ) {
      throw new ForbiddenException(
        'Esta loja está fora do âmbito administrativo deste Regional Admin.',
      );
    }
  }

  // =========================================
  // IMPEDIR REBAIXAMENTO DE PREMIUM PARA BASIC
  // =========================================

  // Esta validação acontece antes da recuperação
  // de uma fatura pendente. Assim, uma fatura BASIC
  // antiga não pode ser recuperada para contornar
  // a proteção de uma banca que já é PREMIUM.

  if (
    request.store.verificationType ===
      VerificationType.PREMIUM &&
    request.requestedType ===
      VerificationType.BASIC
  ) {
    throw new BadRequestException(
      'Uma banca com verificação PREMIUM não pode ser rebaixada para BASIC.',
    );
  }

  // =========================================
  // PROCURAR FATURA PENDENTE EXISTENTE
  // =========================================
  // Permite recuperar uma aprovação anterior
  // sem criar uma segunda fatura.
  // =========================================

  const existingPendingPayment =
    await this.prisma.sitePayment.findFirst({
      where: {
        verificationRequestId: request.id,
        type: PaymentType.VERIFICATION,
        status: PaymentStatus.PENDING,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

  let payment: typeof existingPendingPayment;
  let updatedRequest = request;

  // =========================================
  // RECUPERAR FATURA JÁ EXISTENTE
  // =========================================

  if (existingPendingPayment) {
    if (
      request.status !==
      VerificationRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Existe uma fatura pendente, mas a solicitação não está aprovada. É necessária uma reconciliação administrativa antes de continuar.',
      );
    }

    payment = existingPendingPayment;
  } else {
    // =======================================
    // VALIDAR ESTADO DA SOLICITAÇÃO
    // =======================================

    if (
      request.status !==
      VerificationRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        'Esta solicitação já foi processada e não possui uma fatura pendente recuperável.',
      );
    }

    // =======================================
    // VALIDAR VERIFICAÇÃO ATUAL
    // =======================================

    if (
      request.store.verified &&
      request.store.verificationType ===
        request.requestedType
    ) {
      throw new BadRequestException(
        `A loja já possui verificação ${request.requestedType}.`,
      );
    }

    // =======================================
    // VALIDAR UPGRADE PARA PREMIUM
    // =======================================

    if (
      request.requestedType ===
        VerificationType.PREMIUM &&
      (
        !request.store.verified ||
        request.store.verificationType !==
          VerificationType.BASIC
      )
    ) {
      throw new BadRequestException(
        'A verificação Premium só pode ser aprovada para bancas com verificação Básica ativa.',
      );
    }

    // =======================================
    // PROCURAR PACOTE
    // =======================================

    const verificationPackage =
      await this.prisma.verificationPackage.findUnique({
        where: {
          verificationType: request.requestedType,
        },
      });

    if (!verificationPackage) {
      throw new NotFoundException(
        `Pacote de verificação ${request.requestedType} não encontrado.`,
      );
    }

    if (!verificationPackage.isActive) {
      throw new BadRequestException(
        `O pacote de verificação ${request.requestedType} está inativo.`,
      );
    }

    if (
      !Number.isInteger(verificationPackage.price) ||
      verificationPackage.price <= 0
    ) {
      throw new BadRequestException(
        'O preço do pacote de verificação é inválido.',
      );
    }

    // =======================================
    // APROVAR E CRIAR FATURA ATOMICAMENTE
    // =======================================
    // updateMany com estado PENDING impede que
    // duas aprovações concorrentes criem faturas
    // para a mesma solicitação.
    // =======================================

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          // Revalidar o tipo atual da banca dentro
          // da transação para evitar usar apenas
          // os dados obtidos antes da transação.

          const currentStore =
            await tx.store.findUnique({
              where: {
                id: request.storeId,
              },
              select: {
                verified: true,
                verificationType: true,
              },
            });

          if (!currentStore) {
            throw new NotFoundException(
              'A banca da solicitação não foi encontrada.',
            );
          }

          if (
            currentStore.verificationType ===
              VerificationType.PREMIUM &&
            request.requestedType ===
              VerificationType.BASIC
          ) {
            throw new BadRequestException(
              'Uma banca com verificação PREMIUM não pode ser rebaixada para BASIC.',
            );
          }

          if (
            currentStore.verified &&
            currentStore.verificationType ===
              request.requestedType
          ) {
            throw new BadRequestException(
              `A loja já possui verificação ${request.requestedType}.`,
            );
          }

          if (
            request.requestedType ===
              VerificationType.PREMIUM &&
            (
              !currentStore.verified ||
              currentStore.verificationType !==
                VerificationType.BASIC
            )
          ) {
            throw new BadRequestException(
              'A verificação Premium só pode ser aprovada para bancas com verificação Básica ativa.',
            );
          }

          const approval =
            await tx.verificationRequest.updateMany({
              where: {
                id: request.id,
                status:
                  VerificationRequestStatus.PENDING,
              },

              data: {
                status:
                  VerificationRequestStatus.APPROVED,
                reviewedById: requester.userId,
                reviewedAt: new Date(),
                rejectionReason: null,
              },
            });

          if (approval.count !== 1) {
            throw new BadRequestException(
              'A solicitação foi processada por outra operação. Atualiza os dados e verifica se já existe uma fatura.',
            );
          }

          const createdPayment =
            await tx.sitePayment.create({
              data: {
                userId: request.requestedById,
                storeId: request.storeId,
                type: PaymentType.VERIFICATION,
                status: PaymentStatus.PENDING,
                amount: verificationPackage.price,
                currency: 'MZN',

                description:
                  `Pagamento de verificação ${request.requestedType} da loja ${request.store.name}`,

                verificationRequestId: request.id,

                metadata: {
                  verificationType:
                    request.requestedType,
                  packageId:
                    verificationPackage.id,
                  packagePrice:
                    verificationPackage.price,
                  approvedById:
                    requester.userId,
                },
              },
            });

          const approvedRequest =
            await tx.verificationRequest.findUniqueOrThrow({
              where: {
                id: request.id,
              },
            });

          return {
            request: approvedRequest,
            payment: createdPayment,
          };
        },
      );

    updatedRequest = {
      ...request,
      ...result.request,
    };

    payment = result.payment;
  }

  if (!payment) {
    throw new BadRequestException(
      'Não foi possível obter a fatura da solicitação.',
    );
  }

  // =========================================
  // CRIAR OU RECUPERAR CHECKOUT
  // =========================================
  // Não marcar a fatura como FAILED nem reverter
  // a aprovação em caso de falha externa.
  // O mesmo paymentId deve ser usado como chave
  // idempotente pelo gateway, quando suportado.
  // =========================================

  let checkout;

  try {
    checkout =
      await this.paymentGatewayService.createCheckout({
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,

        description:
          payment.description ?? undefined,

        customerName:
          request.store.owner.name ?? undefined,

        customerEmail:
          request.store.owner.email,

        metadata: {
          paymentType: PaymentType.VERIFICATION,
          verificationRequestId: request.id,
          storeId: request.storeId,
          verificationType: request.requestedType,
        },
      });
  } catch {
    throw new BadRequestException(
      'Não foi possível confirmar a criação ou recuperação do checkout. A solicitação continua aprovada e a fatura pendente para permitir uma tentativa de recuperação. Verifica o estado do pagamento no gateway antes de iniciar um novo checkout.',
    );
  }

  // =========================================
  // VALIDAR RESPOSTA DO GATEWAY
  // =========================================

  const checkoutReference =
    checkout.reference?.trim();

  const checkoutProvider =
    checkout.provider?.trim().toUpperCase();

  if (!checkoutReference || !checkoutProvider) {
    throw new BadRequestException(
      'O gateway não devolveu uma referência e um provedor válidos. A fatura foi preservada para reconciliação.',
    );
  }

  // =========================================
  // GUARDAR REFERÊNCIA E PROVEDOR
  // =========================================
  // Se esta gravação falhar, não reverter a
  // solicitação nem marcar a fatura como falhada:
  // o checkout externo pode já existir.
  // =========================================

  let paymentWithCheckout;

  try {
    paymentWithCheckout =
      await this.prisma.sitePayment.update({
        where: {
          id: payment.id,
        },

        data: {
          reference: checkoutReference,
          provider: checkoutProvider,
        },
      });
  } catch {
    throw new BadRequestException(
      'O checkout pode ter sido criado, mas não foi possível guardar a referência. Não cries outra fatura. Recupera ou reconcilia o checkout usando o identificador do pagamento: ' +
        payment.id,
    );
  }

  // =========================================
  // RESPOSTA FINAL
  // =========================================

  return {
    message:
      'Solicitação aprovada. A fatura de verificação está pendente de pagamento.',

    request: updatedRequest,

    payment: paymentWithCheckout,

    checkout: {
      provider: checkout.provider,
      reference: checkoutReference,
      checkoutUrl: checkout.checkoutUrl ?? null,
      instructions: checkout.instructions ?? null,
      status: checkout.status,
    },

    store: {
      id: request.store.id,
      name: request.store.name,
      verified: request.store.verified,
      verificationType:
        request.store.verificationType,
    },
  };
}


  // =========================================================
  // REJEITAR SOLICITAÇÃO
  // =========================================================

  async rejectVerification(
    requesterId: string,
    requestId: string,
    rejectionReason?: string,
  ) {
    const request =
      await this.prisma.verificationRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          store: {
            include: {
              regions: true,
            },
          },
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Solicitação de verificação não encontrada.',
      );
    }

    const requester =
      await this.requireVerificationApprover(
        requesterId,
        request.requestedType,
      );

    // -------------------------------------------------------
    // ESCOPO REGIONAL
    // -------------------------------------------------------

    if (
      requester.adminRole ===
      AdminRole.REGIONAL_ADMIN
    ) {
      if (
        request.store.regionalManagementLocked
      ) {
        throw new ForbiddenException(
          'Esta loja só pode ser administrada pelo Super Admin.',
        );
      }

      if (
  request.store.regions.length > 1
) {
  throw new ForbiddenException(
    'Lojas com múltiplas regiões só podem ser administradas pelo Super Admin.',
  );
}

      if (
        request.store.countryCode !==
        requester.user.countryCode ||
        request.store.region !==
        requester.region
      ) {
        throw new ForbiddenException(
          'Esta loja está fora do âmbito administrativo deste Regional Admin.',
        );
      }
    }

    if (
      request.status !==
      VerificationRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        'Esta solicitação já foi processada.',
      );
    }

    const reason =
      rejectionReason?.trim() ?? '';

    if (reason.length > 500) {
      throw new BadRequestException(
        'O motivo da rejeição pode ter no máximo 500 caracteres.',
      );
    }

    return this.prisma.verificationRequest.update({
      where: {
        id: request.id,
      },

      data: {
        status:
          VerificationRequestStatus.REJECTED,

        reviewedById:
          requester.userId,

        reviewedAt:
          new Date(),

        rejectionReason:
          reason || null,
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            verified: true,
            verificationType: true,
          },
        },

        reviewedBy: {
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

  // =========================================================
  // CANCELAR SOLICITAÇÃO
  //
  // Somente o dono da loja pode cancelar
  // a própria solicitação.
  // =========================================================

  async cancelVerificationRequest(
    userId: string,
    requestId: string,
  ) {
    const request =
      await this.prisma.verificationRequest.findUnique({
        where: {
          id: requestId,
        },

        include: {
          store: true,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Solicitação de verificação não encontrada.',
      );
    }

    if (
      request.store.ownerId !==
      userId
    ) {
      throw new ForbiddenException(
        'Você não é o proprietário desta loja.',
      );
    }

    if (
      request.status !==
      VerificationRequestStatus.PENDING
    ) {
      throw new BadRequestException(
        'Somente solicitações pendentes podem ser canceladas.',
      );
    }

    return this.prisma.verificationRequest.update({
      where: {
        id: request.id,
      },

      data: {
        status:
          VerificationRequestStatus.CANCELLED,

        reviewedById:
          null,

        reviewedAt:
          null,
      },
    });
  }

  // =========================================================
  // REVOGAR VERIFICAÇÃO
  //
  // BASIC:
  //   Regional Admin autorizado pode revogar
  //   dentro da própria região.
  //
  // PREMIUM:
  //   somente Super Admin.
  //
  // IMPORTANTE:
  // ao revogar, a loja deixa de estar
  // verificada.
  // =========================================================

  async revokeVerification(
    requesterId: string,
    storeId: string,
    reason?: string,
  ) {
    const requester =
      await this.requireVerificationManager(
        requesterId,
      );

    const store =
      await this.prisma.store.findUnique({
        where: {
          id: storeId,
        },

        include: {
          regions: true,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Loja não encontrada.',
      );
    }

    if (!store.verified) {
  throw new BadRequestException(
    'Esta loja não possui uma verificação ativa.',
  );
}

const revokedVerificationType =
  store.verificationType;

    // -------------------------------------------------------
    // PREMIUM
    // -------------------------------------------------------

    if (
      store.verificationType ===
        VerificationType.PREMIUM &&
      requester.adminRole !==
        AdminRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Somente o Super Admin pode revogar uma verificação PREMIUM.',
      );
    }

    // -------------------------------------------------------
    // REGIONAL
    // -------------------------------------------------------

    if (
      requester.adminRole ===
      AdminRole.REGIONAL_ADMIN
    ) {
      if (
        !requester.canRevokeVerifications
      ) {
        throw new ForbiddenException(
          'Este administrador não possui permissão para revogar verificações.',
        );
      }

      if (
        store.regionalManagementLocked
      ) {
        throw new ForbiddenException(
          'Esta loja só pode ser administrada pelo Super Admin.',
        );
      }

      if (
  store.regions.length > 1
) {
  throw new ForbiddenException(
    'Lojas com múltiplas regiões só podem ser administradas pelo Super Admin.',
  );
}

      if (
        store.countryCode !==
        requester.user.countryCode ||
        store.region !==
        requester.region
      ) {
        throw new ForbiddenException(
          'Esta loja está fora do âmbito administrativo deste Regional Admin.',
        );
      }
    }

    const trimmedReason =
      reason?.trim() ?? '';

    if (trimmedReason.length > 500) {
      throw new BadRequestException(
        'O motivo da revogação pode ter no máximo 500 caracteres.',
      );
    }

    // -------------------------------------------------------
    // REVOGAR
    // -------------------------------------------------------

    return this.prisma.$transaction(
      async (tx) => {
        await tx.store.update({
          where: {
            id: store.id,
          },

          data: {
            verified: false,

            verificationType:
              null,
          },
        });

        // ---------------------------------------------------
        // REGISTAR A REVOGAÇÃO
        //
        // O schema atual não possui um campo
        // específico de "revoked".
        //
        // Por isso não criamos uma nova coluna.
        //
        // Guardamos o histórico através de uma
        // VerificationRequest REJECTED.
        // ---------------------------------------------------

        const history =
          await tx.verificationRequest.create({
            data: {
              storeId:
                store.id,

              requestedType:
  revokedVerificationType!,

              status:
                VerificationRequestStatus.REJECTED,

              requestedById:
                store.ownerId,

              reviewedById:
                requester.userId,

              rejectionReason:
                trimmedReason ||
                'Verificação revogada pelo administrador.',

              reviewedAt:
                new Date(),
            },
          });

        return {
          success: true,

          message:
            'Verificação revogada com sucesso.',

          store: {
            id: store.id,
            name: store.name,
            verified: false,
            verificationType: null,
          },

          history,
        };
      },
    );
  }

  // =========================================================
  // SOLICITAÇÕES DO DONO DA LOJA
  // =========================================================

  async listMyVerificationRequests(
    userId: string,
    storeId?: string,
  ) {
    const where: any = {
      requestedById: userId,
    };

    if (storeId) {
      where.storeId =
        storeId;
    }

    return this.prisma.verificationRequest.findMany({
      where,

      include: {
        store: {
          select: {
            id: true,
            name: true,
            verified: true,
            verificationType: true,
            countryCode: true,
            region: true,
          },
        },

        reviewedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // REGIÕES DA LOJA
  // =========================================================
  //
  // Somente SUPER_ADMIN pode alterar.
  //
  // Se uma loja tiver mais de uma região,
  // ela fica automaticamente bloqueada
  // para Regional Admin.
  // =========================================================

  async addStoreRegion(
    requesterId: string,
    storeId: string,
    region: string,
  ) {
    await this.requireSuperAdmin(
      requesterId,
    );

    const normalizedRegion =
      region?.trim() ?? '';

    if (!normalizedRegion) {
      throw new BadRequestException(
        'A região é obrigatória.',
      );
    }

    const store =
      await this.prisma.store.findUnique({
        where: {
          id: storeId,
        },

        include: {
          regions: true,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Loja não encontrada.',
      );
    }

    const existing =
      store.regions.some(
        item =>
          item.region.toLowerCase() ===
          normalizedRegion.toLowerCase(),
      );

    if (existing) {
      throw new BadRequestException(
        'Esta região já está associada à loja.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.storeRegion.create({
          data: {
            storeId:
              store.id,

            region:
              normalizedRegion,
          },
        });

        const regionCount =
          await tx.storeRegion.count({
            where: {
              storeId:
                store.id,
            },
          });

        const locked =
          regionCount > 1;

        return tx.store.update({
          where: {
            id:
              store.id,
          },

          data: {
            regionalManagementLocked:
              locked,
          },

          select: {
            id: true,
            name: true,
            regionalManagementLocked:
              true,

            regions: {
              select: {
                id: true,
                region: true,
                createdAt: true,
              },

              orderBy: {
                region: 'asc',
              },
            },
          },
        });
      },
    );
  }

  // =========================================================
  // REMOVER REGIÃO DA LOJA
  // =========================================================

  async removeStoreRegion(
    requesterId: string,
    storeId: string,
    regionId: string,
  ) {
    await this.requireSuperAdmin(
      requesterId,
    );

    const store =
      await this.prisma.store.findUnique({
        where: {
          id: storeId,
        },

        include: {
          regions: true,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Loja não encontrada.',
      );
    }

    const region =
      store.regions.find(
        item =>
          item.id ===
          regionId,
      );

    if (!region) {
      throw new NotFoundException(
        'Região da loja não encontrada.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.storeRegion.delete({
          where: {
            id:
              regionId,
          },
        });

        const regionCount =
          await tx.storeRegion.count({
            where: {
              storeId:
                store.id,
            },
          });

        // Se ficou com zero ou uma região,
        // deixa de ser automaticamente bloqueada.
        const locked =
          regionCount > 1;

        return tx.store.update({
          where: {
            id:
              store.id,
          },

          data: {
            regionalManagementLocked:
              locked,
          },

          select: {
            id: true,
            name: true,
            regionalManagementLocked:
              true,

            regions: {
              select: {
                id: true,
                region: true,
                createdAt: true,
              },

              orderBy: {
                region: 'asc',
              },
            },
          },
        });
      },
    );
  }

  // =========================================================
  // BLOQUEAR/DESBLOQUEAR GESTÃO REGIONAL
  //
  // Somente SUPER_ADMIN.
  //
  // Útil quando o Super Admin quiser bloquear
  // uma loja mesmo tendo apenas uma região.
  // =========================================================

  async setStoreRegionalManagementLock(
    requesterId: string,
    storeId: string,
    locked: boolean,
  ) {
    await this.requireSuperAdmin(
      requesterId,
    );

    const store =
      await this.prisma.store.findUnique({
        where: {
          id: storeId,
        },
      });

    if (!store) {
      throw new NotFoundException(
        'Loja não encontrada.',
      );
    }

    return this.prisma.store.update({
      where: {
        id: storeId,
      },

      data: {
        regionalManagementLocked:
          locked,
      },

      select: {
        id: true,
        name: true,
        regionalManagementLocked:
          true,
        countryCode: true,
        region: true,
        verified: true,
        verificationType: true,
      },
    });
  }


  // =========================================================
  // =========================================================
  // RANKING NACIONAL
  // =========================================================
  // =========================================================

  // =========================================================
  // VERIFICAR QUEM PODE GERIR O RANKING
  //
  // SUPER_ADMIN:
  //   pode gerir qualquer país.
  //
  // REGIONAL_ADMIN:
  //   precisa possuir canManageRanking
  //   e só pode gerir o próprio país.
  // =========================================================

 private async requireRankingManager(
  requesterId: string,
) {
  const requester =
    await this.requireActiveAdmin(
      requesterId,
    );

  // =========================================
  // SUPER ADMIN
  // =========================================

  if (
    requester.adminRole ===
    AdminRole.SUPER_ADMIN
  ) {
    return requester;
  }

  // =========================================
  // REGIONAL ADMIN
  // =========================================

  if (
    requester.adminRole !==
    AdminRole.REGIONAL_ADMIN
  ) {
    throw new ForbiddenException(
      'Este administrador não possui permissão para gerir o ranking nacional.',
    );
  }

  if (
    !requester.canManageRanking
  ) {
    throw new ForbiddenException(
      'Este administrador não possui permissão para gerir o ranking nacional.',
    );
  }

  // =========================================
  // ADMIN REGIONAL PRECISA TER PAÍS
  // =========================================

  if (
    !requester.user?.countryCode
  ) {
    throw new BadRequestException(
      'Este administrador não possui um país definido.',
    );
  }

  return requester;
}

  // =========================================================
  // VALIDAR PAÍS DO RANKING
  // =========================================================

private async validateRankingCountry(
  requesterId: string,
  countryCode: string,
) {
  const requester =
    await this.requireRankingManager(
      requesterId,
    );

  const normalizedCountry =
    countryCode?.trim().toUpperCase();

  if (!normalizedCountry) {
    throw new BadRequestException(
      'O país do ranking é obrigatório.',
    );
  }

  if (
    requester.adminRole ===
      AdminRole.REGIONAL_ADMIN &&
    requester.user?.countryCode
      ?.trim()
      .toUpperCase() !==
      normalizedCountry
  ) {
    throw new ForbiddenException(
      'Um Admin Regional só pode gerir o ranking nacional do próprio país.',
    );
  }

  return {
    requester,
    countryCode:
      normalizedCountry,
  };
}

  // =========================================================
  // VALIDAR POSIÇÃO
  //
  // O ranking nacional possui EXATAMENTE
  // 10 posições possíveis.
  // =========================================================

  private validateNationalRankingPosition(
    position: number,
  ): number {
    const normalizedPosition =
      Number(position);

    if (
      !Number.isInteger(
        normalizedPosition,
      ) ||
      normalizedPosition < 1 ||
      normalizedPosition > 10
    ) {
      throw new BadRequestException(
        'A posição do ranking deve ser um número inteiro entre 1 e 10.',
      );
    }

    return normalizedPosition;
  }

  // =========================================================
  // PESQUISAR BANCAS PREMIUM ELEGÍVEIS
  // =========================================================

  async searchNationalRankingStores(
    requesterId: string,
    countryCode: string,
    query = '',
  ) {
    const {
      countryCode:
        normalizedCountry,
    } =
      await this.validateRankingCountry(
        requesterId,
        countryCode,
      );

    const search =
      query?.trim() ?? '';

    if (search.length < 2) {
      return [];
    }

    return this.prisma.store.findMany({
      where: {
        countryCode:
          normalizedCountry,

        isActive: true,

        verified: true,

        verificationType:
          VerificationType.PREMIUM,

        name: {
          contains: search,
          mode: 'insensitive',
        },
      },

      select: {
        id: true,
        name: true,
        countryCode: true,
        region: true,

        verified: true,
        verificationType: true,

        avatarUrl: true,
        bannerUrl: true,

        ratingAverage: true,
        ratingCount: true,

        owner: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },

        nationalRankingPositions: {
          where: {
            countryCode:
              normalizedCountry,
          },

          select: {
            id: true,
            position: true,
          },

          take: 1,
        },
      },

      orderBy: [
        {
          name: 'asc',
        },
      ],

      take: 30,
    });
  }

  // =========================================================
  // LISTAR RANKING NACIONAL
  //
  // Retorna todas as posições que já foram configuradas.
  //
  // O frontend continua podendo preencher as posições
  // inexistentes como "Posição disponível".
  //
  // Também retorna o leilão associado à posição.
  // =========================================================

  async listNationalRanking(
    requesterId: string,
    countryCode: string,
  ) {
    const {
      countryCode:
        normalizedCountry,
    } =
      await this.validateRankingCountry(
        requesterId,
        countryCode,
      );

    return this.prisma.nationalRankingPosition.findMany({
      where: {
        countryCode:
          normalizedCountry,
      },

      orderBy: {
        position: 'asc',
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            region: true,

            verified: true,
            verificationType: true,

            avatarUrl: true,
            bannerUrl: true,

            ratingAverage: true,
            ratingCount: true,
          },
        },

        // =====================================================
        // LEILÃO FIXO DA POSIÇÃO
        // =====================================================

        auction: {
  select: {
    id: true,
    countryCode: true,
    position: true,
    name: true,
    imageUrl: true,
    startPrice: true,
    currentBid: true,
    minimumIncrement: true,
    reservePrice: true,
    startsAt: true,
    endsAt: true,
    closed: true,
    closedAt: true,
    finalPrice: true,
    winnerStoreId: true,
  },
},

        assignedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
  }


// =========================================
// ATRIBUIR LOJA AO RANKING NACIONAL
// =========================================

// =========================================
// ATRIBUIR LOJA AO RANKING NACIONAL
// =========================================


async assignNationalRankingPosition(
  requesterId: string,
  countryCode: string,
  storeId: string,
  position: number,
) {
  // =========================================
  // VALIDAR ADMINISTRADOR
  // =========================================

  const requester =
    await this.requireRankingManager(
      requesterId,
    );

  const {
    countryCode: country,
  } = await this.validateRankingCountry(
    requesterId,
    countryCode,
  );

  // =========================================
  // VALIDAR NÚMERO DA POSIÇÃO
  // =========================================

  if (
    !Number.isInteger(position) ||
    position < 1 ||
    position > 10
  ) {
    throw new BadRequestException(
      'A posição do ranking deve estar entre 1 e 10.',
    );
  }

  // =========================================
  // VALIDAR PAÍS DO ADMINISTRADOR REGIONAL
  // =========================================

  if (
    requester.adminRole ===
      AdminRole.REGIONAL_ADMIN &&
    requester.user.countryCode
      ?.trim()
      .toUpperCase() !== country
  ) {
    throw new ForbiddenException(
      'Este administrador só pode gerir o ranking do próprio país.',
    );
  }

  // =========================================
  // VALIDAR BANCA
  // =========================================

  const store =
    await this.prisma.store.findUnique({
      where: {
        id: storeId,
      },
    });

  if (!store) {
    throw new NotFoundException(
      'Banca não encontrada.',
    );
  }

  if (!store.isActive) {
    throw new BadRequestException(
      'Esta banca está inativa.',
    );
  }

  if (!store.verified) {
    throw new BadRequestException(
      'A banca precisa estar verificada para entrar no Ranking Nacional.',
    );
  }

  if (
    store.verificationType !==
    VerificationType.PREMIUM
  ) {
    throw new BadRequestException(
      'A banca precisa possuir verificação PREMIUM para entrar no Ranking Nacional.',
    );
  }

  if (
    store.countryCode
      ?.trim()
      .toUpperCase() !== country
  ) {
    throw new BadRequestException(
      'A banca pertence a outro país.',
    );
  }

  // =========================================
  // TRANSAÇÃO
  // =========================================
  // Primeiro consultamos e validamos TODAS
  // as posições envolvidas. Só depois fazemos
  // qualquer alteração.
  // =========================================

  return this.prisma.$transaction(
    async (tx) => {
      // ---------------------------------------
      // POSIÇÃO DE DESTINO
      // ---------------------------------------

      const targetPosition =
        await tx.nationalRankingPosition.findUnique({
          where: {
            countryCode_position: {
              countryCode: country,
              position,
            },
          },

          include: {
            assignedBy: {
              select: {
                id: true,
                name: true,
              },
            },

            store: {
              select: {
                id: true,
                name: true,
              },
            },

            auction: true,
          },
        });

      // ---------------------------------------
      // POSIÇÃO ATUAL DA BANCA
      // ---------------------------------------

      const existingStorePosition =
        await tx.nationalRankingPosition.findFirst({
          where: {
            countryCode: country,
            storeId,
          },
        });

      // ---------------------------------------
      // VALIDAR PROTEÇÃO DAS POSIÇÕES
      // ---------------------------------------
      // Um Admin Regional não pode alterar
      // uma posição atribuída pelo Super Admin.
      // Verificamos tanto o destino como a
      // posição antiga da banca antes de escrever.
      // ---------------------------------------

      const assertRegionalCanModifyPosition =
        async (
          assignedById: string | null,
        ): Promise<void> => {
          if (
            requester.adminRole !==
            AdminRole.REGIONAL_ADMIN
          ) {
            return;
          }

          if (!assignedById) {
            return;
          }

          const assigningAdmin =
            await tx.adminProfile.findUnique({
              where: {
                userId: assignedById,
              },

              select: {
                adminRole: true,
              },
            });

          if (
            assigningAdmin?.adminRole ===
            AdminRole.SUPER_ADMIN
          ) {
            throw new ForbiddenException(
              'Esta posição foi definida pelo SUPER_ADMIN e não pode ser alterada por um administrador regional.',
            );
          }
        };

      // A posição de destino deve ser validada
      // mesmo quando ainda não tem banca.
      if (targetPosition) {
        await assertRegionalCanModifyPosition(
          targetPosition.assignedById,
        );
      }

      // Se a banca vai mudar de posição, também
      // é necessário validar a posição antiga.
      if (
        existingStorePosition &&
        existingStorePosition.id !==
          targetPosition?.id
      ) {
        await assertRegionalCanModifyPosition(
          existingStorePosition.assignedById,
        );
      }

      // =======================================
      // SÓ AGORA COMEÇAM AS ALTERAÇÕES
      // =======================================

      // ---------------------------------------
      // LIBERTAR A POSIÇÃO DE DESTINO
      // SE ESTIVER OCUPADA POR OUTRA BANCA
      // ---------------------------------------

      if (
        targetPosition &&
        targetPosition.storeId &&
        targetPosition.storeId !== storeId
      ) {
        await tx.nationalRankingPosition.update({
          where: {
            id: targetPosition.id,
          },

          data: {
            storeId: null,
          },
        });
      }

      // ---------------------------------------
      // LIBERTAR A POSIÇÃO ANTIGA DA BANCA
      // ---------------------------------------
      // O leilão continua associado à posição.
      // ---------------------------------------

      if (
        existingStorePosition &&
        existingStorePosition.id !==
          targetPosition?.id
      ) {
        await tx.nationalRankingPosition.update({
          where: {
            id: existingStorePosition.id,
          },

          data: {
            storeId: null,
          },
        });
      }

      // ---------------------------------------
      // A POSIÇÃO DE DESTINO JÁ EXISTE
      // ---------------------------------------

      if (targetPosition) {
        return tx.nationalRankingPosition.update({
          where: {
            id: targetPosition.id,
          },

          data: {
            storeId,
            assignedById: requester.userId,
          },

          include: {
            store: true,

            assignedBy: {
              select: {
                id: true,
                name: true,
              },
            },

            auction: true,
          },
        });
      }

      // ---------------------------------------
      // A POSIÇÃO DE DESTINO AINDA NÃO EXISTE
      // ---------------------------------------

      return tx.nationalRankingPosition.create({
        data: {
          countryCode: country,
          position,
          storeId,
          assignedById: requester.userId,
        },

        include: {
          store: true,

          assignedBy: {
            select: {
              id: true,
              name: true,
            },
          },

          auction: true,
        },
      });
    },
  );
}


private async isAssignedBySuperAdmin(userId: string) {
  const profile = await this.prisma.adminProfile.findUnique({
    where: { userId },
    select: { adminRole: true },
  });

  return profile?.adminRole === AdminRole.SUPER_ADMIN;
}


// =========================================
// REMOVER LOJA DO RANKING NACIONAL
// =========================================

async removeNationalRankingPosition(
  requesterId: string,
  countryCode: string,
  position: number,
) {
  const requester =
    await this.requireRankingManager(
      requesterId,
    );

  const {
  countryCode: country,
} =
  await this.validateRankingCountry(
    requesterId,
    countryCode,
  );

  if (
    !Number.isInteger(position) ||
    position < 1 ||
    position > 10
  ) {
    throw new BadRequestException(
      'A posição do ranking deve estar entre 1 e 10.',
    );
  }

  // =========================================
  // REGIONAL ADMIN
  // =========================================

  if (
    requester.adminRole ===
      AdminRole.REGIONAL_ADMIN &&
    requester.user.countryCode.toUpperCase() !==
      country
  ) {
    throw new ForbiddenException(
      'Este administrador só pode gerir o ranking do próprio país.',
    );
  }

  // =========================================
  // BUSCAR POSIÇÃO
  // =========================================

  const rankingPosition =
    await this.prisma
      .nationalRankingPosition
      .findUnique({
        where: {
          countryCode_position: {
            countryCode: country,
            position,
          },
        },

        include: {
          auction: true,

          assignedBy: {
            select: {
              id: true,
              name: true,
            },
          },

          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

  if (!rankingPosition) {
    throw new NotFoundException(
      'Posição do ranking não encontrada.',
    );
  }

  // =========================================
  // REGIONAL ADMIN NÃO PODE REMOVER
  // POSIÇÃO DEFINIDA PELO SUPER ADMIN
  // =========================================

  if (
    requester.adminRole ===
    AdminRole.REGIONAL_ADMIN
  ) {
    const assignedByProfile =
      await this.prisma.adminProfile.findUnique({
        where: {
          userId:
            rankingPosition.assignedById,
        },

        select: {
          adminRole: true,
        },
      });

    if (
      assignedByProfile?.adminRole ===
      AdminRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Esta posição foi definida pelo SUPER_ADMIN e não pode ser removida por um administrador regional.',
      );
    }
  }

  // =========================================
  // REMOVER BANCA
  //
  // NÃO apagar a posição.
  // NÃO apagar o leilão.
  // =========================================

  return this.prisma
    .nationalRankingPosition
    .update({
      where: {
        id:
          rankingPosition.id,
      },

      data: {
        storeId: null,

        assignedById:
          requester.userId,
      },

      include: {
        store: true,

        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },

        auction: true,
      },
    });
}

  // =========================================================
  // ASSOCIAR LEILÃO FIXO À POSIÇÃO
  //
  // Cada posição pode ter UM único leilão.
  //
  // O mesmo leilão NÃO pode ser usado em duas posições.
  //
  // IMPORTANTE:
  //
  // O leilão não precisa pertencer à banca participante.
  //
  // O leilão é associado à POSIÇÃO do ranking.
  // =========================================================

  // =========================================================
// ASSOCIAR LEILÃO FIXO À POSIÇÃO
//
// Cada posição pode ter UM único leilão.
//
// O leilão NÃO é um Product.
//
// O leilão representa diretamente o direito de disputar
// aquela posição do ranking nacional.
//
// Exemplo:
//
// posição 1
//    ↓
// NationalRankingAuction
//    ├── name
//    ├── imageUrl
//    ├── startPrice
//    ├── minimumIncrement
//    ├── reservePrice
//    ├── startsAt
//    └── endsAt
//
// =========================================================


async setNationalRankingAuction(
  requesterId: string,
  countryCode: string,
  position: number,
  auctionData: SetNationalRankingAuctionData,
) {
  // =========================================
  // VALIDAR ADMINISTRADOR E PAÍS
  // =========================================

  const {
    countryCode: normalizedCountry,
    requester,
  } = await this.validateRankingCountry(
    requesterId,
    countryCode,
  );

  // =========================================
  // VALIDAR POSIÇÃO
  // =========================================

  const normalizedPosition =
    this.validateNationalRankingPosition(
      position,
    );

  // =========================================
  // VALIDAR NOME
  // =========================================

  const normalizedName =
    auctionData.name?.trim();

  if (!normalizedName) {
    throw new BadRequestException(
      'O nome do leilão é obrigatório.',
    );
  }

  // =========================================
  // VALIDAR PREÇO INICIAL
  // =========================================

  if (
    typeof auctionData.startPrice !== 'number' ||
    !Number.isFinite(auctionData.startPrice) ||
    auctionData.startPrice < 0
  ) {
    throw new BadRequestException(
      'O preço inicial do leilão é inválido.',
    );
  }

  // =========================================
  // VALIDAR LANCE ATUAL
  // =========================================

  if (
    auctionData.currentBid !== undefined &&
    (
      typeof auctionData.currentBid !== 'number' ||
      !Number.isFinite(auctionData.currentBid) ||
      auctionData.currentBid < auctionData.startPrice
    )
  ) {
    throw new BadRequestException(
      'O lance atual não pode ser inferior ao preço inicial.',
    );
  }

  // =========================================
  // VALIDAR INCREMENTO MÍNIMO
  // =========================================

  if (
    auctionData.minimumIncrement !== undefined &&
    (
      typeof auctionData.minimumIncrement !== 'number' ||
      !Number.isFinite(auctionData.minimumIncrement) ||
      auctionData.minimumIncrement <= 0
    )
  ) {
    throw new BadRequestException(
      'O incremento mínimo do leilão é inválido.',
    );
  }

  // =========================================
  // VALIDAR PREÇO DE RESERVA
  // =========================================

  if (
    auctionData.reservePrice !== undefined &&
    (
      typeof auctionData.reservePrice !== 'number' ||
      !Number.isFinite(auctionData.reservePrice) ||
      auctionData.reservePrice < auctionData.startPrice
    )
  ) {
    throw new BadRequestException(
      'O preço de reserva não pode ser inferior ao preço inicial.',
    );
  }

  // =========================================
  // VALIDAR DATAS
  // =========================================

  const startsAt = new Date(auctionData.startsAt);
  const endsAt = new Date(auctionData.endsAt);

  if (Number.isNaN(startsAt.getTime())) {
    throw new BadRequestException(
      'A data de início do leilão é inválida.',
    );
  }

  if (Number.isNaN(endsAt.getTime())) {
    throw new BadRequestException(
      'A data de término do leilão é inválida.',
    );
  }

  if (endsAt <= startsAt) {
    throw new BadRequestException(
      'A data de término deve ser posterior à data de início.',
    );
  }

  if (
    auctionData.currentBid !== undefined &&
    auctionData.currentBid < auctionData.startPrice
  ) {
    throw new BadRequestException(
      'O lance atual não pode ser inferior ao preço inicial.',
    );
  }

  // =========================================
  // PREPARAR DADOS DO LEILÃO
  // =========================================

  const auctionFields = {
    name: normalizedName,
    imageUrl: auctionData.imageUrl?.trim() || null,
    startPrice: auctionData.startPrice,
    currentBid: auctionData.currentBid ?? null,
    minimumIncrement:
      auctionData.minimumIncrement ?? null,
    reservePrice: auctionData.reservePrice ?? null,
    startsAt,
    endsAt,
  };

  // =========================================
  // TRANSAÇÃO
  // =========================================

  return this.prisma.$transaction(
    async (tx) => {
      // ---------------------------------------
      // PROCURAR POSIÇÃO E LEILÃO EXISTENTES
      // ---------------------------------------

      const ranking =
        await tx.nationalRankingPosition.findUnique({
          where: {
            countryCode_position: {
              countryCode: normalizedCountry,
              position: normalizedPosition,
            },
          },

          include: {
            auction: true,

            assignedBy: {
              select: {
                id: true,
                name: true,
                username: true,

                adminProfile: {
                  select: {
                    adminRole: true,
                  },
                },
              },
            },
          },
        });

      // ---------------------------------------
      // REGRA DO ADMINISTRADOR REGIONAL
      // ---------------------------------------

      if (
        ranking &&
        requester.adminRole === AdminRole.REGIONAL_ADMIN &&
        ranking.assignedBy.adminProfile?.adminRole ===
          AdminRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'Um Admin Regional não pode alterar o leilão de uma posição definida pelo SUPER_ADMIN.',
        );
      }

      // ---------------------------------------
      // PROTEGER O HISTÓRICO
      // ---------------------------------------
      // Nunca reiniciar ou sobrescrever o resultado
      // de um leilão encerrado ou com resultado final.
      // ---------------------------------------

      const existingAuction = ranking?.auction;

      if (
        existingAuction &&
        (
          existingAuction.closed ||
          existingAuction.closedAt !== null ||
          existingAuction.finalPrice !== null ||
          existingAuction.winnerStoreId !== null
        )
      ) {
        throw new BadRequestException(
          'Este leilão já foi encerrado ou possui um resultado final. O histórico não pode ser alterado. Para realizar outro leilão, é necessário criar um novo ciclo sem substituir o anterior.',
        );
      }

      // ---------------------------------------
      // POSIÇÃO AINDA NÃO EXISTE
      // ---------------------------------------

      if (!ranking) {
        return tx.nationalRankingPosition.create({
          data: {
            countryCode: normalizedCountry,
            position: normalizedPosition,
            storeId: null,
            assignedById: requester.userId,

            auction: {
              create: auctionFields,
            },
          },

          include: {
            store: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                region: true,
                verified: true,
                verificationType: true,
                avatarUrl: true,
                ratingAverage: true,
                ratingCount: true,
              },
            },

            auction: {
              select: {
                id: true,
                countryCode: true,
                position: true,
                name: true,
                imageUrl: true,
                startPrice: true,
                currentBid: true,
                minimumIncrement: true,
                reservePrice: true,
                startsAt: true,
                endsAt: true,
                closed: true,
                closedAt: true,
                finalPrice: true,
                winnerStoreId: true,
              },
            },

            assignedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        });
      }

      // ---------------------------------------
      // POSIÇÃO EXISTE, MAS AINDA NÃO TEM LEILÃO
      // ---------------------------------------

      if (!existingAuction) {
        return tx.nationalRankingPosition.update({
          where: {
            id: ranking.id,
          },

          data: {
            assignedById: requester.userId,

            auction: {
              create: auctionFields,
            },
          },

          include: {
            store: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                region: true,
                verified: true,
                verificationType: true,
                avatarUrl: true,
                ratingAverage: true,
                ratingCount: true,
              },
            },

            auction: {
              select: {
                id: true,
                countryCode: true,
                position: true,
                name: true,
                imageUrl: true,
                startPrice: true,
                currentBid: true,
                minimumIncrement: true,
                reservePrice: true,
                startsAt: true,
                endsAt: true,
                closed: true,
                closedAt: true,
                finalPrice: true,
                winnerStoreId: true,
              },
            },

            assignedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        });
      }

      // ---------------------------------------
      // ATUALIZAR LEILÃO AINDA ABERTO
      // ---------------------------------------
      // Não alterar closed, closedAt, finalPrice
      // ou winnerStoreId.
      // ---------------------------------------

      await tx.nationalRankingAuction.update({
        where: {
          id: existingAuction.id,
        },

        data: auctionFields,
      });

      return tx.nationalRankingPosition.update({
        where: {
          id: ranking.id,
        },

        data: {
          assignedById: requester.userId,
        },

        include: {
          store: {
            select: {
              id: true,
              name: true,
              countryCode: true,
              region: true,
              verified: true,
              verificationType: true,
              avatarUrl: true,
              ratingAverage: true,
              ratingCount: true,
            },
          },

          auction: {
            select: {
              id: true,
              countryCode: true,
              position: true,
              name: true,
              imageUrl: true,
              startPrice: true,
              currentBid: true,
              minimumIncrement: true,
              reservePrice: true,
              startsAt: true,
              endsAt: true,
              closed: true,
              closedAt: true,
              finalPrice: true,
              winnerStoreId: true,
            },
          },

          assignedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });
    },
  );
}


// =========================================================
// CONFIRMAR PAGAMENTO DE PROMOÇÃO POR REFERÊNCIA
//
// Apenas SUPER_ADMIN pode confirmar manualmente
// um pagamento apresentado externamente.
//
// O pagamento deve:
// - existir;
// - ser do tipo PROMOTION;
// - estar PENDING;
// - possuir a referência informada.
//
// Não cria uma nova promoção.
// Não cria um novo ciclo.
// Apenas confirma o pagamento existente.
// =========================================================

// =========================================================
// CONFIRMAR PAGAMENTO DE PROMOÇÃO POR REFERÊNCIA
//
// Apenas SUPER_ADMIN pode confirmar manualmente
// um pagamento apresentado externamente.
//
// O AdminService:
// - valida o SUPER_ADMIN;
// - procura o pagamento pela referência;
// - valida se pertence a uma promoção;
// - chama o PaymentsService para confirmar;
// - devolve os dados completos para o frontend.
//
// O PaymentsService é responsável por alterar
// o estado financeiro para PAID.
// =========================================================

async confirmPromotionPaymentByReference(
  requesterId: string,
  reference: string,
) {
  // =======================================================
  // VALIDAR SUPER ADMIN
  // =======================================================

  const requester =
    await this.requireSuperAdmin(
      requesterId,
    );

  // =======================================================
  // VALIDAR REFERÊNCIA
  // =======================================================

  const normalizedReference =
    reference?.trim();

  if (!normalizedReference) {
    throw new BadRequestException(
      'A referência do pagamento é obrigatória.',
    );
  }

  // =======================================================
  // PROCURAR PAGAMENTO
  // =======================================================

  const payment =
    await this.prisma.sitePayment.findUnique({
      where: {
        reference: normalizedReference,
      },

      include: {
        promotion: {
          select: {
            id: true,
            name: true,
            status: true,
            packageId: true,
            storeId: true,
          },
        },

        store: {
          select: {
            id: true,
            name: true,
          },
        },

        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

  if (!payment) {
    throw new NotFoundException(
      'Pagamento não encontrado para a referência informada.',
    );
  }

  // =======================================================
  // VALIDAR TIPO DE PAGAMENTO
  // =======================================================

  if (
    payment.type !==
    PaymentType.PROMOTION
  ) {
    throw new BadRequestException(
      'A referência informada não pertence a um pagamento de promoção.',
    );
  }

  // =======================================================
  // VALIDAR SE EXISTE UMA PROMOÇÃO ASSOCIADA
  // =======================================================

  if (!payment.promotionId) {
    throw new BadRequestException(
      'Este pagamento não possui uma promoção associada.',
    );
  }

  // =======================================================
  // IDEMPOTÊNCIA
  // =======================================================

  if (
    payment.status ===
    PaymentStatus.PAID
  ) {
    return {
      message:
        'Este pagamento já foi confirmado anteriormente.',

      alreadyPaid: true,

      payment,
    };
  }

  // =======================================================
  // VALIDAR ESTADO ATUAL
  // =======================================================

  if (
    payment.status !==
    PaymentStatus.PENDING
  ) {
    throw new BadRequestException(
      `Este pagamento não pode ser confirmado porque está com o estado ${payment.status}.`,
    );
  }

  // =======================================================
  // CONFIRMAR ATRAVÉS DO PAYMENTS SERVICE
  // =======================================================
  //
  // A alteração para PAID fica centralizada
  // no PaymentsService.
  //
  // A referência já foi validada e encontrada.
  // O provider identifica a confirmação manual.
  // =======================================================

  await this.paymentsService.markAsPaid(
  payment.id,

  normalizedReference,

  'MANUAL_SUPER_ADMIN',
);

  // =======================================================
  // BUSCAR O PAGAMENTO ATUALIZADO
  //
  // O markAsPaid pode devolver apenas o pagamento.
  // Por isso buscamos novamente as relações necessárias
  // para manter a resposta completa do método original.
  // =======================================================

  const confirmedPayment =
    await this.prisma.sitePayment.findUnique({
      where: {
        id: payment.id,
      },

      include: {
        promotion: {
          select: {
            id: true,
            name: true,
            status: true,
            packageId: true,
            storeId: true,
          },
        },

        store: {
          select: {
            id: true,
            name: true,
          },
        },

        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

  if (!confirmedPayment) {
    throw new NotFoundException(
      'O pagamento foi confirmado, mas não foi possível carregar os seus dados atualizados.',
    );
  }

  // =======================================================
  // RESPOSTA FINAL
  // =======================================================

  return {
    message:
      'Pagamento da promoção confirmado com sucesso.',

    alreadyPaid: false,

    confirmedBy: {
      id: requester.userId,
      name: requester.user.name,
      email: requester.user.email,
    },

    payment: confirmedPayment,
  };
}

// =========================================================
// APLICAR VERIFICAÇÃO APÓS PAGAMENTO
//
// Método interno.
//
// A verificação só é aplicada quando:
// - o pagamento é do tipo VERIFICATION;
// - o pagamento está PAID;
// - a solicitação está APPROVED;
// - a solicitação pertence à mesma banca;
// - o tipo de verificação corresponde ao pedido.
//
// Os dados da solicitação são obtidos através
// do próprio pagamento para evitar inconsistências.
// =========================================================


private async applyVerificationAfterPayment(
  paymentId: string,
) {
  return this.prisma.$transaction(
    async (tx) => {
      // =====================================================
      // BUSCAR PAGAMENTO
      // =====================================================

      const payment =
        await tx.sitePayment.findUnique({
          where: {
            id: paymentId,
          },

          include: {
            verificationRequest: {
              include: {
                store: {
                  select: {
                    id: true,
                    name: true,
                    ownerId: true,
                    verified: true,
                    verificationType: true,
                    countryCode: true,
                    region: true,
                  },
                },
              },
            },
          },
        });

      if (!payment) {
        throw new NotFoundException(
          'Pagamento de verificação não encontrado.',
        );
      }

      // =====================================================
      // VALIDAR TIPO DE PAGAMENTO
      // =====================================================

      if (
        payment.type !==
        PaymentType.VERIFICATION
      ) {
        throw new BadRequestException(
          'O pagamento informado não é de verificação.',
        );
      }

      // =====================================================
      // VALIDAR ESTADO DO PAGAMENTO
      // =====================================================

      if (
        payment.status !==
        PaymentStatus.PAID
      ) {
        throw new BadRequestException(
          'A verificação só pode ser aplicada depois de o pagamento ser confirmado.',
        );
      }

      // =====================================================
      // VALIDAR RELAÇÃO COM A SOLICITAÇÃO
      // =====================================================

      const request =
        payment.verificationRequest;

      if (!request) {
        throw new BadRequestException(
          'O pagamento não está associado a uma solicitação de verificação.',
        );
      }

      if (
        request.status !==
        VerificationRequestStatus.APPROVED
      ) {
        throw new BadRequestException(
          'A solicitação de verificação não está aprovada.',
        );
      }

      // =====================================================
      // VALIDAR BANCA
      // =====================================================

      if (!request.store) {
        throw new NotFoundException(
          'A banca da solicitação não foi encontrada.',
        );
      }

      if (
        payment.storeId !==
        request.storeId
      ) {
        throw new BadRequestException(
          'A banca do pagamento não corresponde à banca da solicitação.',
        );
      }

      // =====================================================
      // VALIDAR TIPO DA VERIFICAÇÃO
      // =====================================================

      const requestedType =
        request.requestedType;

      if (
        requestedType !==
          VerificationType.BASIC &&
        requestedType !==
          VerificationType.PREMIUM
      ) {
        throw new BadRequestException(
          'O tipo de verificação da solicitação é inválido.',
        );
      }

      // =====================================================
      // IMPEDIR REBAIXAMENTO DE PREMIUM PARA BASIC
      // =====================================================
      // Uma solicitação antiga ou um pagamento
      // confirmado posteriormente nunca deve
      // rebaixar uma banca que já é PREMIUM.
      // =====================================================

      if (
        request.store.verificationType ===
          VerificationType.PREMIUM &&
        requestedType ===
          VerificationType.BASIC
      ) {
        throw new BadRequestException(
          'A banca já possui verificação PREMIUM. O pagamento desta solicitação BASIC não pode rebaixar a verificação.',
        );
      }

      // =====================================================
      // VERIFICAR SE JÁ ESTÁ APLICADA
      // =====================================================

      if (
        request.store.verified &&
        request.store.verificationType ===
          requestedType
      ) {
        return {
          alreadyApplied: true,

          payment,

          request,

          store: request.store,
        };
      }

      // =====================================================
      // VALIDAR UPGRADE PARA PREMIUM
      // =====================================================
      // O PREMIUM só pode ser aplicado a uma
      // banca que tenha verificação BASIC ativa.
      // =====================================================

      if (
        requestedType ===
          VerificationType.PREMIUM &&
        (
          !request.store.verified ||
          request.store.verificationType !==
            VerificationType.BASIC
        )
      ) {
        throw new BadRequestException(
          'A verificação PREMIUM só pode ser aplicada a uma banca com verificação BASIC ativa.',
        );
      }

      // =====================================================
      // APLICAR VERIFICAÇÃO À BANCA
      // =====================================================

      const updatedStore =
        await tx.store.update({
          where: {
            id: request.storeId,
          },

          data: {
            verified: true,

            verificationType:
              requestedType,
          },

          select: {
            id: true,
            name: true,
            ownerId: true,
            verified: true,
            verificationType: true,
            countryCode: true,
            region: true,
          },
        });

      // =====================================================
      // RESULTADO
      // =====================================================

      return {
        alreadyApplied: false,

        payment,

        request,

        store: updatedStore,
      };
    },
  );
}


// =========================================================
// CONFIRMAR PAGAMENTO DE VERIFICAÇÃO POR REFERÊNCIA
//
// Somente o SUPER_ADMIN pode confirmar manualmente
// o pagamento de uma verificação.
//
// Depois de confirmar o pagamento:
// - o pagamento passa para PAID;
// - a verificação é aplicada à banca;
// - o tipo BASIC ou PREMIUM é preservado;
// - a operação é idempotente.
// =========================================================


async confirmVerificationPaymentByReference(
  requesterId: string,
  reference: string,
) {
  // =========================================
  // VALIDAR SUPER ADMIN
  // =========================================

  const requester =
    await this.requireSuperAdmin(
      requesterId,
    );

  // =========================================
  // VALIDAR REFERÊNCIA
  // =========================================

  const normalizedReference =
    reference?.trim();

  if (!normalizedReference) {
    throw new BadRequestException(
      'A referência do pagamento é obrigatória.',
    );
  }

  // =========================================
  // TRANSAÇÃO ATÓMICA
  // =========================================
  // A confirmação financeira e a aplicação
  // da verificação são feitas na mesma transação.
  // =========================================

  return this.prisma.$transaction(
    async (tx) => {
      // ---------------------------------------
      // PROCURAR PAGAMENTO
      // ---------------------------------------

      const payment =
        await tx.sitePayment.findUnique({
          where: {
            reference: normalizedReference,
          },

          include: {
            verificationRequest: {
              include: {
                store: {
                  select: {
                    id: true,
                    name: true,
                    ownerId: true,
                    verified: true,
                    verificationType: true,
                    countryCode: true,
                    region: true,
                  },
                },
              },
            },
          },
        });

      if (!payment) {
        throw new NotFoundException(
          'Pagamento não encontrado para a referência informada.',
        );
      }

      // ---------------------------------------
      // VALIDAR TIPO DE PAGAMENTO
      // ---------------------------------------

      if (
        payment.type !==
        PaymentType.VERIFICATION
      ) {
        throw new BadRequestException(
          'A referência informada não corresponde a um pagamento de verificação.',
        );
      }

      // ---------------------------------------
      // VALIDAR SOLICITAÇÃO
      // ---------------------------------------

      const verificationRequest =
        payment.verificationRequest;

      if (!verificationRequest) {
        throw new BadRequestException(
          'O pagamento não está associado a uma solicitação de verificação.',
        );
      }

      if (
        verificationRequest.status !==
        VerificationRequestStatus.APPROVED
      ) {
        throw new BadRequestException(
          'A solicitação precisa estar aprovada antes da confirmação do pagamento.',
        );
      }

      // ---------------------------------------
      // VALIDAR BANCA
      // ---------------------------------------

      if (!verificationRequest.store) {
        throw new NotFoundException(
          'A banca da solicitação não foi encontrada.',
        );
      }

      if (
        payment.storeId !==
        verificationRequest.storeId
      ) {
        throw new BadRequestException(
          'A banca do pagamento não corresponde à banca da solicitação.',
        );
      }

      // ---------------------------------------
      // VALIDAR TIPO DE VERIFICAÇÃO
      // ---------------------------------------

      const requestedType =
        verificationRequest.requestedType;

      if (
        requestedType !== VerificationType.BASIC &&
        requestedType !== VerificationType.PREMIUM
      ) {
        throw new BadRequestException(
          'O tipo de verificação da solicitação é inválido.',
        );
      }

      // ---------------------------------------
      // CONFIRMAR PAGAMENTO SE AINDA PENDENTE
      // ---------------------------------------

      if (
        payment.status === PaymentStatus.PENDING
      ) {
        const updatedPayment =
          await tx.sitePayment.updateMany({
            where: {
              id: payment.id,
              reference: normalizedReference,
              status: PaymentStatus.PENDING,
            },

            data: {
              status: PaymentStatus.PAID,
              paidAt: new Date(),
              provider: 'MANUAL_SUPER_ADMIN',
            },
          });

        // Se outra operação alterou o pagamento
        // entretanto, não o confirmar cegamente.
        if (updatedPayment.count !== 1) {
          const latestPayment =
            await tx.sitePayment.findUnique({
              where: {
                id: payment.id,
              },

              select: {
                status: true,
              },
            });

          if (
            latestPayment?.status !==
            PaymentStatus.PAID
          ) {
            throw new BadRequestException(
              'O estado do pagamento foi alterado por outra operação. Atualiza os dados e tenta novamente.',
            );
          }
        }
      } else if (
        payment.status !== PaymentStatus.PAID
      ) {
        throw new BadRequestException(
          `Este pagamento não pode ser confirmado porque está no estado ${payment.status}.`,
        );
      }

      // ---------------------------------------
      // VOLTAR A LER O PAGAMENTO
      // ---------------------------------------
      // Obtém o estado financeiro já confirmado
      // dentro da mesma transação.
      // ---------------------------------------

      const confirmedPayment =
        await tx.sitePayment.findUnique({
          where: {
            id: payment.id,
          },

          include: {
            verificationRequest: {
              include: {
                store: {
                  select: {
                    id: true,
                    name: true,
                    ownerId: true,
                    verified: true,
                    verificationType: true,
                    countryCode: true,
                    region: true,
                  },
                },
              },
            },
          },
        });

      if (!confirmedPayment) {
        throw new NotFoundException(
          'Não foi possível recuperar o pagamento confirmado.',
        );
      }

      if (
        confirmedPayment.status !==
        PaymentStatus.PAID
      ) {
        throw new BadRequestException(
          'O pagamento ainda não está confirmado.',
        );
      }

      const confirmedRequest =
        confirmedPayment.verificationRequest;

      if (
        !confirmedRequest ||
        !confirmedRequest.store
      ) {
        throw new BadRequestException(
          'Não foi possível recuperar a solicitação e a banca associadas ao pagamento.',
        );
      }

      if (
        confirmedRequest.status !==
        VerificationRequestStatus.APPROVED
      ) {
        throw new BadRequestException(
          'A solicitação deixou de estar aprovada. A verificação não pode ser aplicada.',
        );
      }

      // ---------------------------------------
      // APLICAR VERIFICAÇÃO
      // ---------------------------------------
      // Se já estiver aplicada, não repetir
      // desnecessariamente a atualização.
      // ---------------------------------------

      const currentStore =
        confirmedRequest.store;

      let updatedStore = currentStore;

      const alreadyApplied =
        currentStore.verified &&
        currentStore.verificationType ===
          requestedType;

      if (!alreadyApplied) {
        updatedStore =
          await tx.store.update({
            where: {
              id: confirmedRequest.storeId,
            },

            data: {
              verified: true,
              verificationType: requestedType,
            },

            select: {
              id: true,
              name: true,
              ownerId: true,
              verified: true,
              verificationType: true,
              countryCode: true,
              region: true,
            },
          });
      }

      // ---------------------------------------
      // RESPOSTA
      // ---------------------------------------

      return {
        message: alreadyApplied
          ? 'O pagamento já estava confirmado e a verificação já estava aplicada.'
          : 'Pagamento confirmado e verificação aplicada com sucesso.',

        alreadyPaid:
          payment.status === PaymentStatus.PAID,

        alreadyApplied,

        confirmedBy: {
          id: requester.userId,
          email: requester.user.email,
          name: requester.user.name,
        },

        payment: confirmedPayment,

        request: confirmedRequest,

        store: updatedStore,
      };
    },
  );
}


private assertValidRegion(countryCode: string, region: string) {
  const valid = REGIONS[countryCode as keyof typeof REGIONS] as
    | string[]
    | undefined;

  if (!valid?.includes(region)) {
    throw new BadRequestException('Região inválida para o país.');
  }
}}