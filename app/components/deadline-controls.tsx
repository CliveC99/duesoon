"use client";

import { DeadlineStatus } from "@prisma/client";
import { useActionState, useRef } from "react";

import type { DataActionState } from "@/app/data-actions";
import { formatEnum } from "@/lib/formatting";

type DeleteAction = (state: DataActionState, formData: FormData) => Promise<DataActionState>;

export function DeadlineStatusControl({
  id,
  status,
  action,
}: {
  id: string;
  status: DeadlineStatus;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="status-control">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`status-${id}`}>Change status</label>
      <select
        id={`status-${id}`}
        name="status"
        defaultValue={status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {Object.values(DeadlineStatus).map((option) => (
          <option key={option} value={option}>{formatEnum(option)}</option>
        ))}
      </select>
    </form>
  );
}

export function ConfirmDeleteDialog({
  itemLabel,
  itemName,
  action,
}: {
  itemLabel: string;
  itemName: string;
  action: DeleteAction;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="deadline-delete">
      <button className="danger-button" type="button" onClick={() => dialogRef.current?.showModal()}>
        Delete {itemLabel}
      </button>
      <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="confirm-delete-title">
        <div className="confirm-dialog-card">
          <p className="confirm-eyebrow">Permanent action</p>
          <h2 id="confirm-delete-title">Delete “{itemName}”?</h2>
          <p>This {itemLabel} will be permanently removed. This cannot be undone.</p>
          {state.error && <p className="auth-error" role="alert">{state.error}</p>}
          <form action={formAction} className="confirm-actions">
            <button type="button" className="secondary-button" onClick={() => dialogRef.current?.close()} disabled={pending}>Cancel</button>
            <button type="submit" className="danger-button danger-button-solid" disabled={pending}>{pending ? "Deleting…" : `Delete ${itemLabel}`}</button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
