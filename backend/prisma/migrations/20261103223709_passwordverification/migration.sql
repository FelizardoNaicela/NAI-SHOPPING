-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordResetCodeSalt" TEXT,
ADD COLUMN     "passwordResetLastSentAt" TIMESTAMP(3);
