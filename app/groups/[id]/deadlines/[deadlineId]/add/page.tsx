import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ImportSharedDeadlineForm } from "@/app/components/group-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { importSharedDeadline } from "@/app/group-actions";
import { auth } from "@/auth";
import { formatIrishDate, formatIrishTime } from "@/lib/formatting";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Add Shared Deadline" };

export default async function ImportSharedDeadlinePage({ params }: { params: Promise<{ id: string; deadlineId: string }> }) {
  const userId = await requireUserId(); const { id, deadlineId } = await params;
  const [session, shared, modules, existing] = await Promise.all([
    auth(),
    prisma.sharedDeadline.findFirst({ where: { id: deadlineId, groupId: id, group: { members: { some: { userId } } } }, select: { id: true, title: true, dueAt: true, group: { select: { name: true } } } }),
    prisma.module.findMany({ where: { userId }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }),
    prisma.deadline.findFirst({ where: { userId, sharedDeadlineId: deadlineId }, select: { id: true } }),
  ]);
  if (!shared) notFound();
  return <ManageShell user={session!.user!} title="Add to my deadlines" description={`${shared.title} · ${formatIrishDate(shared.dueAt)} at ${formatIrishTime(shared.dueAt)}`}><div className="form-card">{existing ? <div className="inline-notice"><h2>Already added</h2><p>This shared deadline is already linked to your personal deadlines.</p><Link className="secondary-button" href={`/deadlines/${existing.id}/edit`}>Open my deadline</Link></div> : modules.length ? <ImportSharedDeadlineForm action={importSharedDeadline.bind(null, id, deadlineId)} modules={modules} /> : <div className="inline-notice"><h2>Create a module first</h2><p>You need one of your own modules before importing a shared deadline.</p><Link className="add-button" href="/modules/new">Add module</Link></div>}<Link className="cancel-link" href={`/groups/${id}`}>Back to {shared.group.name}</Link></div></ManageShell>;
}
