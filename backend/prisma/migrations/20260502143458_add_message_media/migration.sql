-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "content" DROP NOT NULL;
