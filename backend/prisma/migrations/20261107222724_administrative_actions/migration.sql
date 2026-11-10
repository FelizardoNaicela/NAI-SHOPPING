-- CreateEnum
CREATE TYPE "AdministrativeActionType" AS ENUM ('WARNING', 'CONTENT_REMOVAL', 'TEMPORARY_SUSPENSION', 'PERMANENT_SUSPENSION');

-- CreateEnum
CREATE TYPE "AdministrativeActionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'REVERSED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AdministrativeAction" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" "AdministrativeActionType" NOT NULL,
    "status" "AdministrativeActionStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" VARCHAR(2000) NOT NULL,
    "createdById" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "reversedById" TEXT,
    "reversalReason" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdministrativeAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdministrativeAction_reportId_idx" ON "AdministrativeAction"("reportId");

-- CreateIndex
CREATE INDEX "AdministrativeAction_targetType_targetId_idx" ON "AdministrativeAction"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdministrativeAction_type_status_idx" ON "AdministrativeAction"("type", "status");

-- CreateIndex
CREATE INDEX "AdministrativeAction_createdById_idx" ON "AdministrativeAction"("createdById");

-- CreateIndex
CREATE INDEX "AdministrativeAction_reversedById_idx" ON "AdministrativeAction"("reversedById");

-- CreateIndex
CREATE INDEX "AdministrativeAction_endsAt_idx" ON "AdministrativeAction"("endsAt");

-- CreateIndex
CREATE INDEX "AdministrativeAction_createdAt_idx" ON "AdministrativeAction"("createdAt");

-- AddForeignKey
ALTER TABLE "AdministrativeAction" ADD CONSTRAINT "AdministrativeAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeAction" ADD CONSTRAINT "AdministrativeAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeAction" ADD CONSTRAINT "AdministrativeAction_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
