-- DropIndex
DROP INDEX "Notification_userId_read_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "meta" JSONB;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
