import { Module, forwardRef } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => NotificationsModule), // 🔥 AQUI
  ],
  providers: [FollowsService],
  controllers: [FollowsController]
})
export class FollowsModule {}
