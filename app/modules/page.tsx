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
  const [session, semesters, unassigned] = await Promise.all([
    auth(),
    prisma.semester.findMany({ where: { userId }, include: { modules: { include: { _count: { select: { deadlines: true } } }, orderBy: { name: "asc" } } }, orderBy: [{ academicYear: "desc" }, { name: "asc" }] }),
    prisma.module.findMany({ where: { userId, semesterId: null }, include: { _count: { select: { deadlines: true } } }, orderBy: { name: "asc" } }),
  ]);
  const moduleCount = semesters.reduce((total, semester) => total + semester.modules.length, 0) + unassigned.length;
  const moduleCard = (module: (typeof unassigned)[number]) => <article className="module-card" key={module.id}><span className="module-colour" style={{ backgroundColor: module.colour }} /><div><p>{module.code || "No code"}</p><h2>{module.name}</h2><span>{module._count.deadlines} {module._count.deadlines === 1 ? "deadline" : "deadlines"}</span></div><div className="card-actions"><Link href={`/modules/${module.id}`}>Overview</Link><Link href={`/modules/${module.id}/edit`}>Edit</Link><DeleteForm action={deleteModule.bind(null, module.id)} label="Delete" /></div></article>;
  return <ManageShell user={session!.user!} title="Your modules" description="Organise deadlines by semester and module."><div className="manage-actions"><Link className="add-button" href="/modules/new">Add module</Link><Link className="secondary-button" href="/deadlines/new">Add deadline</Link><Link className="secondary-button" href="/semesters">Semesters</Link></div>{moduleCount ? <div className="module-groups">{semesters.filter((semester) => semester.modules.length).map((semester) => <section className="module-group" key={semester.id}><div className="group-heading"><div><h2>{semester.name}</h2><p>{semester.academicYear}</p></div>{semester.isActive && <span className="active-badge">Active</span>}</div><div className="module-grid">{semester.modules.map(moduleCard)}</div></section>)}{unassigned.length > 0 && <section className="module-group"><div className="group-heading"><div><h2>Unassigned</h2><p>Move these existing modules into a semester.</p></div></div><div className="module-grid">{unassigned.map(moduleCard)}</div></section>}</div> : <div className="empty-state"><h2>No modules yet</h2><p>Create a semester, then add your first module.</p><Link className="add-button" href={semesters.length ? "/modules/new" : "/semesters/new"}>{semesters.length ? "Create module" : "Create semester"}</Link></div>}</ManageShell>;
}
