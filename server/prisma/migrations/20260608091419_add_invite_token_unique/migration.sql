/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");
