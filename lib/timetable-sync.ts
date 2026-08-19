import "server-only";

import { decryptTimetableUrl } from "@/lib/timetable-crypto";
import { fetchTimetableFeed, TimetableFetchError } from "@/lib/timetable-fetch";
import { parseTimetableFeed } from "@/lib/timetable-parser";
import { TimetableUrlError, type TimetableFailureCode } from "@/lib/timetable-url";
import { prisma } from "@/lib/prisma";

export type TimetableSyncResult = { success: true; eventCount: number } | { success: false; error: string };

type ClassifiedFailure = { code: TimetableFailureCode; safeMessage: string; detail?: string };

export function classifySyncFailure(error: unknown): ClassifiedFailure {
  if (error instanceof TimetableFetchError) return { code: error.code, safeMessage: error.safeMessage, detail: error.detail };
  if (error instanceof TimetableUrlError) return { code: error.code, safeMessage: error.safeMessage };
  return { code: "PARSER_FAILURE", safeMessage: "Timetable feed could not be parsed" };
}

function logSyncFailure(sourceId: string, failure: ClassifiedFailure) {
  console.warn("[DueSoon timetable sync]", { sourceId, code: failure.code, ...(failure.detail ? { detail: failure.detail } : {}) });
}

export async function syncTimetableSource(sourceId: string, userId: string): Promise<TimetableSyncResult> {
  const source = await prisma.timetableSource.findFirst({ where: { id: sourceId, userId } });
  if (!source) return { success: false, error: "Timetable connection not found" };
  await prisma.timetableSource.updateMany({ where: { id: sourceId, userId }, data: { lastSyncStatus: "SYNCING", lastSyncErrorSafe: null } });

  try {
    let url: string;
    try { url = decryptTimetableUrl({ ciphertext: Buffer.from(source.feedCiphertext), iv: Buffer.from(source.feedIv), authTag: Buffer.from(source.feedAuthTag) }, userId); } catch {
      throw new TimetableFetchError("ENCRYPTION_FAILURE", "Timetable connection could not be read");
    }
    const response = await fetchTimetableFeed(url);
    if (!response.body.includes("BEGIN:VCALENDAR") && (response.contentType === "text/html" || response.contentType === "application/json")) {
      throw new TimetableFetchError("CONTENT_TYPE_INVALID", "Timetable feed returned an unexpected response", response.contentType);
    }
    let events;
    try { events = parseTimetableFeed(response.body); } catch { throw new TimetableFetchError("PARSER_FAILURE", "Timetable feed could not be parsed", response.contentType ?? "unknown"); }
    const keys = events.map((event) => ({ externalUid: event.externalUid, recurrenceKey: event.recurrenceKey }));

    await prisma.$transaction(async (transaction) => {
      for (const event of events) {
        await transaction.timetableEvent.upsert({
          where: { sourceId_userId_externalUid_recurrenceKey: { sourceId, userId, externalUid: event.externalUid, recurrenceKey: event.recurrenceKey } },
          create: { ...event, sourceId, userId },
          update: event,
        });
      }
      await transaction.timetableEvent.deleteMany({ where: events.length ? { sourceId, userId, NOT: { OR: keys } } : { sourceId, userId } });
      await transaction.timetableSource.updateMany({
        where: { id: sourceId, userId },
        data: { lastSyncStatus: "SUCCESS", lastSyncErrorSafe: null, lastSyncedAt: new Date() },
      });
    });
    return { success: true, eventCount: events.length };
  } catch (error) {
    const failure = classifySyncFailure(error);
    logSyncFailure(sourceId, failure);
    await prisma.timetableSource.updateMany({ where: { id: sourceId, userId }, data: { lastSyncStatus: "FAILED", lastSyncErrorSafe: failure.safeMessage } });
    return { success: false, error: failure.safeMessage };
  }
}
