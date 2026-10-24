import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Param,
  Patch,
} from "@nestjs/common";
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
@Post()
create(
  @Req() req: any,
  @Body()
body: {
  storeId: string;

  name: string;
  description?: string;
  type?: "NORMAL" | "AUCTION";
  price: number;
  stock?: number;
  categoryId?: string;
  publishToFeed?: boolean;
  images?: any[];
  auctionStartPrice?: number;
  minimumIncrement?: number;
  reservePrice?: number;
  auctionStartsAt?: string;
  auctionEndsAt?: string;
},

) {
  return this.productsService.createProduct(
    req.user.sub,
    body.storeId,
    body,
  );
}

@UseGuards(JwtAuthGuard)
@Patch(':id')
update(
  @Param('id') productId: string,
  @Req() req: any,
  @Body()
  body: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryId?: string | null;
    publishToFeed?: boolean;

    auctionStartPrice?: number;
    minimumIncrement?: number;
    reservePrice?: number;
    auctionStartsAt?: string;
    auctionEndsAt?: string;
  },
) {
  return this.productsService.updateProduct(
    req.user.sub,
    productId,
    body,
  );
}

@UseGuards(JwtAuthGuard)
@Delete(':id')
delete(
  @Param('id') productId: string,
  @Req() req: any,
) {
  return this.productsService.deleteProduct(
    req.user.sub,
    productId,
  );
}


@Get()
list(
  @Query("category") category?: string,
  @Query("search") search?: string,
  @Query("order") order?: string,
  @Query("country") country?: string,
  @Query("region") region?: string,
  @Query("time") time?: string,
  @Query("sort") sort?: string,
  @Query("cursor") cursor?: string,
  @Query("limit") limit?: string,

  @Query("storeId") storeId?: string,
) {
  return this.productsService.listProducts({
    category,
    search,
    order,
    country,
    region,
    time,
    sort,
    cursor,
    limit: limit
        ? Number(limit)
        : 20,
    storeId,
  });
}
@Get('feed')
feed(
  @Query('limit') limit = '10',
  @Query('cursor') cursor?: string,
) {
  return this.productsService.publicFeed({
    limit: Number(limit),
    cursor,
  });
}

@UseGuards(JwtAuthGuard)
@Get('feed/following')
feedFollowing(@Req() req) {
  return this.productsService.feedFromFollowedStores(req.user.sub);
}

@Get('store/:storeId/sidebar')
sidebarFeed(
  @Param('storeId') storeId: string,
  @Query('limit') limit = '6',
) {
  return this.productsService.listProducts({
    storeId,
    limit: Number(limit),
  });
}

@UseGuards(JwtAuthGuard)
@Get("favorites")
favorites(@Req() req) {

  return this.productsService.listFavorites(
    req.user.sub,
  );

}

@UseGuards(JwtAuthGuard)
@Get(":id/favorite")
isFavorite(
  @Req() req,
  @Param("id") id: string,
) {

  return this.productsService.isFavorite(
    req.user.sub,
    id,
  );

}

@UseGuards(JwtAuthGuard)
@Post(":id/favorite")
favorite(
  @Req() req,
  @Param("id") id: string,
) {

  return this.productsService.addFavorite(
    req.user.sub,
    id,
  );

}

@UseGuards(JwtAuthGuard)
@Delete(":id/favorite")
unfavorite(
  @Req() req,
  @Param("id") id: string,
) {

  return this.productsService.removeFavorite(
    req.user.sub,
    id,
  );

}

// =========================================================
// DESCONTOS
// =========================================================

@UseGuards(JwtAuthGuard)
@Post('discounts')
createDiscount(
  @Req() req: any,
  @Body()
  body: {
    storeId: string;
    name?: string;
    discountPercent: number;
    startsAt: string;
    endsAt: string;
    productIds: string[];
  },
) {
  return this.productsService.createDiscount(
    req.user.sub,
    body,
  );
}

@UseGuards(JwtAuthGuard)
@Post('discounts/:id/activate')
activateDiscount(
  @Req() req: any,
  @Param('id') discountId: string,
) {
  return this.productsService.activateDiscount(
    req.user.sub,
    discountId,
  );
}

@UseGuards(JwtAuthGuard)
@Post('discounts/:id/pause')
pauseDiscount(
  @Req() req: any,
  @Param('id') discountId: string,
) {
  return this.productsService.pauseDiscount(
    req.user.sub,
    discountId,
  );
}

@UseGuards(JwtAuthGuard)
@Post('discounts/:id/cancel')
cancelDiscount(
  @Req() req: any,
  @Param('id') discountId: string,
) {
  return this.productsService.cancelDiscount(
    req.user.sub,
    discountId,
  );
}

@UseGuards(JwtAuthGuard)
@Get('store/:storeId/discounts')
listDiscounts(
  @Req() req: any,
  @Param('storeId') storeId: string,
) {
  return this.productsService.listStoreDiscounts(
    req.user.sub,
    storeId,
  );
}

@Get(':id')
getOne(@Param('id') id: string) {
  return this.productsService.findOne(id);
}

}
