-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankIfsc" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "pan" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "basicSalary" DOUBLE PRECISION,
ADD COLUMN     "da" DOUBLE PRECISION,
ADD COLUMN     "hra" DOUBLE PRECISION,
ADD COLUMN     "pf" DOUBLE PRECISION,
ADD COLUMN     "tdsDeduction" DOUBLE PRECISION;
