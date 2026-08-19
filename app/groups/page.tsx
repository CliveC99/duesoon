import type { Metadata } from "next";
import Link from "next/link";

import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Groups" };

export default async function GroupsPage() {
  const userId = await requireUserId();
  const [session, memberships] = await Promise.all([
    auth(),
    prisma.groupMember.findMany({ where: { userId }, select: { role: true, group: { select: { id: true, name: true, ownerId: true, _count: { select: { members: true, sharedDeadlines: true } } } } }, orderBy: { joinedAt: "asc" } }),
  ]);
  return <ManageShell user={session!.user!} title="Your groups" description="Share common college deadlines while keeping everyone’s progress private."><div className="manage-actions"><Link className="add-button" href="/groups/new">Create group</Link></div>{memberships.length ? <div className="group-card-grid">{memberships.map(({ group, role }) => <Link className="group-card" href={`/groups/${group.id}`} key={group.id}><span>{role === "OWNER" ? "Owner" : "Member"}</span><h2>{group.name}</h2><p>{group._count.members} {group._count.members === 1 ? "member" : "members"} · {group._count.sharedDeadlines} shared {group._count.sharedDeadlines === 1 ? "deadline" : "deadlines"}</p><strong>Open group →</strong></Link>)}</div> : <div className="empty-state"><h2>No groups yet</h2><p>Create a private group, or open an invite link from a classmate.</p><Link className="add-button" href="/groups/new">Create group</Link></div>}</ManageShell>;
}
