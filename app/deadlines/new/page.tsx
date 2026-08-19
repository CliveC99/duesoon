import type { Metadata } from "next";
import Link from "next/link";

import { createDeadline } from "@/app/data-actions";
import { DeadlineForm } from "@/app/components/data-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Add Deadline",
};

export default async function NewDeadlinePage() {
  const userId = await requireUserId();
  const [session, modules] = await Promise.all([auth(), prisma.module.findMany({ where: { userId }, select: { id: true, name: true, code: true, colour: true }, orderBy: { name: "asc" } })]);
  return <ManageShell user={session!.user!} title="Add a deadline" description="Add an assignment, exam, quiz, or project to your semester.">{modules.length ? <div className="form-card"><DeadlineForm action={createDeadline} modules={modules} /><Link className="cancel-link" href="/dashboard">Cancel</Link></div> : <div className="empty-state"><h2>Create a module first</h2><p>Every deadline needs to belong to one of your modules.</p><Link className="add-button" href="/modules/new">Add module</Link></div>}</ManageShell>;
}
