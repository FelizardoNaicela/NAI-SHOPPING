-- CreateEnum
CREATE TYPE "LegalHoldStatus" AS ENUM ('ACTIVE', 'RELEASED');

-- CreateTable
CREATE TABLE "LegalHold" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "LegalHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT,
    "storeId" TEXT,
    "conversationId" TEXT,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "releaseReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalHold_investigationId_key" ON "LegalHold"("investigationId");

-- CreateIndex
CREATE INDEX "LegalHold_createdById_idx" ON "LegalHold"("createdById");

-- CreateIndex
CREATE INDEX "LegalHold_status_idx" ON "LegalHold"("status");

-- CreateIndex
CREATE INDEX "LegalHold_userId_idx" ON "LegalHold"("userId");

-- CreateIndex
CREATE INDEX "LegalHold_storeId_idx" ON "LegalHold"("storeId");

-- CreateIndex
CREATE INDEX "LegalHold_conversationId_idx" ON "LegalHold"("conversationId");

-- CreateIndex
CREATE INDEX "LegalHold_createdAt_idx" ON "LegalHold"("createdAt");

-- AddForeignKey
ALTER TABLE "LegalHold" ADD CONSTRAINT "LegalHold_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "LegalInvestigationAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalHold" ADD CONSTRAINT "LegalHold_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
