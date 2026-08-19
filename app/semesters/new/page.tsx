import type { Metadata } from "next";
import Link from "next/link";

import { createSemester } from "@/app/data-actions";
import { SemesterForm } from "@/app/components/data-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Add Semester" };

export default async function NewSemesterPage() {
  await requireUserId();
  const session = await auth();
  return <ManageShell user={session!.user!} title="Add a semester" description="Set the dates for Semester 1 or Semester 2."><div className="form-card"><SemesterForm action={createSemester} /><Link className="cancel-link" href="/semesters">Cancel</Link></div></ManageShell>;
}
