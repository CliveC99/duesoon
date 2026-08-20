import { z } from "zod";

import { deadlineResourceSchema } from "./deadline-resources.ts";
import { subtaskTitleSchema } from "./subtasks.ts";

export const deadlineCreationExtrasSchema = z.object({
  subtasks: z.array(subtaskTitleSchema).max(50, "A deadline can have up to 50 checklist tasks."),
  resources: z.array(deadlineResourceSchema).max(30, "A deadline can have up to 30 resources."),
});

function parseJsonArray(value: unknown) {
  if (typeof value !== "string" || value === "") return [];
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function parseDeadlineCreationExtras(subtasks: unknown, resources: unknown) {
  return deadlineCreationExtrasSchema.safeParse({
    subtasks: parseJsonArray(subtasks),
    resources: parseJsonArray(resources),
  });
}

export function deadlineCreationChildData(extras: z.infer<typeof deadlineCreationExtrasSchema>, deadlineId: string, userId: string) {
  return {
    subtasks: extras.subtasks.map((subtask, position) => ({ deadlineId, userId, title: subtask.title, position })),
    resources: extras.resources.map((resource, position) => ({ deadlineId, userId, label: resource.label, url: resource.url, position })),
  };
}
