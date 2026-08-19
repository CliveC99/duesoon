"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { encryptTimetableUrl } from "@/lib/timetable-crypto";
import { normaliseTimetableUrl, TimetableUrlError } from "@/lib/timetable-url";
import { syncTimetableSource } from "@/lib/timetable-sync";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export type TimetableActionState = { error?: string; success?: string };
const feedSchema = z.string().trim().min(1, "Paste your iCal subscription URL.").max(2_000, "Feed URL is too long.");

function refreshTimetableViews() {
  revalidatePath("/timetable");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function connectTimetable(_state: TimetableActionState, formData: FormData): Promise<TimetableActionState> {
  const userId = await requireUserId();
  const parsed = feedSchema.safeParse(formData.get("feedUrl"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Feed URL is invalid." };

  let url: URL;
  try { url = normaliseTimetableUrl(parsed.data); } catch (error) {
    return { error: error instanceof TimetableUrlError ? error.safeMessage : "Feed URL is invalid." };
  }

  let encrypted;
  try { encrypted = encryptTimetableUrl(url.toString(), userId); } catch { return { error: "Timetable encryption is not configured." }; }

  const source = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.timetableSource.findUnique({ where: { userId }, select: { id: true } });
    if (existing) {
      await transaction.timetableEvent.deleteMany({ where: { sourceId: existing.id, userId } });
      return transaction.timetableSource.update({ where: { id_userId: { id: existing.id, userId } }, data: { feedCiphertext: encrypted.ciphertext, feedIv: encrypted.iv, feedAuthTag: encrypted.authTag, lastSyncStatus: "PENDING", lastSyncErrorSafe: null, lastSyncedAt: null } });
    }
    return transaction.timetableSource.create({ data: { userId, feedCiphertext: encrypted.ciphertext, feedIv: encrypted.iv, feedAuthTag: encrypted.authTag } });
  });

  const result = await syncTimetableSource(source.id, userId);
  refreshTimetableViews();
  return result.success ? { success: `Timetable connected. ${result.eventCount} ${result.eventCount === 1 ? "class" : "classes"} synced.` } : { error: `${result.error}. The private URL was saved so you can try again.` };
}

export async function syncTimetable(_state: TimetableActionState, _formData: FormData): Promise<TimetableActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const source = await prisma.timetableSource.findUnique({ where: { userId }, select: { id: true } });
  if (!source) return { error: "Connect a timetable before syncing." };
  const result = await syncTimetableSource(source.id, userId);
  refreshTimetableViews();
  return result.success ? { success: `${result.eventCount} ${result.eventCount === 1 ? "class" : "classes"} synced.` } : { error: result.error };
}

export async function disconnectTimetable(_state: TimetableActionState, _formData: FormData): Promise<TimetableActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  await prisma.$transaction(async (transaction) => {
    const source = await transaction.timetableSource.findUnique({ where: { userId }, select: { id: true } });
    if (!source) return;
    await transaction.timetableEvent.deleteMany({ where: { sourceId: source.id, userId } });
    await transaction.timetableSource.deleteMany({ where: { id: source.id, userId } });
  });
  refreshTimetableViews();
  return { success: "Timetable disconnected." };
}
