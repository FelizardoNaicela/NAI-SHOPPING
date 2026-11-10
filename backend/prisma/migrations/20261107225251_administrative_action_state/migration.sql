-- AlterTable
ALTER TABLE "AdministrativeAction" ADD COLUMN     "previousState" JSONB;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false;
