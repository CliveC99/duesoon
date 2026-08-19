import type { Metadata } from "next";
import Link from "next/link";

import { GroupForm } from "@/app/components/group-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { createGroup } from "@/app/group-actions";
import { auth } from "@/auth";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Create Group" };

export default async function NewGroupPage() {
  await requireUserId();
  const session = await auth();
  return <ManageShell user={session!.user!} title="Create a group" description="Set up a private space for shared academic deadlines."><div className="form-card"><GroupForm action={createGroup} /><Link className="cancel-link" href="/groups">Cancel</Link></div></ManageShell>;
}
