"use client";

import { useActionState, useEffect, useRef } from "react";

import { createDeadlineResource, deleteDeadlineResource, moveDeadlineResource, updateDeadlineResource, type ResourceActionState } from "@/app/resource-actions";
import { resourceHostname } from "@/lib/deadline-resources";

type DeadlineResourceItem = { id: string; label: string; url: string; position: number };
const initialState: ResourceActionState = {};

function ResourceFields({ prefix, values }: { prefix: string; values?: { label: string; url: string } }) {
  return <><label htmlFor={`${prefix}-label`}>Label</label><input id={`${prefix}-label`} name="label" defaultValue={values?.label ?? ""} maxLength={80} placeholder="e.g. Moodle" required /><label htmlFor={`${prefix}-url`}>Web address</label><input id={`${prefix}-url`} name="url" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} defaultValue={values?.url ?? ""} maxLength={2048} placeholder="https://…" required /></>;
}

function EditResource({ deadlineId, resource }: { deadlineId: string; resource: DeadlineResourceItem }) {
  const [state, action, pending] = useActionState(updateDeadlineResource.bind(null, deadlineId, resource.id), initialState);
  return <details className="resource-edit"><summary aria-label={`Edit ${resource.label}`}>Edit</summary><form action={action}><ResourceFields prefix={`resource-${resource.id}`} values={state.values ?? resource} />{state.error && <p role="alert">{state.error}</p>}<div><button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button><button className="resource-delete" type="submit" formAction={deleteDeadlineResource.bind(null, deadlineId, resource.id)} aria-label={`Delete ${resource.label}`}>Delete</button></div></form></details>;
}

export function DeadlineResources({ deadlineId, resources }: { deadlineId: string; resources: DeadlineResourceItem[] }) {
  const [state, action, pending] = useActionState(createDeadlineResource.bind(null, deadlineId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state.saved]);

  return <section className="deadline-resources" aria-labelledby="resources-heading">
    <header><div><p className="eyebrow">Useful links</p><h2 id="resources-heading">Resources</h2></div>{resources.length > 0 && <strong>{resources.length} {resources.length === 1 ? "resource" : "resources"}</strong>}</header>
    {resources.length > 0 ? <ol className="resource-list">{resources.map((resource, index) => <li key={resource.id}>
      <div className="resource-copy"><strong>{resource.label}</strong><a href={resource.url} target="_blank" rel="noopener noreferrer" title={resource.url} aria-label={`Open ${resource.label} at ${resource.url} in a new tab`}>{resourceHostname(resource.url)} <span aria-hidden="true">↗</span></a></div>
      <div className="resource-controls"><form action={moveDeadlineResource.bind(null, deadlineId, resource.id, "up")}><button type="submit" disabled={index === 0} aria-label={`Move ${resource.label} up`}>↑</button></form><form action={moveDeadlineResource.bind(null, deadlineId, resource.id, "down")}><button type="submit" disabled={index === resources.length - 1} aria-label={`Move ${resource.label} down`}>↓</button></form><EditResource deadlineId={deadlineId} resource={resource} /></div>
    </li>)}</ol> : <div className="resource-empty"><strong>No resources yet</strong><p>Add Moodle, briefs, repositories, submission pages, or reference material.</p></div>}
    <form ref={formRef} action={action} className="resource-add-form"><h3>Add resource</h3><ResourceFields prefix={`new-resource-${deadlineId}`} values={state.values} />{state.error && <p role="alert">{state.error}</p>}<button type="submit" disabled={pending}>{pending ? "Adding…" : "Add resource"}</button></form>
  </section>;
}
