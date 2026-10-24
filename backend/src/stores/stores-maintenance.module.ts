import { Module } from '@nestjs/common';
import { StoresMaintenanceService } from './stores-maintenance.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StoresMaintenanceService],
  exports: [StoresMaintenanceService], // 👈 MUITO IMPORTANTE
})
export class StoresMaintenanceModule {}
