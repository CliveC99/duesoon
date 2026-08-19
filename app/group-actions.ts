"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { groupSchema, sharedDeadlineImportSchema, sharedDeadlineSchema } from "@/lib/data-validation";
import { membershipKey, ownedRecordWhere, sharedCommonFields, sharedDeadlineMemberWhere } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { isUniqueConstraintError } from "@/lib/prisma-errors";

export type GroupActionState = { error?: string };

function firstError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

function inviteToken() {
  return randomBytes(32).toString("base64url");
}

async function membership(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({ where: membershipKey(groupId, userId), select: { role: true } });
}

export async function createGroup(_state: GroupActionState, formData: FormData): Promise<GroupActionState> {
  const userId = await requireUserId();
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const group = await prisma.$transaction(async (transaction) => {
    const created = await transaction.group.create({ data: { name: parsed.data.name, ownerId: userId, inviteToken: inviteToken() } });
    await transaction.groupMember.create({ data: { groupId: created.id, userId, role: "OWNER" } });
    return created;
  });
  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function joinGroup(token: string, _state: GroupActionState, _formData: FormData): Promise<GroupActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const group = await prisma.group.findUnique({ where: { inviteToken: token }, select: { id: true } });
  if (!group) return { error: "This invite is invalid or has been revoked." };
  if (await membership(group.id, userId)) return { error: "You are already a member of this group." };
  try {
    await prisma.groupMember.create({ data: { groupId: group.id, userId, role: "MEMBER" } });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: "You are already a member of this group." };
    throw error;
  }
  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function regenerateGroupInvite(groupId: string, _state: GroupActionState, _formData: FormData): Promise<GroupActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const result = await prisma.group.updateMany({ where: { id: groupId, ownerId: userId }, data: { inviteToken: inviteToken() } });
  if (result.count !== 1) return { error: "Only the group owner can regenerate the invite." };
  revalidatePath(`/groups/${groupId}`);
  return {};
}

export async function revokeGroupInvite(groupId: string, _state: GroupActionState, _formData: FormData): Promise<GroupActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const result = await prisma.group.updateMany({ where: { id: groupId, ownerId: userId }, data: { inviteToken: null } });
  if (result.count !== 1) return { error: "Only the group owner can revoke the invite." };
  revalidatePath(`/groups/${groupId}`);
  return {};
}

export async function leaveGroup(groupId: string, _state: GroupActionState, _formData: FormData): Promise<GroupActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const member = await membership(groupId, userId);
  if (!member) return { error: "Group not found." };
  if (member.role === "OWNER") return { error: "The owner cannot leave. Delete the group instead." };
  await prisma.$transaction([
    prisma.deadline.updateMany({ where: { userId, sharedDeadline: { groupId } }, data: { sharedDeadlineId: null } }),
    prisma.groupMember.delete({ where: membershipKey(groupId, userId) }),
  ]);
  revalidatePath("/groups");
  redirect("/groups");
}

export async function removeGroupMember(groupId: string, memberUserId: string, _state: GroupActionState, _formData: FormData): Promise<GroupActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId: userId }, select: { ownerId: true } });
  if (!group) return { error: "Only the group owner can remove members." };
  if (memberUserId === group.ownerId) return { error: "The owner cannot be removed." };
  await prisma.$transaction([
    prisma.deadline.updateMany({ where: { userId: memberUserId, sharedDeadline: { groupId } }, data: { sharedDeadlineId: null } }),
    prisma.groupMember.deleteMany({ where: { groupId, userId: memberUserId, role: "MEMBER" } }),
  ]);
  revalidatePath(`/groups/${groupId}`);
  return {};
}

export async function deleteGroup(groupId: string, _state: GroupActionState, _formData: FormData): Promise<GroupActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const result = await prisma.group.deleteMany({ where: { id: groupId, ownerId: userId } });
  if (result.count !== 1) return { error: "Only the group owner can delete this group." };
  revalidatePath("/groups");
  redirect("/groups");
}

export async function createSharedDeadline(groupId: string, _state: GroupActionState, formData: FormData): Promise<GroupActionState> {
  const userId = await requireUserId();
  const parsed = sharedDeadlineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!await membership(groupId, userId)) return { error: "Group not found." };
  await prisma.sharedDeadline.create({ data: { ...parsed.data, groupId, createdById: userId } });
  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function updateSharedDeadline(groupId: string, sharedDeadlineId: string, _state: GroupActionState, formData: FormData): Promise<GroupActionState> {
  const userId = await requireUserId();
  const parsed = sharedDeadlineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const shared = await prisma.sharedDeadline.findFirst({ where: sharedDeadlineMemberWhere(sharedDeadlineId, groupId, userId), select: { createdById: true, group: { select: { ownerId: true } } } });
  if (!shared) return { error: "Shared deadline not found." };
  if (shared.createdById !== userId && shared.group.ownerId !== userId) return { error: "Only the creator or group owner can edit this deadline." };
  await prisma.$transaction([
    prisma.sharedDeadline.update({ where: { id: sharedDeadlineId }, data: parsed.data }),
    prisma.deadline.updateMany({ where: { sharedDeadlineId }, data: sharedCommonFields(parsed.data) }),
  ]);
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  redirect(`/groups/${groupId}`);
}

export async function deleteSharedDeadline(groupId: string, sharedDeadlineId: string, _state: GroupActionState, _formData: FormData): Promise<GroupActionState> {
  void _state; void _formData;
  const userId = await requireUserId();
  const shared = await prisma.sharedDeadline.findFirst({ where: sharedDeadlineMemberWhere(sharedDeadlineId, groupId, userId), select: { createdById: true, group: { select: { ownerId: true } } } });
  if (!shared) return { error: "Shared deadline not found." };
  if (shared.createdById !== userId && shared.group.ownerId !== userId) return { error: "Only the creator or group owner can delete this deadline." };
  await prisma.sharedDeadline.delete({ where: { id: sharedDeadlineId } });
  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function importSharedDeadline(groupId: string, sharedDeadlineId: string, _state: GroupActionState, formData: FormData): Promise<GroupActionState> {
  const userId = await requireUserId();
  const parsed = sharedDeadlineImportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const [shared, moduleRecord] = await Promise.all([
    prisma.sharedDeadline.findFirst({ where: sharedDeadlineMemberWhere(sharedDeadlineId, groupId, userId) }),
    prisma.module.findFirst({ where: ownedRecordWhere(parsed.data.moduleId, userId), select: { id: true } }),
  ]);
  if (!shared) return { error: "Shared deadline not found." };
  if (!moduleRecord) return { error: "Choose one of your modules." };
  try {
    await prisma.deadline.create({ data: { userId, moduleId: moduleRecord.id, sharedDeadlineId: shared.id, title: shared.title, type: shared.type, dueAt: shared.dueAt, weighting: shared.weighting, status: "NOT_STARTED", reminderDaysBefore: parsed.data.reminderDaysBefore, notes: null } });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: "This shared deadline is already in your deadlines." };
    throw error;
  }
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  redirect("/dashboard");
}
