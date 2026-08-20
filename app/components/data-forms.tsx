"use client";

import { DeadlineStatus, DeadlineType } from "@prisma/client";
import { useActionState, useState } from "react";

import type { DataActionState } from "@/app/data-actions";
import { DueDatePicker } from "@/app/components/due-date-picker";
import { SemesterDatePicker } from "@/app/components/semester-date-picker";
import { formatAcademicYearInput } from "@/lib/academic-year";
import { formatEnum } from "@/lib/formatting";
import { REMINDER_OPTIONS } from "@/lib/reminders";

type FormAction = (state: DataActionState, formData: FormData) => Promise<DataActionState>;
type ModuleOption = { id: string; name: string; code: string | null; colour: string };
type SemesterOption = { id: string; name: string; academicYear: string; isActive: boolean };

const initialState: DataActionState = {};

export function ModuleForm({ action, semesters, initial }: { action: FormAction; semesters: SemesterOption[]; initial?: { name: string; code: string | null; colour: string; semesterId: string | null } }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="data-form"><label htmlFor="semesterId">Semester</label><select id="semesterId" name="semesterId" defaultValue={initial?.semesterId ?? semesters.find((semester) => semester.isActive)?.id ?? ""} required><option value="" disabled>Select a semester</option>{semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name} · {semester.academicYear}{semester.isActive ? " (Active)" : ""}</option>)}</select><label htmlFor="name">Module name</label><input id="name" name="name" defaultValue={initial?.name} placeholder="Machine Learning" maxLength={100} required /><label htmlFor="code">Module code <span>Optional</span></label><input id="code" name="code" defaultValue={initial?.code ?? ""} placeholder="CS4012" maxLength={20} /><label htmlFor="colour">Module colour</label><div className="colour-field"><input id="colour" name="colour" type="color" defaultValue={initial?.colour ?? "#6558d9"} /><span>Used on deadline tags and cards</span></div>{state.error && <p className="auth-error" role="alert">{state.error}</p>}<button className="auth-submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Create module"}</button></form>;
}

export function SemesterForm({ action, initial }: { action: FormAction; initial?: { name: string; academicYear: string; startDate: Date; endDate: Date; isActive: boolean } }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [name, setName] = useState(initial?.name ?? "Semester 1");
  const [academicYear, setAcademicYear] = useState(initial?.academicYear ?? "");
  const [startDate, setStartDate] = useState(initial ? dateInputValue(initial.startDate) : "");
  const [endDate, setEndDate] = useState(initial ? dateInputValue(initial.endDate) : "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? false);

  function handleAcademicYearChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const inputType = (event.nativeEvent as InputEvent).inputType ?? "";
    const atEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
    setAcademicYear(formatAcademicYearInput(input.value, { deleting: inputType.startsWith("delete"), atEnd }));
  }

  const errors = state.fieldErrors;
  return <form action={formAction} className="data-form" noValidate><div className="form-grid"><div><label htmlFor="semester-name">Semester</label><select id="semester-name" name="name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={errors?.name ? true : undefined} aria-describedby={errors?.name ? "semester-name-error" : undefined}><option>Semester 1</option><option>Semester 2</option></select>{errors?.name && <p className="field-error" id="semester-name-error" role="alert">{errors.name[0]}</p>}</div><div><label htmlFor="academicYear">Academic year</label><input id="academicYear" name="academicYear" value={academicYear} onChange={handleAcademicYearChange} placeholder="2026/27" autoCapitalize="none" spellCheck={false} required aria-invalid={errors?.academicYear ? true : undefined} aria-describedby={`academic-year-help${errors?.academicYear ? " academic-year-error" : ""}`} /><p className="form-helper" id="academic-year-help">Enter 2026/27 or 26/27. The slash is added automatically.</p>{errors?.academicYear && <p className="field-error" id="academic-year-error" role="alert">{errors.academicYear[0]}</p>}</div></div><SemesterDatePicker startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} errors={{ startDate: errors?.startDate, endDate: errors?.endDate }} /><label className="checkbox-field"><input name="isActive" type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /><span><strong>Set as active semester</strong><small>This will replace the currently active semester.</small></span></label>{state.error && <p className="auth-error" role="alert">{state.error}</p>}<button className="auth-submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Create semester"}</button></form>;
}

type DeadlineFormInitial = { title: string; moduleId: string; type: DeadlineType; dueAt: Date; reminderDaysBefore: number | null; weighting: number | null; status: DeadlineStatus; notes: string | null; examTopics: string | null; examFormat: string | null; examLocation: string | null };

