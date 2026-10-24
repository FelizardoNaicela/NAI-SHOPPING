import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':storeId')
  follow(@Req() req, @Param('storeId') storeId: string) {
    return this.followsService.followStore(req.user.sub, storeId);
  }

  @Delete(':storeId')
  unfollow(@Req() req, @Param('storeId') storeId: string) {
    return this.followsService.unfollowStore(req.user.sub, storeId);
  }

  @Get('me')
  myFollows(@Req() req) {
    return this.followsService.myFollows(req.user.sub);
  }
}
