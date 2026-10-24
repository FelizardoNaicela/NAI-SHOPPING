-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'SHARED_MESSAGE';
ALTER TYPE "MessageType" ADD VALUE 'SHARED_PRODUCT';
ALTER TYPE "MessageType" ADD VALUE 'SHARED_POST';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "sharedMessageId" TEXT,
ADD COLUMN     "sharedPostId" TEXT,
ADD COLUMN     "sharedProductId" TEXT;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sharedMessageId_fkey" FOREIGN KEY ("sharedMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sharedProductId_fkey" FOREIGN KEY ("sharedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sharedPostId_fkey" FOREIGN KEY ("sharedPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
