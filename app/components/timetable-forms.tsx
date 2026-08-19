"use client";

import { useActionState, useId, useRef } from "react";

import type { TimetableActionState } from "@/app/timetable-actions";

type TimetableAction = (state: TimetableActionState, formData: FormData) => Promise<TimetableActionState>;

function Feedback({ state }: { state: TimetableActionState }) {
  return <>{state.error && <p className="auth-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}</>;
}

export function TimetableConnectionForm({ action, replacing = false }: { action: TimetableAction; replacing?: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="data-form timetable-connection-form"><label htmlFor="feedUrl">iCal subscription URL</label><input id="feedUrl" name="feedUrl" type="url" inputMode="url" autoComplete="off" placeholder="https://timetable.example.ie/calendar/…" maxLength={2000} required aria-describedby="feed-url-help" /><p className="form-helper" id="feed-url-help">Your private URL is encrypted before storage and will not be shown again.</p>{replacing && <p className="shared-field-notice">Saving a replacement removes classes imported from the previous feed before syncing the new one.</p>}<Feedback state={state} /><button className="auth-submit" disabled={pending}>{pending ? "Connecting and syncing…" : replacing ? "Replace feed and sync" : "Connect and sync"}</button></form>;
}

export function TimetableSyncForm({ action }: { action: TimetableAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="timetable-sync-form"><button className="secondary-button" disabled={pending}>{pending ? "Syncing…" : "Sync now"}</button><Feedback state={state} /></form>;
}

export function DisconnectTimetable({ action }: { action: TimetableAction }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, formAction, pending] = useActionState(action, {});
  return <div className="deadline-delete"><button className="danger-button" type="button" onClick={() => dialogRef.current?.showModal()}>Disconnect timetable</button><dialog ref={dialogRef} className="confirm-dialog" aria-labelledby={titleId}><div className="confirm-dialog-card"><p className="confirm-eyebrow">Please confirm</p><h2 id={titleId}>Disconnect timetable?</h2><p>This removes the encrypted feed URL and all classes imported from it. Your deadlines, modules and semesters will not be changed.</p>{state.error && <p className="auth-error" role="alert">{state.error}</p>}<form action={formAction} className="confirm-actions"><button type="button" className="secondary-button" disabled={pending} onClick={() => dialogRef.current?.close()}>Cancel</button><button type="submit" className="danger-button danger-button-solid" disabled={pending}>{pending ? "Disconnecting…" : "Disconnect timetable"}</button></form></div></dialog></div>;
}
