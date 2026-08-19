import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmDeleteDialog } from "@/app/components/deadline-controls";
import { SharedDeadlineForm } from "@/app/components/group-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { deleteSharedDeadline, updateSharedDeadline } from "@/app/group-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Edit Shared Deadline" };

export default async function EditSharedDeadlinePage({ params }: { params: Promise<{ id: string; deadlineId: string }> }) {
  const userId = await requireUserId(); const { id, deadlineId } = await params;
  const [session, shared] = await Promise.all([auth(), prisma.sharedDeadline.findFirst({ where: { id: deadlineId, groupId: id, group: { members: { some: { userId } } }, OR: [{ createdById: userId }, { group: { ownerId: userId } }] }, include: { group: { select: { name: true } } } })]);
  if (!shared) notFound();
  return <ManageShell user={session!.user!} title="Edit shared deadline" description="Common field changes synchronise to linked copies; personal progress and notes are never changed."><div className="form-card"><SharedDeadlineForm action={updateSharedDeadline.bind(null, id, deadlineId)} initial={shared} /><Link className="cancel-link" href={`/groups/${id}`}>Cancel</Link></div><div className="danger-zone"><div><h2>Delete shared deadline</h2><p>Imported personal copies will be kept as standalone deadlines.</p></div><ConfirmDeleteDialog itemLabel="shared deadline" itemName={shared.title} action={deleteSharedDeadline.bind(null, id, deadlineId)} /></div></ManageShell>;
}
