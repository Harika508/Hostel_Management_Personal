/*
  Warnings:

  - You are about to drop the column `isApproved` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isApproved",
ADD COLUMN     "loginApproved" BOOLEAN NOT NULL DEFAULT false;
