import type { Metadata } from "next";
import Link from "next/link";

import { deleteSemester, setActiveSemester } from "@/app/data-actions";
import { ActionForm } from "@/app/components/data-forms";
import { ConfirmDeleteDialog } from "@/app/components/deadline-controls";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { formatIrishDate } from "@/lib/formatting";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Semesters" };

export default async function SemestersPage() {
  const userId = await requireUserId();
  const [session, semesters] = await Promise.all([
    auth(),
    prisma.semester.findMany({ where: { userId }, include: { _count: { select: { modules: true } } }, orderBy: [{ academicYear: "desc" }, { name: "asc" }] }),
  ]);

  return <ManageShell user={session!.user!} title="Your semesters" description="Organise modules across your academic years."><div className="manage-actions"><Link className="add-button" href="/semesters/new">Add semester</Link><Link className="secondary-button" href="/modules">Modules</Link></div>{semesters.length ? <div className="semester-list">{semesters.map((semester) => <article className="semester-card" key={semester.id}><div className="semester-card-copy"><div className="semester-title"><h2>{semester.name}</h2>{semester.isActive && <span className="active-badge">Active</span>}</div><strong>{semester.academicYear}</strong><p>{formatIrishDate(semester.startDate)} – {formatIrishDate(semester.endDate)}</p><small>{semester._count.modules} {semester._count.modules === 1 ? "module" : "modules"}</small></div><div className="semester-actions"><Link href={`/semesters/${semester.id}/edit`}>Edit</Link>{!semester.isActive && <ActionForm action={setActiveSemester.bind(null, semester.id)} label="Set active" pendingLabel="Activating…" />}<ConfirmDeleteDialog itemLabel="semester" itemName={`${semester.name} · ${semester.academicYear}`} action={deleteSemester.bind(null, semester.id)} /></div></article>)}</div> : <div className="empty-state"><h2>No semesters yet</h2><p>Add Semester 1 or Semester 2 to organise your modules and dashboard.</p><Link className="add-button" href="/semesters/new">Create semester</Link></div>}</ManageShell>;
}
