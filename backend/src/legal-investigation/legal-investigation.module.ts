import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { LegalInvestigationController } from './legal-investigation.controller';
import { LegalInvestigationService } from './legal-investigation.service';
import { LegalEvidenceService } from './legal-evidence.service';

import { LegalInvestigatorGuard } from './guards/legal-investigator.guard';
import { LegalHoldAdminController } from './legal-hold-admin.controller';
import { LegalInvestigatorAdminController } from './legal-investigator-admin.controller';
import { LegalInvestigatorAdminService } from './legal-investigator-admin.service';


@Module({
  controllers: [
    LegalInvestigationController,
    LegalHoldAdminController,
    LegalInvestigatorAdminController,
  ],

  providers: [
    LegalInvestigationService,
    PrismaService,
    LegalEvidenceService,
    LegalInvestigatorGuard,
    LegalInvestigatorAdminService,
  ],

  exports: [
    LegalInvestigationService,
    LegalEvidenceService,
  ],
})
export class LegalInvestigationModule {}