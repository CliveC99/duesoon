import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateDeadline } from "@/app/data-actions";
import { DeadlineForm } from "@/app/components/data-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit Deadline",
};

export default async function EditDeadlinePage({ params }: PageProps<"/deadlines/[id]/edit">) {
  const userId = await requireUserId(); const { id } = await params;
  const [session, deadline, modules] = await Promise.all([auth(), prisma.deadline.findFirst({ where: { id, userId } }), prisma.module.findMany({ where: { userId }, select: { id: true, name: true, code: true, colour: true }, orderBy: { name: "asc" } })]);
  if (!deadline) notFound();
  return <ManageShell user={session!.user!} title="Edit deadline" description="Update the details, timing, or progress for this deadline."><div className="form-card"><DeadlineForm action={updateDeadline.bind(null, id)} modules={modules} initial={deadline} /><Link className="cancel-link" href="/dashboard">Cancel</Link></div></ManageShell>;
}
