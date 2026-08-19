"use client";

import { DeadlineStatus, DeadlineType } from "@prisma/client";
import { useActionState } from "react";

import type { DataActionState } from "@/app/data-actions";
import { DueDatePicker } from "@/app/components/due-date-picker";
import { formatEnum } from "@/lib/formatting";

type FormAction = (state: DataActionState, formData: FormData) => Promise<DataActionState>;
type ModuleOption = { id: string; name: string; code: string | null; colour: string };

const initialState: DataActionState = {};

export function ModuleForm({ action, initial }: { action: FormAction; initial?: { name: string; code: string | null; colour: string } }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="data-form"><label htmlFor="name">Module name</label><input id="name" name="name" defaultValue={initial?.name} placeholder="Machine Learning" maxLength={100} required /><label htmlFor="code">Module code <span>Optional</span></label><input id="code" name="code" defaultValue={initial?.code ?? ""} placeholder="CS4012" maxLength={20} /><label htmlFor="colour">Module colour</label><div className="colour-field"><input id="colour" name="colour" type="color" defaultValue={initial?.colour ?? "#6558d9"} /><span>Used on deadline tags and cards</span></div>{state.error && <p className="auth-error" role="alert">{state.error}</p>}<button className="auth-submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Create module"}</button></form>;
}

export function DeadlineForm({ action, modules, initial }: { action: FormAction; modules: ModuleOption[]; initial?: { title: string; moduleId: string; type: DeadlineType; dueAt: Date; weighting: number | null; status: DeadlineStatus; notes: string | null } }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="data-form"><label htmlFor="title">Title</label><input id="title" name="title" defaultValue={initial?.title} placeholder="Machine Learning Report" maxLength={140} required /><div className="form-grid"><div><label htmlFor="moduleId">Module</label><select id="moduleId" name="moduleId" defaultValue={initial?.moduleId ?? ""} required><option value="" disabled>Select a module</option>{modules.map((module) => <option value={module.id} key={module.id}>{module.code ? `${module.code} — ` : ""}{module.name}</option>)}</select></div><div><label htmlFor="type">Type</label><select id="type" name="type" defaultValue={initial?.type ?? DeadlineType.ASSIGNMENT}>{Object.values(DeadlineType).map((type) => <option key={type} value={type}>{formatEnum(type)}</option>)}</select></div></div><DueDatePicker initialValue={initial?.dueAt} /><div className="form-grid"><div><label htmlFor="weighting">Weighting % <span>Optional</span></label><input id="weighting" name="weighting" type="number" min="0" max="100" step="1" defaultValue={initial?.weighting ?? ""} placeholder="35" /></div><div><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={initial?.status ?? DeadlineStatus.NOT_STARTED}>{Object.values(DeadlineStatus).map((status) => <option key={status} value={status}>{formatEnum(status)}</option>)}</select></div></div><label htmlFor="notes">Notes <span>Optional</span></label><textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} rows={4} maxLength={2000} placeholder="Brief, submission details, or revision notes…" />{state.error && <p className="auth-error" role="alert">{state.error}</p>}<button className="auth-submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Add deadline"}</button></form>;
}

export function DeleteForm({ action, label }: { action: FormAction; label: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="delete-form"><button disabled={pending}>{pending ? "Deleting…" : label}</button>{state.error && <p className="auth-error" role="alert">{state.error}</p>}</form>;
}
