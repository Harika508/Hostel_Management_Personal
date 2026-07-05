-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "reminderDaysBefore" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "lastReminderSent" TIMESTAMP(3);
