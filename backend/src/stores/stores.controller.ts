import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
  Patch
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/jwt/optional-jwt-auth.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @UseGuards(JwtAuthGuard)
@Post()
create(@Req() req, @Body() body: CreateStoreDto) {
  return this.storesService.createStore(req.user.sub, body);
}

@UseGuards(JwtAuthGuard)
@Patch(':id')
updateStore(@Param('id') id: string, @Body() body: UpdateStoreDto, @Req() req) {
  return this.storesService.updateStore(id, req.user.sub, body);
}

@UseGuards(JwtAuthGuard)
@Get('me')
async getMyStore(@Req() req) {
  return this.storesService.getMyStore(req.user.sub);
}
@UseGuards(JwtAuthGuard)
@Get()
async list(@Req() req) {
  return this.storesService.listMyStores(req.user.sub);
}

@Get("popular")
getPopularStores() {
  return this.storesService.getPopularStores();
}

@Get("search")
searchStores(@Query("q") q: string) {
  return this.storesService.searchStores(q);
}

@Get("search/global")
searchGlobal(
  @Query("q") q: string,
  @Query("country") country?: string,
  @Query("region") region?: string,
  @Query("time") time?: string,
  @Query("sort") sort?: string,
  @Query("cursor") cursor?: string,
  @Query("limit") limit = "20",
  @Query("type") type?: string,
) {
  return this.storesService.globalSearch({
  query: q,
  country,
  region,
  time,
  sort,
  cursor,
  limit: Number(limit),
  type,
});
}

@Get("search/suggestions")
searchSuggestions(
  @Query("q") query: string,
) {
  return this.storesService.searchSuggestions(query);
}

@Get(':id')
getStore(@Param('id') id: string) {
  return this.storesService.getStoreById(id);
}

@UseGuards(JwtAuthGuard)
@Post(':id/follow')
follow(@Req() req, @Param('id') storeId: string) {
  return this.storesService.followStore(req.user.sub, storeId);
}

@UseGuards(JwtAuthGuard)
@Post(':id/unfollow')
unfollow(@Req() req, @Param('id') storeId: string) {
  return this.storesService.unfollowStore(req.user.sub, storeId);
}

@UseGuards(JwtAuthGuard)
@Get(':id/following')
isFollowing(@Req() req, @Param('id') storeId: string) {
  return this.storesService.isFollowing(req.user.sub, storeId);
}

@UseGuards(OptionalJwtAuthGuard)
@Get(':id/page')
getStorePage(
  @Param('id') storeId: string,
  @Req() req,
) {

 return this.storesService.getStorePage(
    storeId,
    req.user?.sub,
  );
}

  @Get(':storeId/feed')
  getStoreFeed(
    @Param('storeId') storeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.storesService.getStoreFeed({
      storeId,
      page: Number(page),
      limit: Number(limit),
    });
  }
}
