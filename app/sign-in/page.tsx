import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignInForm } from "@/app/components/auth-form";
import { AuthShell } from "@/app/components/auth-shell";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function SignInPage() {
  if (await auth()) redirect("/dashboard");

  return (
    <AuthShell title="Sign in to your account" description="Keep every assignment and exam within reach." alternateText="New to DueSoon?" alternateLabel="Create an account" alternateHref="/sign-up">
      <SignInForm />
    </AuthShell>
  );
}
