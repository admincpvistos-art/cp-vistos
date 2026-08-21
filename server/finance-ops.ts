import { Role } from "@prisma/client";

import prisma from "@/lib/prisma";
import { isKeptPre2026Client } from "@/server/acompanhamento-sheet";

/** User ids that should appear in Financeiro / Serviços e Custos.
 * Includes archived Acompanhamento clients — they leave the sheet but stay in accounting.
 */
export async function getOperationsClientIds() {
  const imported = await prisma.acompanhamentoClient.findMany({
    where: { source: "imported", userId: { not: null } },
    select: { userId: true },
  });

  const ids = new Set(
    imported.map((row) => row.userId).filter((id): id is string => Boolean(id)),
  );

  const kept = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    select: { id: true, name: true },
  });

  for (const user of kept) {
    if (isKeptPre2026Client(user.name)) {
      ids.add(user.id);
    }
  }

  return ids;
}

/**
 * Remove finance/service-cost rows that are not from the Acompanhamento Excel
 * list (keeps Isadora). This replaces the old checklist with the sheet clients.
 */
export async function purgeFinanceOutsideAcompanhamento() {
  const keepIds = await getOperationsClientIds();

  const financeRows = await prisma.financeEntry.findMany({
    select: { id: true, userId: true },
  });
  const serviceRows = await prisma.serviceCost.findMany({
    select: { id: true, userId: true },
  });

  const financeToDelete = financeRows
    .filter((row) => !keepIds.has(row.userId))
    .map((row) => row.id);
  const serviceToDelete = serviceRows
    .filter((row) => !keepIds.has(row.userId))
    .map((row) => row.id);

  if (financeToDelete.length) {
    for (let i = 0; i < financeToDelete.length; i += 100) {
      await prisma.financeEntry.deleteMany({
        where: { id: { in: financeToDelete.slice(i, i + 100) } },
      });
    }
  }
  if (serviceToDelete.length) {
    for (let i = 0; i < serviceToDelete.length; i += 100) {
      await prisma.serviceCost.deleteMany({
        where: { id: { in: serviceToDelete.slice(i, i + 100) } },
      });
    }
  }
}

/** @deprecated use purgeFinanceOutsideAcompanhamento */
export async function purgePre2026FinanceExceptIsadora() {
  await purgeFinanceOutsideAcompanhamento();
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
