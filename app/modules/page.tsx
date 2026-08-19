import type { Metadata } from "next";
import Link from "next/link";

import { deleteModule } from "@/app/data-actions";
import { DeleteForm } from "@/app/components/data-forms";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Modules",
};

export default async function ModulesPage() {
  const userId = await requireUserId();
  const [session, modules] = await Promise.all([auth(), prisma.module.findMany({ where: { userId }, include: { _count: { select: { deadlines: true } } }, orderBy: { name: "asc" } })]);
  return <ManageShell user={session!.user!} title="Your modules" description="Organise deadlines by the modules you study."><div className="manage-actions"><Link className="add-button" href="/modules/new">Add module</Link><Link className="secondary-button" href="/deadlines/new">Add deadline</Link></div>{modules.length ? <div className="module-grid">{modules.map((module) => <article className="module-card" key={module.id}><span className="module-colour" style={{ backgroundColor: module.colour }} /><div><p>{module.code || "No code"}</p><h2>{module.name}</h2><span>{module._count.deadlines} {module._count.deadlines === 1 ? "deadline" : "deadlines"}</span></div><div className="card-actions"><Link href={`/modules/${module.id}/edit`}>Edit</Link><DeleteForm action={deleteModule.bind(null, module.id)} label="Delete" /></div></article>)}</div> : <div className="empty-state"><h2>No modules yet</h2><p>Create your first module before adding a deadline.</p><Link className="add-button" href="/modules/new">Create module</Link></div>}</ManageShell>;
}
