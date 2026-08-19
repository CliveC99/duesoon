-- CreateEnum
CREATE TYPE "TimetableSyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "TimetableEventStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "TimetableSource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedCiphertext" BYTEA NOT NULL,
    "feedIv" BYTEA NOT NULL,
    "feedAuthTag" BYTEA NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncStatus" "TimetableSyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncErrorSafe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalUid" TEXT NOT NULL,
    "recurrenceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "status" "TimetableEventStatus" NOT NULL DEFAULT 'CONFIRMED',
    "sourceUpdatedAt" TIMESTAMP(3),
    "sequence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimetableSource_userId_key" ON "TimetableSource"("userId");
CREATE UNIQUE INDEX "TimetableSource_id_userId_key" ON "TimetableSource"("id", "userId");
CREATE INDEX "TimetableSource_userId_lastSyncStatus_idx" ON "TimetableSource"("userId", "lastSyncStatus");
CREATE UNIQUE INDEX "TimetableEvent_sourceId_userId_externalUid_recurrenceKey_key" ON "TimetableEvent"("sourceId", "userId", "externalUid", "recurrenceKey");
CREATE INDEX "TimetableEvent_userId_startAt_idx" ON "TimetableEvent"("userId", "startAt");
CREATE INDEX "TimetableEvent_sourceId_startAt_idx" ON "TimetableEvent"("sourceId", "startAt");

-- AddForeignKey
ALTER TABLE "TimetableSource" ADD CONSTRAINT "TimetableSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableEvent" ADD CONSTRAINT "TimetableEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableEvent" ADD CONSTRAINT "TimetableEvent_sourceId_userId_fkey" FOREIGN KEY ("sourceId", "userId") REFERENCES "TimetableSource"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
