import { NotificationCentre } from "@/app/components/notification-centre";
import { formatIrishTime } from "@/lib/formatting";
import { prisma } from "@/lib/prisma";
import { deadlineUrgency, isReminderEligible } from "@/lib/reminders";
import { requireUserId } from "@/lib/session";

export async function UserReminderCentre() {
  const userId = await requireUserId();
  const now = new Date();
  const deadlines = await prisma.deadline.findMany({
    where: {
      userId,
      reminderDaysBefore: { not: null },
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      title: true,
      dueAt: true,
      reminderDaysBefore: true,
      status: true,
      module: { select: { name: true, code: true } },
    },
    orderBy: { dueAt: "asc" },
  });
  const reminders = deadlines.filter((deadline) => isReminderEligible(deadline, now)).map((deadline) => ({
    id: deadline.id,
    title: deadline.title,
    moduleLabel: deadline.module.code || deadline.module.name,
    urgency: deadlineUrgency(deadline.dueAt, now),
    time: formatIrishTime(deadline.dueAt),
    overdue: deadline.dueAt.getTime() < now.getTime(),
  }));
  return <NotificationCentre reminders={reminders} />;
}
