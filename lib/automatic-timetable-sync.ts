import "server-only";

import { prisma } from "@/lib/prisma";
import { syncTimetableSource } from "@/lib/timetable-sync";
import { syncTimetableSources, type TimetableBatchSummary } from "@/lib/timetable-sync-batch";

const AUTOMATIC_SYNC_LOCK = "duesoon:automatic-timetable-sync";

export type AutomaticSyncResult =
  | { acquired: true; summary: TimetableBatchSummary }
  | { acquired: false };

export async function runAutomaticTimetableSync(): Promise<AutomaticSyncResult> {
  return prisma.$transaction(async (transaction) => {
    const rows = await transaction.$queryRaw<Array<{ acquired: boolean }>>`
      SELECT pg_try_advisory_xact_lock(hashtext(${AUTOMATIC_SYNC_LOCK})) AS acquired
    `;
    if (!rows[0]?.acquired) return { acquired: false };

    const sources = await transaction.timetableSource.findMany({
      select: { id: true, userId: true },
      orderBy: { createdAt: "asc" },
    });
    const summary = await syncTimetableSources(sources, (sourceId, userId) => syncTimetableSource(sourceId, userId, { logFailure: false }));
    return { acquired: true, summary };
  }, { maxWait: 10_000, timeout: 30 * 60_000 });
}
