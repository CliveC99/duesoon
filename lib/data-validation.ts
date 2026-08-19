import { DeadlineStatus, DeadlineType } from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);

export const moduleSchema = z.object({
  name: z.string().trim().min(2, "Module name must be at least 2 characters.").max(100),
  code: optionalText(20),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid colour."),
});

export const deadlineSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(140),
  moduleId: z.string().cuid("Choose a valid module."),
  type: z.nativeEnum(DeadlineType),
  dueAt: z.string().min(1, "Choose a due date.").transform((value, ctx) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Choose a valid due date." });
      return z.NEVER;
    }
    return date;
  }),
  weighting: z.string().trim().transform((value) => value === "" ? null : Number(value)).refine((value) => value === null || (Number.isInteger(value) && value >= 0 && value <= 100), "Weighting must be a whole number from 0 to 100."),
  status: z.nativeEnum(DeadlineStatus),
  notes: optionalText(2000),
});

export const statusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(DeadlineStatus),
});
