import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/jwt/jwt-auth.guard";

import { ProductFavoritesService } from "./product-favorites.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class ProductFavoritesController {

    constructor(

        private favoritesService: ProductFavoritesService,

    ) {}

    //---------------------------------

    @Post("products/:id/favorite")
    favorite(

        @Req() req,
        @Param("id") productId: string,

    ) {

        return this.favoritesService.favoriteProduct(

            req.user.id,
            productId,

        );

    }

    //---------------------------------

    @Delete("products/:id/unfavorite")
    remove(

        @Req() req,
        @Param("id") productId: string,

    ) {

        return this.favoritesService.removeFavorite(

            req.user.id,
            productId,

        );

    }

    //---------------------------------

    @Get("users/me/favorites")
    getFavorites(
        @Req() req,
    ) {

        return this.favoritesService.getFavorites(

            req.user.id,

        );

    }

    //---------------------------------

    @Get("products/:id/is-favorite")
    isFavorite(

        @Req() req,
        @Param("id") productId: string,

    ) {

        return this.favoritesService.isFavorite(

            req.user.id,
            productId,

        );

    }

}