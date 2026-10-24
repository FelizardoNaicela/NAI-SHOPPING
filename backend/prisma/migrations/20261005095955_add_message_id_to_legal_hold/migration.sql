-- AlterTable
ALTER TABLE "LegalHold" ADD COLUMN     "messageId" TEXT;

-- CreateIndex
CREATE INDEX "LegalHold_messageId_idx" ON "LegalHold"("messageId");
