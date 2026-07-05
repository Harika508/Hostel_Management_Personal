-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('VACANT', 'OCCUPIED', 'LEAVING_SOON');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('VACANT', 'OCCUPIED', 'LEAVING_SOON');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('PAID', 'UNPAID');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('ENTRY', 'EXIT');

-- CreateTable
CREATE TABLE "Hostel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "adminEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "hostelId" INTEGER NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "totalBeds" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'VACANT',

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "bedLabel" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'VACANT',

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "hostelId" INTEGER NOT NULL,
    "bedId" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "kycDocumentUrl" TEXT,
    "mealBreakfast" BOOLEAN NOT NULL DEFAULT false,
    "mealLunch" BOOLEAN NOT NULL DEFAULT false,
    "mealDinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "hostelId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "monthlySalary" DOUBLE PRECISION NOT NULL,
    "salaryStatus" "SalaryStatus" NOT NULL DEFAULT 'UNPAID',
    "salaryPaidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "nfcCardId" TEXT NOT NULL,
    "accessTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessType" "AccessType" NOT NULL DEFAULT 'ENTRY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" SERIAL NOT NULL,
    "hostelId" INTEGER NOT NULL,
    "flagName" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "hostelId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_bedId_key" ON "Student"("bedId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
