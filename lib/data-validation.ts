import { DeadlineStatus, DeadlineType } from "@prisma/client";
import { z } from "zod";

import { canonicalAcademicYear, isConsecutiveAcademicYear } from "./academic-year.ts";

const optionalText = (max: number) => z.preprocess((value) => value ?? "", z.string().trim().max(max).transform((value) => value || null));

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.").transform((value) => new Date(`${value}T00:00:00.000Z`));
const dueDateTime = z.string().min(1, "Choose a due date.").transform((value, ctx) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: "custom", message: "Choose a valid due date." });
    return z.NEVER;
  }
  return date;
});
const optionalWeighting = z.string().trim().transform((value) => value === "" ? null : Number(value)).refine((value) => value === null || (Number.isInteger(value) && value >= 0 && value <= 100), "Weighting must be a whole number from 0 to 100.");

export const semesterSchema = z.object({
  name: z.enum(["Semester 1", "Semester 2"]),
  academicYear: z.string().trim().transform((value, context) => {
    const canonical = canonicalAcademicYear(value);
    if (!canonical) {
      context.addIssue({ code: "custom", message: "Enter an academic year such as 2026/27 or 26/27." });
      return z.NEVER;
    }
    if (!isConsecutiveAcademicYear(canonical)) {
      context.addIssue({ code: "custom", message: "The second year must be consecutive; for example, use 2026/27 rather than 2026/28." });
      return z.NEVER;
    }
    return canonical;
  }),
  startDate: dateOnly,
  endDate: dateOnly,
  isActive: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
}).refine((value) => value.endDate >= value.startDate, { message: "End date must be on or after the start date.", path: ["endDate"] });

export const moduleSchema = z.object({
  semesterId: z.string().cuid("Choose a valid semester."),
  name: z.string().trim().min(2, "Module name must be at least 2 characters.").max(100),
  code: optionalText(20),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid colour."),
});

export const deadlineSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(140),
  moduleId: z.string().cuid("Choose a valid module."),
  type: z.nativeEnum(DeadlineType),
  dueAt: dueDateTime,
  reminderDaysBefore: z.string().transform((value) => value === "" ? null : Number(value)).refine(
    (value) => value === null || [0, 1, 3, 7, 14].includes(value),
    "Choose a valid reminder.",
  ),
  weighting: optionalWeighting,
  status: z.nativeEnum(DeadlineStatus),
  notes: optionalText(2000),
  examTopics: optionalText(4000),
  examFormat: optionalText(1000),
  examLocation: optionalText(200),
}).transform((value) => value.type === DeadlineType.EXAM ? value : {
  ...value,
  examTopics: null,
  examFormat: null,
  examLocation: null,
});

export const statusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(DeadlineStatus),
});

export const deadlineResultSchema = z.object({
  resultPercent: z.string().trim().transform((value) => value === "" ? null : Number(value)).refine(
    (value) => value === null || (Number.isFinite(value) && value >= 0 && value <= 100),
    "Result must be a percentage from 0 to 100.",
  ),
});

export const groupSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters.").max(100),
});

export const sharedDeadlineSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(140),
  type: z.nativeEnum(DeadlineType),
  dueAt: dueDateTime,
  weighting: optionalWeighting,
  description: optionalText(2000),
});

export const sharedDeadlineImportSchema = z.object({
  moduleId: z.string().cuid("Choose one of your modules."),
  reminderDaysBefore: z.string().transform((value) => value === "" ? null : Number(value)).refine(
    (value) => value === null || [0, 1, 3, 7, 14].includes(value),
    "Choose a valid reminder.",
  ),
});
