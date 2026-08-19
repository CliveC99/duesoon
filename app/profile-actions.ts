"use server";

import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

import { changePasswordSchema, profileEmailSchema, profileNameSchema } from "@/lib/auth-validation";
import { updateSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export type ProfileActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
  values?: { name?: string; email?: string };
};

function refreshIdentityViews() {
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export async function updateProfileName(_state: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const userId = await requireUserId();
  const submittedName = String(formData.get("name") ?? "");
  const parsed = profileNameSchema.safeParse({ name: submittedName });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: { name: submittedName } };
  const result = await prisma.user.updateMany({ where: { id: userId }, data: { name: parsed.data.name } });
  if (result.count !== 1) return { error: "Unable to update your profile." };
  await updateSession({ user: { name: parsed.data.name } });
  refreshIdentityViews();
  return { success: "Name updated.", values: { name: parsed.data.name } };
}

export async function updateProfileEmail(_state: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const userId = await requireUserId();
  const submittedEmail = String(formData.get("email") ?? "");
  const parsed = profileEmailSchema.safeParse({ email: submittedEmail });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: { email: submittedEmail } };
  try {
    const result = await prisma.user.updateMany({ where: { id: userId }, data: { email: parsed.data.email } });
    if (result.count !== 1) return { error: "Unable to update your email address." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { fieldErrors: { email: ["An account with this email already exists."] }, values: { email: submittedEmail } };
    }
    throw error;
  }
  await updateSession({ user: { email: parsed.data.email } });
  refreshIdentityViews();
  return { success: "Email updated. Use this address the next time you sign in.", values: { email: parsed.data.email } };
}

export async function changePassword(_state: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const userId = await requireUserId();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user?.passwordHash || !await compare(parsed.data.currentPassword, user.passwordHash)) {
    return { fieldErrors: { currentPassword: ["Current password is incorrect."] } };
  }
  if (await compare(parsed.data.newPassword, user.passwordHash)) {
    return { fieldErrors: { newPassword: ["Choose a password different from your current password."] } };
  }
  const passwordHash = await hash(parsed.data.newPassword, 12);
  const result = await prisma.user.updateMany({ where: { id: userId }, data: { passwordHash } });
  if (result.count !== 1) return { error: "Unable to change your password." };
  return { success: "Password changed. Use your new password the next time you sign in." };
}
