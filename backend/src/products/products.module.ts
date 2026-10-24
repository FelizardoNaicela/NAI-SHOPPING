import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StoresMaintenanceModule } from '../stores/stores-maintenance.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    StoresMaintenanceModule], // 👈 AQUI
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
