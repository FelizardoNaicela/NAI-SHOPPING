-- CreateEnum
CREATE TYPE "LegalEvidenceAccessAction" AS ENUM ('VIEW', 'MEDIA');

-- CreateEnum
CREATE TYPE "LegalEvidenceAccessStatus" AS ENUM ('STARTED', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "LegalEvidenceAccessAudit" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "action" "LegalEvidenceAccessAction" NOT NULL,
    "mediaType" TEXT,
    "status" "LegalEvidenceAccessStatus" NOT NULL DEFAULT 'STARTED',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LegalEvidenceAccessAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalEvidenceAccessAudit_investigationId_idx" ON "LegalEvidenceAccessAudit"("investigationId");

-- CreateIndex
CREATE INDEX "LegalEvidenceAccessAudit_evidenceId_idx" ON "LegalEvidenceAccessAudit"("evidenceId");

-- CreateIndex
CREATE INDEX "LegalEvidenceAccessAudit_requestedById_idx" ON "LegalEvidenceAccessAudit"("requestedById");

-- CreateIndex
CREATE INDEX "LegalEvidenceAccessAudit_createdAt_idx" ON "LegalEvidenceAccessAudit"("createdAt");

-- CreateIndex
CREATE INDEX "LegalEvidenceAccessAudit_status_idx" ON "LegalEvidenceAccessAudit"("status");

-- AddForeignKey
ALTER TABLE "LegalEvidenceAccessAudit" ADD CONSTRAINT "LegalEvidenceAccessAudit_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "LegalInvestigationAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalEvidenceAccessAudit" ADD CONSTRAINT "LegalEvidenceAccessAudit_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "LegalMessageEvidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalEvidenceAccessAudit" ADD CONSTRAINT "LegalEvidenceAccessAudit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
