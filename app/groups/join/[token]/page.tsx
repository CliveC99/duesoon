import type { Metadata } from "next";
import Link from "next/link";

import { GroupActionButton } from "@/app/components/group-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { joinGroup } from "@/app/group-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Join Group" };

export default async function JoinGroupPage({ params }: { params: Promise<{ token: string }> }) {
  const userId = await requireUserId(); const { token } = await params;
  const [session, group] = await Promise.all([auth(), prisma.group.findUnique({ where: { inviteToken: token }, select: { id: true, name: true, _count: { select: { members: true } }, members: { where: { userId }, select: { userId: true } } } })]);
  if (!group) return <ManageShell user={session!.user!} title="Group invitation" description="This invitation is no longer available."><div className="join-card"><p className="eyebrow">Invite unavailable</p><h2>This invite link is invalid or has been revoked</h2><p>Ask the group owner for a new invite link, or return to your groups.</p><Link className="add-button" href="/groups">View groups</Link></div></ManageShell>;
  const alreadyMember = group.members.length > 0;
  return <ManageShell user={session!.user!} title="Group invitation" description="Review the private group before choosing whether to join."><div className="join-card"><p className="eyebrow">You’re invited to</p><h2>{group.name}</h2><p>{group._count.members} {group._count.members === 1 ? "member" : "members"}. Members can see shared academic deadlines and the membership list, but not each other’s personal progress.</p>{alreadyMember ? <Link className="add-button" href={`/groups/${group.id}`}>Open group</Link> : <GroupActionButton action={joinGroup.bind(null, token)} label="Join group" pendingLabel="Joining…" />}<Link className="cancel-link" href="/groups">Not now</Link></div></ManageShell>;
}
