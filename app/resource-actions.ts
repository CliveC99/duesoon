"use server";

import { revalidatePath } from "next/cache";

import { ownedRecordWhere, ownedResourceWhere } from "@/lib/authorization";
import { deadlineResourceIdSchema, deadlineResourceSchema, nextResourcePosition } from "@/lib/deadline-resources";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export type ResourceActionState = { error?: string; values?: { label: string; url: string }; saved?: boolean };

function values(formData: FormData) {
  return { label: String(formData.get("label") ?? ""), url: String(formData.get("url") ?? "") };
}

function refresh(deadlineId: string) {
  revalidatePath(`/deadlines/${deadlineId}/edit`);
}

export async function createDeadlineResource(deadlineId: string, _state: ResourceActionState, formData: FormData): Promise<ResourceActionState> {
  const userId = await requireUserId();
  const entered = values(formData);
  const parsedDeadlineId = deadlineResourceIdSchema.safeParse(deadlineId);
  const parsed = deadlineResourceSchema.safeParse(entered);
  if (!parsedDeadlineId.success) return { error: "Deadline not found.", values: entered };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the resource details.", values: entered };
  const deadline = await prisma.deadline.findFirst({ where: ownedRecordWhere(deadlineId, userId), select: { id: true } });
  if (!deadline) return { error: "Deadline not found.", values: entered };
  const last = await prisma.deadlineResource.findFirst({ where: { deadlineId, userId }, select: { position: true }, orderBy: [{ position: "desc" }, { createdAt: "desc" }] });
  await prisma.deadlineResource.create({ data: { deadlineId, userId, ...parsed.data, position: nextResourcePosition(last ? [last.position] : []) } });
  refresh(deadlineId);
  return { saved: true };
}

export async function updateDeadlineResource(deadlineId: string, resourceId: string, _state: ResourceActionState, formData: FormData): Promise<ResourceActionState> {
  const userId = await requireUserId();
  const entered = values(formData);
  const validIds = deadlineResourceIdSchema.safeParse(deadlineId).success && deadlineResourceIdSchema.safeParse(resourceId).success;
  const parsed = deadlineResourceSchema.safeParse(entered);
  if (!validIds) return { error: "Resource not found.", values: entered };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the resource details.", values: entered };
  const result = await prisma.deadlineResource.updateMany({ where: ownedResourceWhere(resourceId, deadlineId, userId), data: parsed.data });
  if (result.count !== 1) return { error: "Resource not found.", values: entered };
  refresh(deadlineId);
  return { saved: true };
}

export async function deleteDeadlineResource(deadlineId: string, resourceId: string, formData: FormData) {
  const userId = await requireUserId();
  if (!deadlineResourceIdSchema.safeParse(deadlineId).success || !deadlineResourceIdSchema.safeParse(resourceId).success) return;
  await prisma.deadlineResource.deleteMany({ where: ownedResourceWhere(resourceId, deadlineId, userId) });
  void formData;
  refresh(deadlineId);
}

export async function moveDeadlineResource(deadlineId: string, resourceId: string, direction: "up" | "down", formData: FormData) {
  const userId = await requireUserId();
  if (!deadlineResourceIdSchema.safeParse(deadlineId).success || !deadlineResourceIdSchema.safeParse(resourceId).success || !["up", "down"].includes(direction)) return;
  await prisma.$transaction(async (transaction) => {
    const current = await transaction.deadlineResource.findFirst({ where: ownedResourceWhere(resourceId, deadlineId, userId), select: { id: true, position: true } });
    if (!current) return;
    const neighbour = await transaction.deadlineResource.findFirst({
      where: { deadlineId, userId, position: direction === "up" ? { lt: current.position } : { gt: current.position } },
      select: { id: true, position: true },
      orderBy: { position: direction === "up" ? "desc" : "asc" },
    });
    if (!neighbour) return;
    await transaction.deadlineResource.updateMany({ where: ownedResourceWhere(current.id, deadlineId, userId), data: { position: neighbour.position } });
    await transaction.deadlineResource.updateMany({ where: ownedResourceWhere(neighbour.id, deadlineId, userId), data: { position: current.position } });
  });
  void formData;
  refresh(deadlineId);
}
