-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('FOOD', 'ROOM', 'STAFF', 'GENERAL');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('UNREAD', 'READ', 'RESOLVED');

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "breakfast" BOOLEAN NOT NULL DEFAULT false,
    "lunch" BOOLEAN NOT NULL DEFAULT false,
    "dinner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "category" "FeedbackCategory" NOT NULL DEFAULT 'GENERAL',
    "rating" INTEGER NOT NULL DEFAULT 5,
    "message" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'UNREAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_studentId_day_key" ON "MealPlan"("studentId", "day");

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
