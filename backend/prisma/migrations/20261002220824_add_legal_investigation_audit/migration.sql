-- CreateEnum
CREATE TYPE "LegalInvestigationStatus" AS ENUM ('STARTED', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "LegalInvestigationAudit" (
    "id" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "legalReference" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "userId" TEXT,
    "storeId" TEXT,
    "conversationId" TEXT,
    "messageId" TEXT,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "searchTerm" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" "LegalInvestigationStatus" NOT NULL DEFAULT 'COMPLETED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalInvestigationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalInvestigationAudit_requestedById_idx" ON "LegalInvestigationAudit"("requestedById");

-- CreateIndex
CREATE INDEX "LegalInvestigationAudit_legalReference_idx" ON "LegalInvestigationAudit"("legalReference");

-- CreateIndex
CREATE INDEX "LegalInvestigationAudit_userId_idx" ON "LegalInvestigationAudit"("userId");

-- CreateIndex
CREATE INDEX "LegalInvestigationAudit_storeId_idx" ON "LegalInvestigationAudit"("storeId");

-- CreateIndex
CREATE INDEX "LegalInvestigationAudit_conversationId_idx" ON "LegalInvestigationAudit"("conversationId");

-- CreateIndex
CREATE INDEX "LegalInvestigationAudit_messageId_idx" ON "LegalInvestigationAudit"("messageId");

-- CreateIndex
CREATE INDEX "LegalInvestigationAudit_createdAt_idx" ON "LegalInvestigationAudit"("createdAt");

-- AddForeignKey
ALTER TABLE "LegalInvestigationAudit" ADD CONSTRAINT "LegalInvestigationAudit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
