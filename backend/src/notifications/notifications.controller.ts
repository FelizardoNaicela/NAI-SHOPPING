import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  Delete,
  Post,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { MarkReadBatchDto } from './dto/mark-read-batch.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('me')
  findMy(@Req() req) {
    return this.notificationsService.findMy(req.user.sub);
  }

  @Get('unread-count')
  unreadCount(@Req() req) {
    return this.notificationsService.countUnread(req.user.sub);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req,
  ) {
    return this.notificationsService.markAsRead(
      id,
      req.user.sub,
    );
  }

  @Patch('read-all')
  markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(
      req.user.sub,
    );
  }

  // ✅ BATCH REAL (NOVO)
  @Patch('read-batch')
  async markReadBatch(
    @Req() req,
    @Body() dto: MarkReadBatchDto,
  ) {
    await this.notificationsService.markManyAsRead(
      dto.ids,
      req.user.sub,
    );

    return { success: true };
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string, @Req() req) {
    return this.notificationsService.delete(
      id,
      req.user.sub,
    );
  }

  @Delete('read/all')
  deleteAllRead(@Req() req) {
    return this.notificationsService.deleteAllRead(
      req.user.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('mark-group-read')
  async markGroupRead(
    @Req() req: any,
    @Body() body: { ids: string[] },
  ) {
    await this.notificationsService.markManyAsRead(
      body.ids,
      req.user.sub,
    );

    return { success: true };
  }

}