export function DeadlineForm({ action, modules, initial, commonFieldsLocked = false }: { action: FormAction; modules: ModuleOption[]; initial?: DeadlineFormInitial; commonFieldsLocked?: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState(initial?.type ?? DeadlineType.ASSIGNMENT);
  const isExam = type === DeadlineType.EXAM;

  return <form action={formAction} className="data-form">
    {commonFieldsLocked && <p className="shared-field-notice">Title, type, due date and weighting are managed by the shared group deadline. Your fields below remain private.</p>}
    <label htmlFor="title">Title</label>
    <input id="title" name="title" defaultValue={initial?.title} placeholder="Machine Learning Report" maxLength={140} required readOnly={commonFieldsLocked} />
    <div className="form-grid">
      <div><label htmlFor="moduleId">Module</label><select id="moduleId" name="moduleId" defaultValue={initial?.moduleId ?? ""} required><option value="" disabled>Select a module</option>{modules.map((module) => <option value={module.id} key={module.id}>{module.code ? `${module.code} — ` : ""}{module.name}</option>)}</select></div>
      <div><label htmlFor="type">Type</label>{commonFieldsLocked && <input type="hidden" name="type" value={initial?.type} />}<select id="type" name={commonFieldsLocked ? undefined : "type"} disabled={commonFieldsLocked} value={type} onChange={(event) => setType(event.target.value as DeadlineType)}>{Object.values(DeadlineType).map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}</select></div>
    </div>
    <DueDatePicker initialValue={initial?.dueAt} disabled={commonFieldsLocked} />
    <div className="form-grid">
      <div><label htmlFor="reminderDaysBefore">Reminder <span>Optional</span></label><select id="reminderDaysBefore" name="reminderDaysBefore" defaultValue={initial?.reminderDaysBefore?.toString() ?? ""}>{REMINDER_OPTIONS.map((option) => <option key={option.value || "none"} value={option.value}>{option.label}</option>)}</select></div>
      <div><label htmlFor="weighting">Weighting % <span>Optional</span></label><input id="weighting" name="weighting" type="number" min="0" max="100" step="1" defaultValue={initial?.weighting ?? ""} placeholder="35" readOnly={commonFieldsLocked} /></div>
    </div>
    {isExam && <fieldset className="exam-fields">
      <legend>Exam details</legend>
      <p>Add what you need on exam day and what you plan to cover.</p>
      <label htmlFor="examLocation">Location <span>Optional</span></label>
      <input id="examLocation" name="examLocation" defaultValue={initial?.examLocation ?? ""} maxLength={200} placeholder="GA 0994" />
      <label htmlFor="examTopics">Topics covered <span>Optional</span></label>
      <textarea id="examTopics" name="examTopics" defaultValue={initial?.examTopics ?? ""} rows={6} maxLength={4000} placeholder={'Linked lists\nTrees\nGraph traversal\nSorting algorithms'} aria-describedby="exam-topics-help" />
      <p className="form-helper" id="exam-topics-help">Enter one topic per line.</p>
      <label htmlFor="examFormat">Format / notes <span>Optional</span></label>
      <textarea id="examFormat" name="examFormat" defaultValue={initial?.examFormat ?? ""} rows={3} maxLength={1000} placeholder="2 hours, 5 questions, answer 4" />
    </fieldset>}
    <label htmlFor="status">Status</label><select id="status" name="status" defaultValue={initial?.status ?? DeadlineStatus.NOT_STARTED}>{Object.values(DeadlineStatus).map((status) => <option key={status} value={status}>{formatEnum(status)}</option>)}</select>
    <label htmlFor="notes">Private notes <span>Optional</span></label><textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} rows={4} maxLength={2000} placeholder="Brief, submission details, or revision notes…" />
    {state.error && <p className="auth-error" role="alert">{state.error}</p>}
    <button className="auth-submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Add deadline"}</button>
  </form>;
}

function LegacyDeadlineForm({ action, modules, initial, commonFieldsLocked = false }: { action: FormAction; modules: ModuleOption[]; initial?: DeadlineFormInitial; commonFieldsLocked?: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="data-form">{commonFieldsLocked && <p className="shared-field-notice">Title, type, due date and weighting are managed by the shared group deadline. Your fields below remain private.</p>}<label htmlFor="title">Title</label><input id="title" name="title" defaultValue={initial?.title} placeholder="Machine Learning Report" maxLength={140} required readOnly={commonFieldsLocked} /><div className="form-grid"><div><label htmlFor="moduleId">Module</label><select id="moduleId" name="moduleId" defaultValue={initial?.moduleId ?? ""} required><option value="" disabled>Select a module</option>{modules.map((module) => <option value={module.id} key={module.id}>{module.code ? `${module.code} — ` : ""}{module.name}</option>)}</select></div><div><label htmlFor="type">Type</label>{commonFieldsLocked && <input type="hidden" name="type" value={initial?.type} />}<select id="type" name={commonFieldsLocked ? undefined : "type"} disabled={commonFieldsLocked} defaultValue={initial?.type ?? DeadlineType.ASSIGNMENT}>{Object.values(DeadlineType).map((type) => <option key={type} value={type}>{formatEnum(type)}</option>)}</select></div></div><DueDatePicker initialValue={initial?.dueAt} disabled={commonFieldsLocked} /><div className="form-grid"><div><label htmlFor="reminderDaysBefore">Reminder <span>Optional</span></label><select id="reminderDaysBefore" name="reminderDaysBefore" defaultValue={initial?.reminderDaysBefore?.toString() ?? ""}>{REMINDER_OPTIONS.map((option) => <option key={option.value || "none"} value={option.value}>{option.label}</option>)}</select></div><div><label htmlFor="weighting">Weighting % <span>Optional</span></label><input id="weighting" name="weighting" type="number" min="0" max="100" step="1" defaultValue={initial?.weighting ?? ""} placeholder="35" readOnly={commonFieldsLocked} /></div></div><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={initial?.status ?? DeadlineStatus.NOT_STARTED}>{Object.values(DeadlineStatus).map((status) => <option key={status} value={status}>{formatEnum(status)}</option>)}</select><label htmlFor="notes">Private notes <span>Optional</span></label><textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} rows={4} maxLength={2000} placeholder="Brief, submission details, or revision notes…" />{state.error && <p className="auth-error" role="alert">{state.error}</p>}<button className="auth-submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Add deadline"}</button></form>;
}

void LegacyDeadlineForm;

export function DeleteForm({ action, label }: { action: FormAction; label: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="delete-form"><button disabled={pending}>{pending ? "Deleting…" : label}</button>{state.error && <p className="auth-error" role="alert">{state.error}</p>}</form>;
}

export function ActionForm({ action, label, pendingLabel = "Saving…" }: { action: FormAction; label: string; pendingLabel?: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="inline-action"><button disabled={pending}>{pending ? pendingLabel : label}</button>{state.error && <p className="auth-error" role="alert">{state.error}</p>}</form>;
}

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
