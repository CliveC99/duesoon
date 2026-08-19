import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateModule } from "@/app/data-actions";
import { ModuleForm } from "@/app/components/data-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit Module",
};

export default async function EditModulePage({ params }: PageProps<"/modules/[id]/edit">) { const userId = await requireUserId(); const { id } = await params; const [session, module] = await Promise.all([auth(), prisma.module.findFirst({ where: { id, userId } })]); if (!module) notFound(); return <ManageShell user={session!.user!} title="Edit module" description="Update this module’s details and colour."><div className="form-card"><ModuleForm action={updateModule.bind(null, id)} initial={module} /><Link className="cancel-link" href="/modules">Cancel</Link></div></ManageShell>; }
