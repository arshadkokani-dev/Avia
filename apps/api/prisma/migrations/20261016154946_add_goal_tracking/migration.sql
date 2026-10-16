-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('MILESTONE', 'RECURRING');

-- CreateEnum
CREATE TYPE "GoalFrequency" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "TrackingMode" AS ENUM ('QUANTITY', 'COMPLETION');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "area" TEXT NOT NULL DEFAULT 'Learning',
ADD COLUMN     "dailyTarget" DOUBLE PRECISION,
ADD COLUMN     "frequency" "GoalFrequency",
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetDate" TIMESTAMP(3),
ADD COLUMN     "trackingMode" "TrackingMode",
ADD COLUMN     "type" "GoalType" NOT NULL DEFAULT 'MILESTONE',
ADD COLUMN     "unit" TEXT;

-- CreateTable
CREATE TABLE "GoalTracking" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "goalId" TEXT NOT NULL,

    CONSTRAINT "GoalTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalTracking_goalId_periodStart_idx" ON "GoalTracking"("goalId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "GoalTracking_goalId_periodStart_key" ON "GoalTracking"("goalId", "periodStart");

-- AddForeignKey
ALTER TABLE "GoalTracking" ADD CONSTRAINT "GoalTracking_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
