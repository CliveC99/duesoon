import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ManageShell } from "@/app/components/manage-shell";
import { SharedDeadlineForm } from "@/app/components/group-forms";
import { createSharedDeadline } from "@/app/group-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Add Shared Deadline" };

export default async function NewSharedDeadlinePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(); const { id } = await params;
  const [session, group] = await Promise.all([auth(), prisma.group.findFirst({ where: { id, members: { some: { userId } } }, select: { id: true, name: true } })]);
  if (!group) notFound();
  return <ManageShell user={session!.user!} title="Add shared deadline" description={`Add common academic information for ${group.name}.`}><div className="form-card"><SharedDeadlineForm action={createSharedDeadline.bind(null, group.id)} /><Link className="cancel-link" href={`/groups/${group.id}`}>Cancel</Link></div></ManageShell>;
}
