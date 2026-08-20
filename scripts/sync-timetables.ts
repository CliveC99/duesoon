import { runAutomaticTimetableSync } from "../lib/automatic-timetable-sync.ts";
import { prisma } from "../lib/prisma.ts";
import { automaticSyncSummary } from "../lib/timetable-sync-batch.ts";

async function main() {
  const result = await runAutomaticTimetableSync();
  if (!result.acquired) {
    console.log("Automatic timetable sync skipped\nAnother automatic sync is already running");
    return;
  }
  console.log(automaticSyncSummary(result.summary));
}

main()
  .catch(() => {
    console.error("Automatic timetable sync failed before sources could be processed");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
