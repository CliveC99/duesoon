"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deadlineSchema, moduleSchema, statusSchema } from "@/lib/data-validation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export type DataActionState = { error?: string };

function firstError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export async function createModule(_state: DataActionState, formData: FormData): Promise<DataActionState> {
  const userId = await requireUserId();
  const parsed = moduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  await prisma.module.create({ data: { ...parsed.data, userId } });
  revalidatePath("/modules");
  redirect("/modules");
}

export async function updateModule(id: string, _state: DataActionState, formData: FormData): Promise<DataActionState> {
  const userId = await requireUserId();
  const parsed = moduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const result = await prisma.module.updateMany({ where: { id, userId }, data: parsed.data });
  if (result.count !== 1) return { error: "Module not found." };
  revalidatePath("/modules"); revalidatePath("/dashboard");
  redirect("/modules");
}

export async function deleteModule(id: string, _state: DataActionState, _formData: FormData): Promise<DataActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const moduleRecord = await prisma.module.findFirst({ where: { id, userId }, select: { _count: { select: { deadlines: true } } } });
  if (!moduleRecord) return { error: "Module not found." };
  if (moduleRecord._count.deadlines > 0) return { error: "Delete or move this module’s deadlines first." };
  await prisma.module.deleteMany({ where: { id, userId } });
  revalidatePath("/modules");
  redirect("/modules");
}

async function ownedModuleExists(moduleId: string, userId: string) {
  return Boolean(await prisma.module.findFirst({ where: { id: moduleId, userId }, select: { id: true } }));
}

export async function createDeadline(_state: DataActionState, formData: FormData): Promise<DataActionState> {
  const userId = await requireUserId();
  const parsed = deadlineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!await ownedModuleExists(parsed.data.moduleId, userId)) return { error: "Choose one of your modules." };
  await prisma.deadline.create({ data: { ...parsed.data, userId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateDeadline(id: string, _state: DataActionState, formData: FormData): Promise<DataActionState> {
  const userId = await requireUserId();
  const parsed = deadlineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!await ownedModuleExists(parsed.data.moduleId, userId)) return { error: "Choose one of your modules." };
  const result = await prisma.deadline.updateMany({ where: { id, userId }, data: parsed.data });
  if (result.count !== 1) return { error: "Deadline not found." };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteDeadline(id: string, _state: DataActionState, _formData: FormData): Promise<DataActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const result = await prisma.deadline.deleteMany({ where: { id, userId } });
  if (result.count !== 1) return { error: "Deadline not found." };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateDeadlineStatus(formData: FormData) {
  const userId = await requireUserId();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.deadline.updateMany({ where: { id: parsed.data.id, userId }, data: { status: parsed.data.status } });
  revalidatePath("/dashboard");
}
