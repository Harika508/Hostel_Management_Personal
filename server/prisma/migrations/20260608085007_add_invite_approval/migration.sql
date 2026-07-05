-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inviteExpiry" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;
