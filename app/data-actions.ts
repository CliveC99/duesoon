"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deadlineSchema, moduleSchema, semesterSchema, statusSchema } from "@/lib/data-validation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export type SemesterFormValues = { name: string; academicYear: string; startDate: string; endDate: string; isActive: boolean };
export type DataActionState = { error?: string; fieldErrors?: Record<string, string[]>; semesterValues?: SemesterFormValues };

function firstError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export async function createModule(_state: DataActionState, formData: FormData): Promise<DataActionState> {
  const userId = await requireUserId();
  const parsed = moduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!await ownedSemesterExists(parsed.data.semesterId, userId)) return { error: "Choose one of your semesters." };
  await prisma.module.create({ data: { ...parsed.data, userId } });
  revalidatePath("/modules");
  redirect("/modules");
}

export async function updateModule(id: string, _state: DataActionState, formData: FormData): Promise<DataActionState> {
  const userId = await requireUserId();
  const parsed = moduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!await ownedSemesterExists(parsed.data.semesterId, userId)) return { error: "Choose one of your semesters." };
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

function semesterValuesFrom(formData: FormData): SemesterFormValues {
  return {
    name: String(formData.get("name") ?? "Semester 1"),
    academicYear: String(formData.get("academicYear") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    isActive: formData.get("isActive") === "on",
  };
}

function semesterValidationError(formData: FormData, error: { flatten: () => { fieldErrors: Record<string, string[]> } }): DataActionState {
  return { fieldErrors: error.flatten().fieldErrors, semesterValues: semesterValuesFrom(formData) };
}

async function ownedSemesterExists(semesterId: string, userId: string) {
  return Boolean(await prisma.semester.findFirst({ where: { id: semesterId, userId }, select: { id: true } }));
}

export async function createSemester(_state: DataActionState, formData: FormData): Promise<DataActionState> {
  const userId = await requireUserId();
  const parsed = semesterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return semesterValidationError(formData, parsed.error);
  await prisma.$transaction(async (transaction) => {
    if (parsed.data.isActive) await transaction.semester.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
    await transaction.semester.create({ data: { ...parsed.data, userId } });
  });
  revalidatePath("/semesters"); revalidatePath("/modules"); revalidatePath("/dashboard");
  redirect("/semesters");
}

export async function updateSemester(id: string, _state: DataActionState, formData: FormData): Promise<DataActionState> {
  const userId = await requireUserId();
  const parsed = semesterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return semesterValidationError(formData, parsed.error);
  const result = await prisma.$transaction(async (transaction) => {
    if (parsed.data.isActive) await transaction.semester.updateMany({ where: { userId, isActive: true, id: { not: id } }, data: { isActive: false } });
    return transaction.semester.updateMany({ where: { id, userId }, data: parsed.data });
  });
  if (result.count !== 1) return { error: "Semester not found." };
  revalidatePath("/semesters"); revalidatePath("/modules"); revalidatePath("/dashboard");
  redirect("/semesters");
}

export async function setActiveSemester(id: string, _state: DataActionState, _formData: FormData): Promise<DataActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const semester = await prisma.semester.findFirst({ where: { id, userId }, select: { id: true } });
  if (!semester) return { error: "Semester not found." };
  await prisma.$transaction([
    prisma.semester.updateMany({ where: { userId, isActive: true }, data: { isActive: false } }),
    prisma.semester.updateMany({ where: { id, userId }, data: { isActive: true } }),
  ]);
  revalidatePath("/semesters"); revalidatePath("/dashboard");
  redirect("/semesters");
}

export async function deleteSemester(id: string, _state: DataActionState, _formData: FormData): Promise<DataActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const semester = await prisma.semester.findFirst({ where: { id, userId }, select: { _count: { select: { modules: true } } } });
  if (!semester) return { error: "Semester not found." };
  if (semester._count.modules > 0) return { error: "Move or delete this semester’s modules first." };
  await prisma.semester.deleteMany({ where: { id, userId } });
  revalidatePath("/semesters"); revalidatePath("/dashboard");
  redirect("/semesters");
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
