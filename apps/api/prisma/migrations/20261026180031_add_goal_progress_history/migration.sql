-- CreateTable
CREATE TABLE "GoalProgressHistory" (
    "id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalId" TEXT NOT NULL,

    CONSTRAINT "GoalProgressHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalProgressHistory_goalId_createdAt_idx" ON "GoalProgressHistory"("goalId", "createdAt");

-- AddForeignKey
ALTER TABLE "GoalProgressHistory" ADD CONSTRAINT "GoalProgressHistory_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
