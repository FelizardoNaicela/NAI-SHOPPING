-- CreateTable
CREATE TABLE "LegalInvestigatorRoleAudit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalInvestigatorRoleAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalInvestigatorRoleAudit_targetUserId_idx" ON "LegalInvestigatorRoleAudit"("targetUserId");

-- CreateIndex
CREATE INDEX "LegalInvestigatorRoleAudit_actorId_idx" ON "LegalInvestigatorRoleAudit"("actorId");

-- CreateIndex
CREATE INDEX "LegalInvestigatorRoleAudit_createdAt_idx" ON "LegalInvestigatorRoleAudit"("createdAt");
