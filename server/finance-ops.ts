import { Role } from "@prisma/client";

import prisma from "@/lib/prisma";
import { isKeptPre2026Client } from "@/server/acompanhamento-sheet";

const YEAR_2026 = new Date(Date.UTC(2026, 0, 1));

export async function purgePre2026FinanceExceptIsadora() {
  const oldClients = await prisma.user.findMany({
    where: {
      role: Role.CLIENT,
      createdAt: { lt: YEAR_2026 },
    },
    select: { id: true, name: true },
  });

  const ids = oldClients
    .filter((user) => !isKeptPre2026Client(user.name))
    .map((user) => user.id);

  if (!ids.length) {
    return;
  }

  await prisma.financeEntry.deleteMany({
    where: { userId: { in: ids } },
  });
  await prisma.serviceCost.deleteMany({
    where: { userId: { in: ids } },
  });
}

export function sortGroupedByRecency<T>(
  items: T[],
  getUser: (item: T) => {
    id: string;
    group: string | null;
    payerUserId: string | null;
    createdAt: Date;
  },
  direction: "asc" | "desc" = "desc",
) {
  const newestByGroup = new Map<string, number>();

  for (const item of items) {
    const user = getUser(item);
    const key = (user.group?.trim() || user.id).toLowerCase();
    const time = user.createdAt.getTime();
    const current = newestByGroup.get(key) ?? 0;
    if (time > current) {
      newestByGroup.set(key, time);
    }
  }

  return [...items].sort((a, b) => {
    const userA = getUser(a);
    const userB = getUser(b);
    const groupA = (userA.group?.trim() || userA.id).toLowerCase();
    const groupB = (userB.group?.trim() || userB.id).toLowerCase();

    if (groupA !== groupB) {
      const timeA = newestByGroup.get(groupA) ?? 0;
      const timeB = newestByGroup.get(groupB) ?? 0;
      return direction === "desc" ? timeB - timeA : timeA - timeB;
    }

    const depA = userA.payerUserId ? 1 : 0;
    const depB = userB.payerUserId ? 1 : 0;
    if (depA !== depB) {
      return depA - depB;
    }

    const diff = userB.createdAt.getTime() - userA.createdAt.getTime();
    return direction === "desc" ? diff : -diff;
  });
}
