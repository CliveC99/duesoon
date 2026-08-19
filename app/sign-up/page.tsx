import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/app/components/auth-form";
import { AuthShell } from "@/app/components/auth-shell";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default async function SignUpPage() {
  if (await auth()) redirect("/dashboard");

  return (
    <AuthShell title="Create your account" description="Start organising your semester in a few seconds." alternateText="Already have an account?" alternateLabel="Sign in" alternateHref="/sign-in">
      <SignUpForm />
    </AuthShell>
  );
}
