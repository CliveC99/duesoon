"use server";

import { revalidatePath } from "next/cache";

import { ownedRecordWhere, ownedSubtaskWhere } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { nextSubtaskPosition, subtaskIdSchema, subtaskTitleSchema } from "@/lib/subtasks";

export type SubtaskActionState = { error?: string; value?: string; saved?: boolean };

function refresh(deadlineId: string) {
  revalidatePath(`/deadlines/${deadlineId}/edit`);
  revalidatePath("/dashboard");
}

export async function createSubtask(deadlineId: string, _state: SubtaskActionState, formData: FormData): Promise<SubtaskActionState> {
  const userId = await requireUserId();
  const parsedId = subtaskIdSchema.safeParse(deadlineId);
  const parsed = subtaskTitleSchema.safeParse(Object.fromEntries(formData));
  const value = String(formData.get("title") ?? "");
  if (!parsedId.success) return { error: "Deadline not found.", value };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the task title.", value };

  const deadline = await prisma.deadline.findFirst({ where: ownedRecordWhere(deadlineId, userId), select: { id: true } });
  if (!deadline) return { error: "Deadline not found.", value };
  const last = await prisma.deadlineSubtask.findFirst({ where: { deadlineId, userId }, select: { position: true }, orderBy: [{ position: "desc" }, { createdAt: "desc" }] });
  await prisma.deadlineSubtask.create({ data: { deadlineId, userId, title: parsed.data.title, position: nextSubtaskPosition(last ? [last.position] : []) } });
  refresh(deadlineId);
  return { saved: true };
}

export async function updateSubtask(deadlineId: string, subtaskId: string, _state: SubtaskActionState, formData: FormData): Promise<SubtaskActionState> {
  const userId = await requireUserId();
  const parsedId = subtaskIdSchema.safeParse(subtaskId);
  const parsed = subtaskTitleSchema.safeParse(Object.fromEntries(formData));
  const value = String(formData.get("title") ?? "");
  if (!parsedId.success || !subtaskIdSchema.safeParse(deadlineId).success) return { error: "Task not found.", value };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the task title.", value };
  const result = await prisma.deadlineSubtask.updateMany({ where: ownedSubtaskWhere(subtaskId, deadlineId, userId), data: { title: parsed.data.title } });
  if (result.count !== 1) return { error: "Task not found.", value };
  refresh(deadlineId);
  return { saved: true };
}

export async function toggleSubtask(deadlineId: string, subtaskId: string, formData: FormData) {
  const userId = await requireUserId();
  if (!subtaskIdSchema.safeParse(deadlineId).success || !subtaskIdSchema.safeParse(subtaskId).success) return;
  const current = await prisma.deadlineSubtask.findFirst({ where: ownedSubtaskWhere(subtaskId, deadlineId, userId), select: { isCompleted: true } });
  if (!current) return;
  await prisma.deadlineSubtask.updateMany({ where: ownedSubtaskWhere(subtaskId, deadlineId, userId), data: { isCompleted: !current.isCompleted } });
  void formData;
  refresh(deadlineId);
}

export async function deleteSubtask(deadlineId: string, subtaskId: string, formData: FormData) {
  const userId = await requireUserId();
  if (!subtaskIdSchema.safeParse(deadlineId).success || !subtaskIdSchema.safeParse(subtaskId).success) return;
  await prisma.deadlineSubtask.deleteMany({ where: ownedSubtaskWhere(subtaskId, deadlineId, userId) });
  void formData;
  refresh(deadlineId);
}

export async function moveSubtask(deadlineId: string, subtaskId: string, direction: "up" | "down", formData: FormData) {
  const userId = await requireUserId();
  if (!subtaskIdSchema.safeParse(deadlineId).success || !subtaskIdSchema.safeParse(subtaskId).success || !["up", "down"].includes(direction)) return;
  await prisma.$transaction(async (transaction) => {
    const current = await transaction.deadlineSubtask.findFirst({ where: ownedSubtaskWhere(subtaskId, deadlineId, userId), select: { id: true, position: true } });
    if (!current) return;
    const neighbour = await transaction.deadlineSubtask.findFirst({
      where: { deadlineId, userId, position: direction === "up" ? { lt: current.position } : { gt: current.position } },
      select: { id: true, position: true },
      orderBy: { position: direction === "up" ? "desc" : "asc" },
    });
    if (!neighbour) return;
    await transaction.deadlineSubtask.updateMany({ where: { id: current.id, deadlineId, userId }, data: { position: neighbour.position } });
    await transaction.deadlineSubtask.updateMany({ where: { id: neighbour.id, deadlineId, userId }, data: { position: current.position } });
  });
  void formData;
  refresh(deadlineId);
}
