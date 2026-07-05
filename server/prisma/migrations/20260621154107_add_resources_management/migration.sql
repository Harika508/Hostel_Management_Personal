-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('GOOD', 'DAMAGED', 'UNDER_REPAIR', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "FacilityStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" "ItemCondition" NOT NULL DEFAULT 'GOOD',
    "roomId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "FacilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" "RequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reportedById" INTEGER NOT NULL,
    "reportedByRole" TEXT NOT NULL,
    "reportedByName" TEXT NOT NULL,
    "roomNumber" TEXT,
    "assignedToId" INTEGER,
    "resolvedById" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
