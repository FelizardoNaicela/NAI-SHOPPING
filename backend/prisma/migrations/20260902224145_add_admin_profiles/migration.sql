-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'REGIONAL_ADMIN');

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminRole" "AdminRole" NOT NULL,
    "status" "AdminStatus" NOT NULL DEFAULT 'ACTIVE',
    "region" TEXT,
    "canManageVerifications" BOOLEAN NOT NULL DEFAULT false,
    "canApproveVerifications" BOOLEAN NOT NULL DEFAULT false,
    "canRevokeVerifications" BOOLEAN NOT NULL DEFAULT false,
    "canManageStores" BOOLEAN NOT NULL DEFAULT false,
    "canManageRanking" BOOLEAN NOT NULL DEFAULT false,
    "canPromoteRegionalAdmins" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE INDEX "AdminProfile_adminRole_idx" ON "AdminProfile"("adminRole");

-- CreateIndex
CREATE INDEX "AdminProfile_status_idx" ON "AdminProfile"("status");

-- CreateIndex
CREATE INDEX "AdminProfile_region_idx" ON "AdminProfile"("region");

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
