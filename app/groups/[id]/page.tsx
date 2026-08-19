import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmActionDialog, ConfirmDeleteDialog } from "@/app/components/deadline-controls";
import { GroupActionButton, InviteLink } from "@/app/components/group-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { deleteGroup, leaveGroup, regenerateGroupInvite, removeGroupMember, revokeGroupInvite } from "@/app/group-actions";
import { auth } from "@/auth";
import { formatEnum, formatIrishDate, formatIrishTime } from "@/lib/formatting";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Group" };

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const [session, group] = await Promise.all([
    auth(),
    prisma.group.findFirst({
      where: { id, members: { some: { userId } } },
      select: {
        id: true, name: true, ownerId: true, inviteToken: true,
        members: { select: { userId: true, role: true, joinedAt: true, user: { select: { name: true, email: true } } }, orderBy: [{ role: "asc" }, { joinedAt: "asc" }] },
        sharedDeadlines: { select: { id: true, title: true, type: true, dueAt: true, weighting: true, description: true, createdById: true, createdBy: { select: { name: true, email: true } }, deadlines: { where: { userId }, select: { id: true } } }, orderBy: { dueAt: "asc" } },
      },
    }),
  ]);
  if (!group) notFound();
  const isOwner = group.ownerId === userId;

  return <ManageShell user={session!.user!} title={group.name} description="Shared academic details are visible here. Each member’s status, reminders, notes and results stay private.">
    <div className="manage-actions"><Link className="add-button" href={`/groups/${group.id}/deadlines/new`}>Add shared deadline</Link><Link className="secondary-button" href="/groups">All groups</Link></div>
    <div className="group-layout"><section className="group-main"><div className="group-section-heading"><div><p className="eyebrow">Group deadlines</p><h2>Upcoming shared work</h2></div></div>
      {group.sharedDeadlines.length ? <div className="shared-deadline-list">{group.sharedDeadlines.map((deadline) => {
        const imported = deadline.deadlines.length > 0;
        const canManage = isOwner || deadline.createdById === userId;
        return <article key={deadline.id}><div><span>{formatEnum(deadline.type)}{deadline.weighting == null ? "" : ` · ${deadline.weighting}%`}</span><h3>{deadline.title}</h3><p>{formatIrishDate(deadline.dueAt)} at {formatIrishTime(deadline.dueAt)}</p>{deadline.description && <small>{deadline.description}</small>}<em>Added by {deadline.createdBy.name || deadline.createdBy.email}</em></div><div className="shared-deadline-actions">{imported ? <span className="imported-badge">In your deadlines</span> : <Link className="add-button" href={`/groups/${group.id}/deadlines/${deadline.id}/add`}>Add to mine</Link>}{canManage && <Link className="secondary-button" href={`/groups/${group.id}/deadlines/${deadline.id}/edit`}>Edit</Link>}</div></article>;
      })}</div> : <div className="empty-state"><h2>No shared deadlines yet</h2><p>Any member can add the first common academic deadline.</p><Link className="add-button" href={`/groups/${group.id}/deadlines/new`}>Add shared deadline</Link></div>}
    </section><aside className="group-sidebar">
      <section><p className="eyebrow">Members</p><h2>{group.members.length} {group.members.length === 1 ? "member" : "members"}</h2><div className="member-list">{group.members.map((member) => <div key={member.userId}><span><strong>{member.user.name || member.user.email.split("@")[0]}</strong><small>{formatEnum(member.role)}</small></span>{isOwner && member.role === "MEMBER" && <ConfirmActionDialog action={removeGroupMember.bind(null, group.id, member.userId)} triggerLabel="Remove" title={`Remove ${member.user.name || "this member"}?`} description="They will lose group access. Their personal deadlines will be kept and unlinked." confirmLabel="Remove member" pendingLabel="Removing…" />}</div>)}</div></section>
      <section><p className="eyebrow">Invite</p><h2>Invite classmates</h2>{group.inviteToken ? <><p className="sidebar-copy">Members can share this private link. Only the owner can replace or revoke it.</p><InviteLink token={group.inviteToken} />{isOwner && <div className="sidebar-actions"><GroupActionButton action={regenerateGroupInvite.bind(null, group.id)} label="New link" pendingLabel="Generating…" /><GroupActionButton action={revokeGroupInvite.bind(null, group.id)} label="Revoke" pendingLabel="Revoking…" danger /></div>}</> : <><p className="sidebar-copy">The invite has been revoked.</p>{isOwner && <GroupActionButton action={regenerateGroupInvite.bind(null, group.id)} label="Generate invite" pendingLabel="Generating…" />}</>}</section>
      <section><p className="eyebrow">Membership</p>{isOwner ? <ConfirmDeleteDialog itemLabel="group" itemName={group.name} action={deleteGroup.bind(null, group.id)} /> : <ConfirmActionDialog action={leaveGroup.bind(null, group.id)} triggerLabel="Leave group" title={`Leave ${group.name}?`} description="You will lose group access. Your personal deadlines will be kept and unlinked." confirmLabel="Leave group" pendingLabel="Leaving…" />}</section>
    </aside></div>
  </ManageShell>;
}
