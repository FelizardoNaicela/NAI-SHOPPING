import {
    Injectable,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { LegalHoldStatus, Prisma, UserRole } from "@prisma/client";
import { randomBytes } from "crypto";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangeEmailDto } from "./dto/change-email.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

// Campos que podem ser devolvidos ao cliente.
// Nunca inclui passwordHash.
const SAFE_USER_SELECT = {
    id: true,
    username: true,
    name: true,
    email: true,
    phone: true,
    bio: true,
    avatarUrl: true,
    countryCode: true,
    region: true,
    role: true,
    createdAt: true,
} as const;

@Injectable()
export class UsersService {

    constructor(
        private prisma: PrismaService,
    ) {}

    /*
    =====================================================
    PERFIL
    =====================================================
    */

    async getProfile(userId: string) {

        const user =
            await this.prisma.user.findUnique({

                where: {
                    id: userId,
                },

                include: {

                    stores: {

                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                            verified: true,
                        },

                    },

                },

            });

        if (!user || user.deletedAt) {
            throw new NotFoundException(
                "Utilizador não encontrado",
            );
        }

        return {

            id: user.id,

            username: user.username,

            name: user.name,

            email: user.email,

            phone: user.phone,

            bio: user.bio,

            avatarUrl: user.avatarUrl,

            countryCode: user.countryCode,

            region: user.region,

            role: user.role,

            createdAt: user.createdAt,

            stores: user.stores,

        };

    }


    /*
=====================================================
PERFIL PÚBLICO
=====================================================
*/

async getPublicProfile(
    username: string,
) {

    const user =
        await this.prisma.user.findUnique({

            where: {
                username,
            },

            include: {

                stores: {

                    select: {

                        id: true,

                        name: true,

                        avatarUrl: true,

                        verified: true,

                    },

                },

            },

        });

    if (!user || user.deletedAt) {

        throw new NotFoundException(
            "Utilizador não encontrado",
        );

    }

    return {

        id: user.id,

        username: user.username,

        name: user.name,

        bio: user.bio,

        avatarUrl: user.avatarUrl,

        countryCode: user.countryCode,

        region: user.region,

        createdAt: user.createdAt,

        stores: user.stores,

    };

}

    /*
    =====================================================
    ATUALIZAR PERFIL
    =====================================================
    */

    async updateProfile(userId: string, data: UpdateProfileDto) {
    const current = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
            deletedAt: true,
            adminProfile: { select: { id: true } },
        },
    });

    if (!current || current.deletedAt) {
        throw new NotFoundException("Utilizador não encontrado");
    }

    // O país e a região definem o âmbito dos administradores.
    // Só um Super Admin os pode alterar, pelo painel.
    if (
        current.adminProfile &&
        (data.countryCode !== undefined || data.region !== undefined)
    ) {
        throw new ForbiddenException(
            "Contas administrativas não podem alterar o país nem a região.",
        );
    }

    if (data.username) {
        const exists = await this.prisma.user.findFirst({
            where: {
                username: data.username,
                NOT: { id: userId },
            },
            select: { id: true },
        });

        if (exists) {
            throw new BadRequestException("Username já está em uso");
        }
    }

    const { username, name, bio, phone, countryCode, region, avatarUrl } =
        data;

    return this.prisma.user.update({
        where: { id: userId },
        data: { username, name, bio, phone, countryCode, region, avatarUrl },
        select: SAFE_USER_SELECT,
    });
}

    async updateAvatar(
    userId: string,
    avatarUrl: string,
) {

    return this.prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: SAFE_USER_SELECT,
});

}

    /*
    =====================================================
    ALTERAR EMAIL
    =====================================================
    */

    async changeEmail(
    userId: string,
    dto: ChangeEmailDto,
) {

        const user =
            await this.prisma.user.findUnique({

                where: {
                    id: userId,
                },

            });

        if (!user) {

            throw new NotFoundException(
                "Utilizador não encontrado",
            );

        }

        const valid =
            await bcrypt.compare(
                dto.currentPassword,
                user.passwordHash,
            );

        if (!valid) {

            throw new UnauthorizedException(
                "Senha incorreta",
            );

        }

        const emailExists =
            await this.prisma.user.findUnique({

                where: {
                    email: dto.newEmail,
                },

            });

        if (emailExists) {

            throw new BadRequestException(
                "Este email já está registado",
            );

        }

        return this.prisma.user.update({
    where: { id: userId },
    data: { email: dto.newEmail },
    select: SAFE_USER_SELECT,
});

    }

    /*
    =====================================================
    ALTERAR PASSWORD
    =====================================================
    */

    async changePassword(
    userId: string,
    dto: ChangePasswordDto,
) {

        const user =
            await this.prisma.user.findUnique({

                where: {
                    id: userId,
                },

            });

        if (!user || user.deletedAt) {

            throw new NotFoundException(
                "Utilizador não encontrado",
            );

        }

        if (
    dto.newPassword !==
    dto.confirmPassword
) {

    throw new BadRequestException(
        "As palavras-passe não coincidem.",
    );

}

        const valid =
            await bcrypt.compare(
                dto.currentPassword,
                user.passwordHash,
            );

        if (!valid) {

            throw new UnauthorizedException(
                "Senha incorreta",
            );

        }

        const passwordHash =
            await bcrypt.hash(
                dto.newPassword,
                10,
            );

        await this.prisma.user.update({

            where: {
                id: userId,
            },

            data: {

                passwordHash,

            },

        });

        return {

            success: true,

        };

    }

    /*
    =====================================================
    ELIMINAR CONTA
    =====================================================
    */

    async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            passwordHash: true,
            deletedAt: true,
            adminProfile: { select: { id: true } },
            legalInvestigatorProfile: { select: { id: true } },
        },
    });

    if (!user || user.deletedAt) {
        throw new NotFoundException("Utilizador não encontrado");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
        throw new UnauthorizedException("Senha incorreta");
    }

    if (
        user.role !== UserRole.USER ||
        user.adminProfile ||
        user.legalInvestigatorProfile
    ) {
        throw new ForbiddenException(
            "Contas com funções administrativas ou jurídicas têm de ser tratadas por um Super Admin antes de serem eliminadas.",
        );
    }

    // Palavra-passe aleatória e impossível de adivinhar.
    const unusableHash = await bcrypt.hash(
        randomBytes(32).toString("hex"),
        10,
    );

    await this.prisma.$transaction(async (tx) => {
        const stores = await tx.store.findMany({
            where: { ownerId: userId },
            select: { id: true },
        });

        const ownedStoreIds = stores.map((store) => store.id);

        // 1. Legal Hold ativo: mensagem propositadamente neutra.
        if (await this.isUnderActiveLegalHold(tx, userId, ownedStoreIds)) {
            throw new ConflictException(
                "Não foi possível concluir a eliminação da conta neste momento. Contacta o suporte.",
            );
        }

        // 2. Leilões em curso nas bancas do utilizador.
        if (ownedStoreIds.length > 0) {
            const openAuction = await tx.product.findFirst({
                where: {
                    storeId: { in: ownedStoreIds },
                    type: "AUCTION",
                    auctionClosed: false,
                },
                select: { id: true },
            });

            if (openAuction) {
                throw new BadRequestException(
                    "Tens leilões em curso. Encerra-os antes de eliminar a conta.",
                );
            }

            await tx.store.updateMany({
                where: { id: { in: ownedStoreIds } },
                data: { isActive: false },
            });

            await tx.product.updateMany({
                where: { storeId: { in: ownedStoreIds } },
                data: { isPublished: false },
            });
        }

        // 3. Dados que não precisam de ser conservados.
        await tx.notification.deleteMany({ where: { userId } });
        await tx.notificationPreference.deleteMany({ where: { userId } });
        await tx.productFavorite.deleteMany({ where: { userId } });
        await tx.storeFollow.deleteMany({ where: { userId } });
        await tx.messageReaction.deleteMany({ where: { userId } });

        // 4. Anonimizar. A linha fica, por causa das relações
        //    (mensagens, pagamentos, evidências).
        await tx.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                email: `deleted-${userId}@deleted.invalid`,
                name: "Conta eliminada",
                username: null,
                phone: null,
                avatarUrl: null,
                bio: null,
                region: null,
                passwordHash: unusableHash,
            },
        });
    });

    return { success: true };
}

