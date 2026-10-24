import {
    BadRequestException,
    Injectable,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProductFavoritesService {

    constructor(
        private prisma: PrismaService,
    ) {}

    //---------------------------------
    // FAVORITAR
    //---------------------------------

    async favoriteProduct(
        userId: string,
        productId: string,
    ) {

        const product =
            await this.prisma.product.findUnique({

                where: {
                    id: productId,
                },

            });

        if (!product) {

            throw new BadRequestException(
                "Produto não encontrado",
            );

        }

        return this.prisma.productFavorite.upsert({

            where: {

                userId_productId: {

                    userId,
                    productId,

                },

            },

            update: {},

            create: {

                userId,
                productId,

            },

        });

    }

    //---------------------------------
    // REMOVER
    //---------------------------------

    async removeFavorite(
        userId: string,
        productId: string,
    ) {

        return this.prisma.productFavorite.deleteMany({

            where: {

                userId,
                productId,

            },

        });

    }

    //---------------------------------
    // LISTAR
    //---------------------------------

    async getFavorites(userId: string) {

        return this.prisma.productFavorite.findMany({

            where: {

                userId,

            },

            include: {

                product: {

                    include: {

                        store: true,

                        images: {

                            orderBy: {

                                order: "asc",

                            },

                        },

                    },

                },

            },

            orderBy: {

                createdAt: "desc",

            },

        });

    }

    //---------------------------------
    // VERIFICAR
    //---------------------------------

    async isFavorite(
        userId: string,
        productId: string,
    ) {

        const favorite =
            await this.prisma.productFavorite.findUnique({

                where: {

                    userId_productId: {

                        userId,
                        productId,

                    },

                },

            });

        return !!favorite;

    }

}