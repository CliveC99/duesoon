import type { Metadata } from "next";
import Link from "next/link";

import { createModule } from "@/app/data-actions";
import { ModuleForm } from "@/app/components/data-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Add Module",
};

export default async function NewModulePage() { const userId = await requireUserId(); const [session, semesters] = await Promise.all([auth(), prisma.semester.findMany({ where: { userId }, select: { id: true, name: true, academicYear: true, isActive: true }, orderBy: [{ academicYear: "desc" }, { name: "asc" }] })]); return <ManageShell user={session!.user!} title="Add a module" description="Create a module to group related assignments and exams.">{semesters.length ? <div className="form-card"><ModuleForm action={createModule} semesters={semesters} /><Link className="cancel-link" href="/modules">Cancel</Link></div> : <div className="empty-state"><h2>Create a semester first</h2><p>Every new module needs to belong to a semester.</p><Link className="add-button" href="/semesters/new">Add semester</Link></div>}</ManageShell>; }
