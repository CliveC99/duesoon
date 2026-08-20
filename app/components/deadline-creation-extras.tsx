"use client";

import { useState } from "react";

import { deadlineResourceSchema } from "@/lib/deadline-resources";
import { subtaskTitleSchema } from "@/lib/subtasks";

type DraftSubtask = { key: number; title: string };
type DraftResource = { key: number; label: string; url: string };

export function DeadlineCreationExtras() {
  const [subtasks, setSubtasks] = useState<DraftSubtask[]>([]);
  const [resources, setResources] = useState<DraftResource[]>([]);
  const [taskDraft, setTaskDraft] = useState("");
  const [resourceDraft, setResourceDraft] = useState({ label: "", url: "" });
  const [taskError, setTaskError] = useState<string>();
  const [resourceError, setResourceError] = useState<string>();
  const [nextKey, setNextKey] = useState(1);

  function addTask() {
    const parsed = subtaskTitleSchema.safeParse({ title: taskDraft });
    if (!parsed.success) {
      setTaskError(parsed.error.issues[0]?.message ?? "Check the task title.");
      return;
    }
    setSubtasks((current) => [...current, { key: nextKey, title: parsed.data.title }]);
    setNextKey((current) => current + 1);
    setTaskDraft("");
    setTaskError(undefined);
  }

  function addResource() {
    const parsed = deadlineResourceSchema.safeParse(resourceDraft);
    if (!parsed.success) {
      setResourceError(parsed.error.issues[0]?.message ?? "Check the resource details.");
      return;
    }
    setResources((current) => [...current, { key: nextKey, ...parsed.data }]);
    setNextKey((current) => current + 1);
    setResourceDraft({ label: "", url: "" });
    setResourceError(undefined);
  }

  return <div className="deadline-creation-extras">
    <input type="hidden" name="deadlineSubtasks" value={JSON.stringify(subtasks.map(({ title }) => ({ title })))} readOnly />
    <input type="hidden" name="deadlineResources" value={JSON.stringify(resources.map(({ label, url }) => ({ label, url })))} readOnly />

    <section className="creation-extra-section" aria-labelledby="new-checklist-heading">
      <header><p className="eyebrow">Working plan</p><h2 id="new-checklist-heading">Checklist</h2><p>Add practical steps now, or leave this empty.</p></header>
      {subtasks.length > 0 && <ol className="creation-task-list">{subtasks.map((subtask, index) => <li key={subtask.key}><span>{index + 1}</span><label><span className="sr-only">Task {index + 1}</span><input value={subtask.title} maxLength={180} onChange={(event) => setSubtasks((current) => current.map((item) => item.key === subtask.key ? { ...item, title: event.target.value } : item))} /></label><button type="button" onClick={() => setSubtasks((current) => current.filter((item) => item.key !== subtask.key))} aria-label={`Remove task ${subtask.title || index + 1}`}>Remove</button></li>)}</ol>}
      <div className="creation-extra-add"><label htmlFor="new-checklist-task">New task</label><div><input id="new-checklist-task" value={taskDraft} maxLength={180} placeholder="e.g. Read assignment brief" onChange={(event) => setTaskDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTask(); } }} /><button type="button" onClick={addTask}>Add task</button></div>{taskError && <p role="alert">{taskError}</p>}</div>
    </section>

    <section className="creation-extra-section" aria-labelledby="new-resources-heading">
      <header><p className="eyebrow">Useful links</p><h2 id="new-resources-heading">Resources</h2><p>Add Moodle, briefs, repositories, or submission links.</p></header>
      {resources.length > 0 && <ol className="creation-resource-list">{resources.map((resource, index) => <li key={resource.key}><div><label><span>Label</span><input value={resource.label} maxLength={80} onChange={(event) => setResources((current) => current.map((item) => item.key === resource.key ? { ...item, label: event.target.value } : item))} /></label><label><span>Web address</span><input type="url" inputMode="url" autoCapitalize="none" spellCheck={false} value={resource.url} maxLength={2048} onChange={(event) => setResources((current) => current.map((item) => item.key === resource.key ? { ...item, url: event.target.value } : item))} /></label></div><button type="button" onClick={() => setResources((current) => current.filter((item) => item.key !== resource.key))} aria-label={`Remove resource ${resource.label || index + 1}`}>Remove</button></li>)}</ol>}
      <div className="creation-resource-add"><div><label htmlFor="new-resource-label">Label</label><input id="new-resource-label" value={resourceDraft.label} maxLength={80} placeholder="e.g. Moodle" onChange={(event) => setResourceDraft((current) => ({ ...current, label: event.target.value }))} /></div><div><label htmlFor="new-resource-url">Web address</label><input id="new-resource-url" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} value={resourceDraft.url} maxLength={2048} placeholder="https://…" onChange={(event) => setResourceDraft((current) => ({ ...current, url: event.target.value }))} /></div><button type="button" onClick={addResource}>Add resource</button>{resourceError && <p role="alert">{resourceError}</p>}</div>
    </section>
  </div>;
}
