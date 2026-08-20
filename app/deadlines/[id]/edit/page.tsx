import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteDeadline, updateDeadline } from "@/app/data-actions";
import { DeadlineForm } from "@/app/components/data-forms";
import { ConfirmDeleteDialog } from "@/app/components/deadline-controls";
import { DeadlineChecklist } from "@/app/components/deadline-checklist";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit Deadline",
};

export default async function EditDeadlinePage({ params }: PageProps<"/deadlines/[id]/edit">) {
  const userId = await requireUserId(); const { id } = await params;
  const [session, deadline, modules] = await Promise.all([auth(), prisma.deadline.findFirst({ where: { id, userId }, include: { sharedDeadline: { select: { group: { select: { id: true, name: true } } } }, subtasks: { select: { id: true, title: true, isCompleted: true, position: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } }), prisma.module.findMany({ where: { userId }, select: { id: true, name: true, code: true, colour: true }, orderBy: { name: "asc" } })]);
  if (!deadline) notFound();
  return <ManageShell user={session!.user!} title="Edit deadline" description="Update the details, timing, or progress for this deadline."><div className="form-card"><DeadlineForm action={updateDeadline.bind(null, id)} modules={modules} initial={deadline} commonFieldsLocked={Boolean(deadline.sharedDeadlineId)} />{deadline.sharedDeadline && <Link className="shared-source-link" href={`/groups/${deadline.sharedDeadline.group.id}`}>View shared deadline in {deadline.sharedDeadline.group.name} →</Link>}<Link className="cancel-link" href="/dashboard">Cancel</Link></div><DeadlineChecklist deadlineId={deadline.id} subtasks={deadline.subtasks} /><div className="danger-zone"><div><h2>Delete deadline</h2><p>Remove this personal deadline permanently. The group’s shared deadline will remain.</p></div><ConfirmDeleteDialog itemLabel="deadline" itemName={deadline.title} action={deleteDeadline.bind(null, id)} /></div></ManageShell>;
}
