import { z } from "zod";

function webUrl(value: string, context: z.RefinementCtx) {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      context.addIssue({ code: "custom", message: "Enter an http or https web address." });
      return z.NEVER;
    }
    if (parsed.username || parsed.password) {
      context.addIssue({ code: "custom", message: "Web addresses containing credentials are not allowed." });
      return z.NEVER;
    }
    return parsed.href;
  } catch {
    context.addIssue({ code: "custom", message: "Enter a valid web address, including https://." });
    return z.NEVER;
  }
}

export const deadlineResourceSchema = z.object({
  label: z.string().trim().min(1, "Enter a resource label.").max(80, "Resource labels must be 80 characters or fewer."),
  url: z.string().trim().min(1, "Enter a web address.").max(2048, "The web address is too long.").transform(webUrl),
});

export const deadlineResourceIdSchema = z.string().cuid("Invalid deadline resource.");

export function resourceHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function nextResourcePosition(positions: number[]) {
  return positions.length === 0 ? 0 : Math.max(...positions) + 1;
}
