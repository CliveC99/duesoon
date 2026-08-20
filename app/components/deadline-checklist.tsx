"use client";

import { useActionState, useEffect, useRef } from "react";

import { createSubtask, deleteSubtask, moveSubtask, toggleSubtask, updateSubtask, type SubtaskActionState } from "@/app/subtask-actions";
import { subtaskProgress } from "@/lib/subtasks";

type ChecklistSubtask = { id: string; title: string; isCompleted: boolean; position: number };
const initialState: SubtaskActionState = {};

function EditSubtask({ deadlineId, subtask }: { deadlineId: string; subtask: ChecklistSubtask }) {
  const [state, action, pending] = useActionState(updateSubtask.bind(null, deadlineId, subtask.id), initialState);
  return <details className="subtask-edit"><summary aria-label={`Edit ${subtask.title}`}>Edit</summary><form action={action}><label htmlFor={`subtask-title-${subtask.id}`}>Task title</label><input id={`subtask-title-${subtask.id}`} name="title" defaultValue={state.value ?? subtask.title} maxLength={180} required />{state.error && <p role="alert">{state.error}</p>}<div><button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button><button className="subtask-delete" type="submit" formAction={deleteSubtask.bind(null, deadlineId, subtask.id)} aria-label={`Delete ${subtask.title}`}>Delete</button></div></form></details>;
}

export function DeadlineChecklist({ deadlineId, subtasks }: { deadlineId: string; subtasks: ChecklistSubtask[] }) {
  const [state, action, pending] = useActionState(createSubtask.bind(null, deadlineId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const progress = subtaskProgress(subtasks);

  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state.saved]);

  const progressText = progress.allComplete ? `All ${progress.total} complete` : `${progress.completed} of ${progress.total} complete`;
  return <section className="deadline-checklist" aria-labelledby="checklist-heading">
    <header><div><p className="eyebrow">Working plan</p><h2 id="checklist-heading">Checklist</h2></div>{progress.total > 0 && <strong>{progressText}</strong>}</header>
    {progress.total > 0 ? <><div className="checklist-progress" aria-label={`${progress.percentage}% complete`}><span style={{ width: `${progress.percentage}%` }} /></div><ol className="subtask-list">{subtasks.map((subtask, index) => <li key={subtask.id} className={subtask.isCompleted ? "subtask-completed" : undefined}>
      <form action={toggleSubtask.bind(null, deadlineId, subtask.id)}><button className="subtask-toggle" type="submit" role="checkbox" aria-checked={subtask.isCompleted} aria-label={`${subtask.isCompleted ? "Mark incomplete" : "Mark complete"}: ${subtask.title}`}><span aria-hidden="true">{subtask.isCompleted ? "✓" : ""}</span></button></form>
      <div className="subtask-copy"><span>{subtask.title}</span><small>{subtask.isCompleted ? "Completed" : "Not completed"}</small></div>
      <div className="subtask-controls"><form action={moveSubtask.bind(null, deadlineId, subtask.id, "up")}><button type="submit" disabled={index === 0} aria-label={`Move ${subtask.title} up`}>↑</button></form><form action={moveSubtask.bind(null, deadlineId, subtask.id, "down")}><button type="submit" disabled={index === subtasks.length - 1} aria-label={`Move ${subtask.title} down`}>↓</button></form><EditSubtask deadlineId={deadlineId} subtask={subtask} /></div>
    </li>)}</ol></> : <div className="checklist-empty"><strong>No checklist tasks yet</strong><p>Add the first practical step for this deadline.</p></div>}
    <form ref={formRef} action={action} className="subtask-add-form"><label htmlFor={`new-subtask-${deadlineId}`}>Add a task</label><div><input id={`new-subtask-${deadlineId}`} name="title" defaultValue={state.value ?? ""} maxLength={180} placeholder="e.g. Read assignment brief" required /><button type="submit" disabled={pending}>{pending ? "Adding…" : "Add task"}</button></div>{state.error && <p role="alert">{state.error}</p>}</form>
  </section>;
}
