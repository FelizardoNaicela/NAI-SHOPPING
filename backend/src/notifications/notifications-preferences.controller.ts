import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { NotificationPreferencesService } from './notifications-preferences.service';
import type { Request } from 'express';
type AuthRequest = Request & {
  user: {
    sub: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('notifications/preferences')
export class NotificationPreferencesController {
  constructor(
    private readonly prefsService: NotificationPreferencesService,
  ) {}

  @Get()
  async getMyPreferences(@Req() req: AuthRequest) {
  const userId = req.user.sub;
    return this.prefsService.getByUser(userId);
  }

  @Patch()
  async updateMyPreferences(
  @Req() req: AuthRequest,
  @Body() body: {
    newProduct?: boolean;
    bancaFollowed?: boolean;
    system?: boolean;
    inApp?: boolean;
    email?: boolean;
    whatsapp?: boolean;
  },
) {
  const userId = req.user.sub;
  return this.prefsService.update(userId, body);
}
}
