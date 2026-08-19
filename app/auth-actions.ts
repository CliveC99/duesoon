"use server";

import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { signInSchema, signUpSchema } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";

export type AuthActionState = { error?: string };

export async function authenticate(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Email or password is incorrect." };
    throw error;
  }

  return {};
}

export async function register(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hash(password, 12);

  try {
    await prisma.user.create({ data: { name, email, passwordHash } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "An account with this email already exists." };
    }
    throw error;
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created. Please sign in." };
    throw error;
  }

  return {};
}

export async function signOutUser() {
  await signOut({ redirectTo: "/sign-in" });
}
