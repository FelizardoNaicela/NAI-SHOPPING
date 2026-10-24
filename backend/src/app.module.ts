import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { FollowsModule } from './follows/follows.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './uploads/upload.module';
import { ImagesModule } from './images/images.module';
import { PostsModule } from './posts/posts.module';
import { ChatModule } from './chats/chat.module';
import { AuctionModule } from './auction/auction.module';
import { ProductFavoritesModule } from "./product-favorites/product-favorites.module";
import { UsersModule } from "./users/users.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { AdminModule } from './admin/admin.module';
import { NationalRankingModule } from './ranking/national-ranking.module';
import { PaymentsModule } from './payments/payments.module';
import { ConfigModule } from '@nestjs/config';
import { LegalInvestigationModule } from './legal-investigation/legal-investigation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    PrismaModule,
    StoresModule,
    ProductsModule,
    CategoriesModule,
    FollowsModule,
    NotificationsModule,
    UploadModule,
    ImagesModule,
    PostsModule,
    ChatModule,
    AuctionModule,
    ProductFavoritesModule,
    UsersModule,
    PromotionsModule,
    AdminModule,
    NationalRankingModule,
    PaymentsModule,
  LegalInvestigationModule,],
  controllers: [AppController,],
  providers: [AppService,],
})
export class AppModule {}