// ---------------------------------------------------------
// A conta está abrangida por algum Legal Hold ativo?
// Conservador: na dúvida, bloqueia.
// ---------------------------------------------------------

private async isUnderActiveLegalHold(
    tx: Prisma.TransactionClient,
    userId: string,
    ownedStoreIds: string[],
): Promise<boolean> {
    const conversations = await tx.conversation.findMany({
        where: {
            OR: [{ userId }, { store: { ownerId: userId } }],
        },
        select: { id: true, storeId: true },
    });

    const conversationIds = conversations.map((c) => c.id);

    const storeIds = [
        ...new Set([
            ...ownedStoreIds,
            ...conversations.map((c) => c.storeId),
        ]),
    ];

    const hold = await tx.legalHold.findFirst({
        where: {
            status: LegalHoldStatus.ACTIVE,
            OR: [
                { userId },
                ...(storeIds.length ? [{ storeId: { in: storeIds } }] : []),
                ...(conversationIds.length
                    ? [{ conversationId: { in: conversationIds } }]
                    : []),
                {
                    evidence: {
                        some: {
                            OR: [{ senderId: userId }, { receiverId: userId }],
                        },
                    },
                },
            ],
        },
        select: { id: true },
    });

    if (hold) {
        return true;
    }

    // Holds por mensagem específica.
    const messageHolds = await tx.legalHold.findMany({
        where: {
            status: LegalHoldStatus.ACTIVE,
            messageId: { not: null },
        },
        select: { messageId: true },
    });

    if (messageHolds.length === 0) {
        return false;
    }

    const message = await tx.message.findFirst({
        where: {
            id: { in: messageHolds.map((h) => h.messageId as string) },
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: { id: true },
    });

    return Boolean(message);
}

}