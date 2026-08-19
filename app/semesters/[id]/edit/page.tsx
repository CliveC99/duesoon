import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateSemester } from "@/app/data-actions";
import { SemesterForm } from "@/app/components/data-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Edit Semester" };

export default async function EditSemesterPage({ params }: PageProps<"/semesters/[id]/edit">) {
  const userId = await requireUserId();
  const { id } = await params;
  const [session, semester] = await Promise.all([auth(), prisma.semester.findFirst({ where: { id, userId } })]);
  if (!semester) notFound();
  return <ManageShell user={session!.user!} title="Edit semester" description="Update its academic year, dates, or active status."><div className="form-card"><SemesterForm action={updateSemester.bind(null, id)} initial={semester} /><Link className="cancel-link" href="/semesters">Cancel</Link></div></ManageShell>;
}
