import { z } from "zod";

export const subtaskTitleSchema = z.object({
  title: z.string().trim().min(1, "Enter a task title.").max(180, "Task titles must be 180 characters or fewer."),
});

export const subtaskIdSchema = z.string().cuid("Invalid checklist task.");

export type SubtaskProgressItem = { title: string; isCompleted: boolean; position: number };

export function subtaskProgress(subtasks: Pick<SubtaskProgressItem, "isCompleted">[]) {
  const total = subtasks.length;
  const completed = subtasks.filter((subtask) => subtask.isCompleted).length;
  return { total, completed, percentage: total === 0 ? null : Math.round(completed / total * 100), allComplete: total > 0 && completed === total };
}

export function firstIncompleteSubtask(subtasks: SubtaskProgressItem[]) {
  return [...subtasks].sort((left, right) => left.position - right.position).find((subtask) => !subtask.isCompleted) ?? null;
}

export function nextSubtaskPosition(positions: number[]) {
  return positions.length === 0 ? 0 : Math.max(...positions) + 1;
}
