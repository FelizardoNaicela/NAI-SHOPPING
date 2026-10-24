-- CreateEnum
CREATE TYPE "LegalInvestigationQueryStatus" AS ENUM ('STARTED', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "LegalInvestigationQueryAudit" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "userId" TEXT,
    "storeId" TEXT,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "searchTerm" TEXT,
    "messageType" "MessageType",
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" "LegalInvestigationQueryStatus" NOT NULL DEFAULT 'STARTED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LegalInvestigationQueryAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalInvestigationQueryAudit_investigationId_idx" ON "LegalInvestigationQueryAudit"("investigationId");

-- CreateIndex
CREATE INDEX "LegalInvestigationQueryAudit_requestedById_idx" ON "LegalInvestigationQueryAudit"("requestedById");

-- CreateIndex
CREATE INDEX "LegalInvestigationQueryAudit_conversationId_idx" ON "LegalInvestigationQueryAudit"("conversationId");

-- CreateIndex
CREATE INDEX "LegalInvestigationQueryAudit_messageId_idx" ON "LegalInvestigationQueryAudit"("messageId");

-- CreateIndex
CREATE INDEX "LegalInvestigationQueryAudit_userId_idx" ON "LegalInvestigationQueryAudit"("userId");

-- CreateIndex
CREATE INDEX "LegalInvestigationQueryAudit_storeId_idx" ON "LegalInvestigationQueryAudit"("storeId");

-- CreateIndex
CREATE INDEX "LegalInvestigationQueryAudit_createdAt_idx" ON "LegalInvestigationQueryAudit"("createdAt");

-- AddForeignKey
ALTER TABLE "LegalInvestigationQueryAudit" ADD CONSTRAINT "LegalInvestigationQueryAudit_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "LegalInvestigationAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalInvestigationQueryAudit" ADD CONSTRAINT "LegalInvestigationQueryAudit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
