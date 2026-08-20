CREATE TABLE "DeadlineResource" (
    "id" TEXT NOT NULL,
    "deadlineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeadlineResource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeadlineResource_deadlineId_userId_position_idx" ON "DeadlineResource"("deadlineId", "userId", "position");
CREATE INDEX "DeadlineResource_userId_idx" ON "DeadlineResource"("userId");

ALTER TABLE "DeadlineResource" ADD CONSTRAINT "DeadlineResource_deadlineId_userId_fkey" FOREIGN KEY ("deadlineId", "userId") REFERENCES "Deadline"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeadlineResource" ADD CONSTRAINT "DeadlineResource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
