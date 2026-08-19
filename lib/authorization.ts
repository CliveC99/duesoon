export function ownedRecordWhere(id: string, userId: string) {
  return { id, userId } as const;
}

export function membershipKey(groupId: string, userId: string) {
  return { groupId_userId: { groupId, userId } } as const;
}

export function sharedDeadlineMemberWhere(id: string, groupId: string, userId: string) {
  return { id, groupId, group: { members: { some: { userId } } } } as const;
}

export function linkedPersonalFields<T extends { moduleId: string; reminderDaysBefore: number | null; status: string; notes: string | null }>(data: T) {
  return {
    moduleId: data.moduleId,
    reminderDaysBefore: data.reminderDaysBefore,
    status: data.status,
    notes: data.notes,
  } as Pick<T, "moduleId" | "reminderDaysBefore" | "status" | "notes">;
}

export function sharedCommonFields<T extends { title: string; type: string; dueAt: Date; weighting: number | null }>(data: T) {
  return { title: data.title, type: data.type, dueAt: data.dueAt, weighting: data.weighting } as Pick<T, "title" | "type" | "dueAt" | "weighting">;
}
