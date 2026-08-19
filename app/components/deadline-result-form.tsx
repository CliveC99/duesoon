"use client";

import { useActionState, useEffect, useRef } from "react";

import type { DataActionState } from "@/app/data-actions";

type ResultAction = (state: DataActionState, formData: FormData) => Promise<DataActionState>;

export function DeadlineResultForm({ action, deadlineId, initialResult }: { action: ResultAction; deadlineId: string; initialResult: number | null }) {
  const [state, formAction, pending] = useActionState(action, {});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.error && inputRef.current) inputRef.current.value = initialResult?.toString() ?? "";
  }, [initialResult, state.error]);

  return (
    <form action={formAction} className="result-form">
      <label htmlFor={`result-${deadlineId}`}>Result percentage</label>
      <div>
        <span><input ref={inputRef} id={`result-${deadlineId}`} name="resultPercent" type="number" min="0" max="100" step="0.01" defaultValue={initialResult ?? ""} placeholder="Not recorded" aria-describedby={state.error ? `result-error-${deadlineId}` : undefined} />%</span>
        <button disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      </div>
      <small>Leave empty and save to clear the result.</small>
      {state.error && <p id={`result-error-${deadlineId}`} className="field-error" role="alert">{state.error}</p>}
    </form>
  );
}
