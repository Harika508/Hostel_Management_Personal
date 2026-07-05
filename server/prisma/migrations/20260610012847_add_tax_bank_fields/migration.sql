-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "gstAmount" DOUBLE PRECISION,
ADD COLUMN     "receiptNo" TEXT,
ADD COLUMN     "tdsAmount" DOUBLE PRECISION,
ADD COLUMN     "txnRef" TEXT;
