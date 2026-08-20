CREATE TABLE "DeadlineSubtask" (
    "id" TEXT NOT NULL,
    "deadlineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeadlineSubtask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Deadline_id_userId_key" ON "Deadline"("id", "userId");
CREATE INDEX "DeadlineSubtask_deadlineId_userId_position_idx" ON "DeadlineSubtask"("deadlineId", "userId", "position");
CREATE INDEX "DeadlineSubtask_userId_idx" ON "DeadlineSubtask"("userId");

ALTER TABLE "DeadlineSubtask" ADD CONSTRAINT "DeadlineSubtask_deadlineId_userId_fkey" FOREIGN KEY ("deadlineId", "userId") REFERENCES "Deadline"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeadlineSubtask" ADD CONSTRAINT "DeadlineSubtask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
