-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "readAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
