"use client";

import { DeadlineType } from "@prisma/client";
import { useActionState, useState } from "react";

import type { GroupActionState } from "@/app/group-actions";
import { DueDatePicker } from "@/app/components/due-date-picker";
import { formatEnum } from "@/lib/formatting";
import { REMINDER_OPTIONS } from "@/lib/reminders";

type GroupAction = (state: GroupActionState, formData: FormData) => Promise<GroupActionState>;

export function GroupForm({ action }: { action: GroupAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="data-form"><label htmlFor="name">Group name</label><input id="name" name="name" maxLength={100} placeholder="Software Development Year 2" required />{state.error && <p className="auth-error" role="alert">{state.error}</p>}<button className="auth-submit" disabled={pending}>{pending ? "Creating…" : "Create group"}</button></form>;
}

export function SharedDeadlineForm({ action, initial }: { action: GroupAction; initial?: { title: string; type: DeadlineType; dueAt: Date; weighting: number | null; description: string | null } }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="data-form"><label htmlFor="title">Title</label><input id="title" name="title" defaultValue={initial?.title} maxLength={140} placeholder="Database Project" required /><label htmlFor="type">Type</label><select id="type" name="type" defaultValue={initial?.type ?? DeadlineType.ASSIGNMENT}>{Object.values(DeadlineType).map((type) => <option key={type} value={type}>{formatEnum(type)}</option>)}</select><DueDatePicker initialValue={initial?.dueAt} /><label htmlFor="weighting">Weighting % <span>Optional</span></label><input id="weighting" name="weighting" type="number" min="0" max="100" step="1" defaultValue={initial?.weighting ?? ""} placeholder="35" /><label htmlFor="description">Shared description <span>Optional</span></label><textarea id="description" name="description" defaultValue={initial?.description ?? ""} rows={4} maxLength={2000} placeholder="Information useful to everyone in the group…" />{state.error && <p className="auth-error" role="alert">{state.error}</p>}<button className="auth-submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save shared deadline" : "Add shared deadline"}</button></form>;
}

export function ImportSharedDeadlineForm({ action, modules }: { action: GroupAction; modules: { id: string; name: string; code: string | null }[] }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="data-form"><label htmlFor="moduleId">Your module</label><select id="moduleId" name="moduleId" defaultValue="" required><option value="" disabled>Select one of your modules</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.code ? `${module.code} — ` : ""}{module.name}</option>)}</select><label htmlFor="reminderDaysBefore">Your reminder <span>Optional</span></label><select id="reminderDaysBefore" name="reminderDaysBefore" defaultValue="">{REMINDER_OPTIONS.map((option) => <option key={option.value || "none"} value={option.value}>{option.label}</option>)}</select><p className="form-helper">Status starts as Not Started. Your reminder, notes and results remain private.</p>{state.error && <p className="auth-error" role="alert">{state.error}</p>}<button className="auth-submit" disabled={pending}>{pending ? "Adding…" : "Add to my deadlines"}</button></form>;
}

export function GroupActionButton({ action, label, pendingLabel, danger = false }: { action: GroupAction; label: string; pendingLabel: string; danger?: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="group-inline-action"><button className={danger ? "danger-button" : "secondary-button"} disabled={pending}>{pending ? pendingLabel : label}</button>{state.error && <p className="field-error" role="alert">{state.error}</p>}</form>;
}

export function InviteLink({ token }: { token: string }) {
  const path = `/groups/join/${token}`;
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return <div className="invite-link"><input aria-label="Group invite link" value={path} readOnly /><button type="button" onClick={copy}>{copied ? "Copied" : "Copy link"}</button></div>;
}
