import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StoresMaintenanceService } from './stores-maintenance.service';

@Module({
  imports: [PrismaModule],
  controllers: [StoresController],
  providers: [StoresService, StoresMaintenanceService],
  exports: [StoresMaintenanceService],
})
export class StoresModule {}
