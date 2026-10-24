-- CreateEnum
CREATE TYPE "LegalInvestigatorStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'LEGAL_INVESTIGATOR';

-- CreateTable
CREATE TABLE "LegalInvestigatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "LegalInvestigatorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalInvestigatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalInvestigatorProfile_userId_key" ON "LegalInvestigatorProfile"("userId");

-- CreateIndex
CREATE INDEX "LegalInvestigatorProfile_status_idx" ON "LegalInvestigatorProfile"("status");

-- AddForeignKey
ALTER TABLE "LegalInvestigatorProfile" ADD CONSTRAINT "LegalInvestigatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
