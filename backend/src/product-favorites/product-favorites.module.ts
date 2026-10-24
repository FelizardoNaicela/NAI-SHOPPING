import { Module } from "@nestjs/common";
import { ProductFavoritesController } from "./product-favorites.controller";
import { ProductFavoritesService } from "./product-favorites.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
    controllers: [ProductFavoritesController],
    providers: [
        ProductFavoritesService,
        PrismaService,
    ],
})
export class ProductFavoritesModule {}