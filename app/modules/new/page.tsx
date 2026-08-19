import type { Metadata } from "next";
import Link from "next/link";

import { createModule } from "@/app/data-actions";
import { ModuleForm } from "@/app/components/data-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Add Module",
};

export default async function NewModulePage() { await requireUserId(); const session = await auth(); return <ManageShell user={session!.user!} title="Add a module" description="Create a module to group related assignments and exams."><div className="form-card"><ModuleForm action={createModule} /><Link className="cancel-link" href="/modules">Cancel</Link></div></ManageShell>; }
