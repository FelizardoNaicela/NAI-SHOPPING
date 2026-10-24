-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'VIDEO';
ALTER TYPE "MessageType" ADD VALUE 'DOCUMENT';
ALTER TYPE "MessageType" ADD VALUE 'LOCATION';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "documentName" TEXT,
ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "videoUrl" TEXT;
