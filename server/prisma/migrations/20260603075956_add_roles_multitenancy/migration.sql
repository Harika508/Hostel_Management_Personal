/*
  Warnings:

  - You are about to drop the column `hostelId` on the `FeatureFlag` table. All the data in the column will be lost.
  - You are about to drop the column `hostelId` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `hostelId` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `hostelId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Hostel` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `FeatureFlag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'STUDENT');

-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "FeatureFlag" DROP CONSTRAINT "FeatureFlag_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_hostelId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_hostelId_fkey";

-- AlterTable
ALTER TABLE "FeatureFlag" DROP COLUMN "hostelId",
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "hostelId",
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "hostelId",
ADD COLUMN     "organizationId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "hostelId",
ADD COLUMN     "organizationId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER;

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "Hostel";

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "hostelCode" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_hostelCode_key" ON "Organization"("hostelCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
