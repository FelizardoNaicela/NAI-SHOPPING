-- CreateTable
CREATE TABLE "LegalInvestigationDeniedAttempt" (
    "id" TEXT NOT NULL,
    "requestedById" TEXT,
    "investigationId" TEXT,
    "reason" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "method" TEXT,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalInvestigationDeniedAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalInvestigationDeniedAttempt_requestedById_idx" ON "LegalInvestigationDeniedAttempt"("requestedById");

-- CreateIndex
CREATE INDEX "LegalInvestigationDeniedAttempt_investigationId_idx" ON "LegalInvestigationDeniedAttempt"("investigationId");

-- CreateIndex
CREATE INDEX "LegalInvestigationDeniedAttempt_createdAt_idx" ON "LegalInvestigationDeniedAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "LegalInvestigationDeniedAttempt" ADD CONSTRAINT "LegalInvestigationDeniedAttempt_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
