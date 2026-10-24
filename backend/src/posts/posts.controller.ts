import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt/optional-jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  /* =========================
     Criar post
  ========================= */

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreatePostDto) {
return this.postsService.create(req.user.sub, dto);
  }

  /* =========================
     Feed da banca
  ========================= */

  @Get('store')
  getStoreFeed(
    @Query('storeId') storeId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getStoreFeed(
      storeId,
      cursor,
      Number(limit) || 10,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
@Get("feed")
getGlobalFeed(
  @Req() req,
  @Query("cursor") cursor?: string,
  @Query("limit") limit = "10",
  @Query("countryCode") countryCode?: string,
  @Query("region") region?: string,
) {
  return this.postsService.getGlobalFeed({
  userId: req.user?.sub,
  cursor,
  limit: Number(limit),
  overrideCountry: countryCode, // ✅
  overrideRegion: region,       // ✅
});
}

@UseGuards(JwtAuthGuard)
@Get("following")
getFollowingFeed(
  @Req() req,
  @Query("cursor") cursor?: string,
  @Query("limit") limit?: string
) {

  return this.postsService.getFollowingFeed(req.user.sub, {
    cursor,
    limit: limit ? Number(limit) : 10
  });

}

 @Get(":id")
findOne(
  @Param("id") id: string,
) {
  return this.postsService.findOne(id);
}
}