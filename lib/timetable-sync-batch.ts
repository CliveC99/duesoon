export type TimetableSourceReference = { id: string; userId: string };
export type TimetableBatchSummary = { sourcesChecked: number; successful: number; failed: number };
export type TimetableSourceSync = (sourceId: string, userId: string) => Promise<{ success: boolean }>;

export async function syncTimetableSources(
  sources: TimetableSourceReference[],
  syncSource: TimetableSourceSync,
): Promise<TimetableBatchSummary> {
  const summary: TimetableBatchSummary = { sourcesChecked: sources.length, successful: 0, failed: 0 };

  for (const source of sources) {
    try {
      const result = await syncSource(source.id, source.userId);
      if (result.success) summary.successful += 1;
      else summary.failed += 1;
    } catch {
      summary.failed += 1;
    }
  }

  return summary;
}

export function automaticSyncSummary(summary: TimetableBatchSummary) {
  return [
    "Automatic timetable sync complete",
    `Sources checked: ${summary.sourcesChecked}`,
    `Successful: ${summary.successful}`,
    `Failed: ${summary.failed}`,
  ].join("\n");
}
