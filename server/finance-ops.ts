import { BudgetPaid, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import {
  isKeptPre2026Client,
  OPERATIONS_SYNC_PAUSED,
} from "@/server/acompanhamento-sheet";

/**
 * Esvazia Financeiro (checklist) e Serviços e Custos.
 * Não altera Acompanhamento nem cadastros de User/Profile.
 */
export async function clearFinanceAndServiceCostSheets() {
  await Promise.all([
    prisma.financeEntry.deleteMany({}),
    prisma.serviceCost.deleteMany({}),
  ]);
}

export async function ensureFinanceAndServiceForUser(userId: string) {
  await Promise.all([
    prisma.financeEntry.upsert({
      where: { userId },
      create: { userId, status: BudgetPaid.pending },
      update: {},
    }),
    prisma.serviceCost.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
  ]);
}

/** Inclui cliente manualmente em Serviços e no checklist Financeiro. */
export async function createManualOperationsClient(input: {
  name: string;
  email?: string;
  group?: string;
  phone?: string;
}) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Informe o nome do cliente");
  }

  const providedEmail = input.email?.trim().toLowerCase();
  const email =
    providedEmail ||
    `ops.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@manual.cpvistos`;

  if (providedEmail) {
    const existing = await prisma.user.findUnique({
      where: { email: providedEmail },
      select: { id: true, role: true },
    });
    if (existing) {
      if (existing.role !== Role.CLIENT) {
        throw new Error("Este e-mail já está em uso por outra conta");
      }
      await ensureFinanceAndServiceForUser(existing.id);
      return existing;
    }
  }

  const password = await bcrypt.hash("cp-vistos-import", 8);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      role: Role.CLIENT,
      group: input.group?.trim() || null,
      cel: input.phone?.trim() || null,
      wantsAmericanVisa: true,
    },
  });

  await ensureFinanceAndServiceForUser(user.id);
  return user;
}

/** User ids that should appear in Financeiro / Serviços e Custos. */
export async function getOperationsClientIds() {
  const ids = new Set<string>();

  const [imported, financeRows, serviceRows, kept] = await Promise.all([
    prisma.acompanhamentoClient.findMany({
      where: {
        source: { in: ["imported", "archived"] },
        userId: { not: null },
      },
      select: { userId: true },
    }),
    prisma.financeEntry.findMany({ select: { userId: true } }),
    prisma.serviceCost.findMany({ select: { userId: true } }),
    prisma.user.findMany({
      where: { role: Role.CLIENT },
      select: { id: true, name: true },
    }),
  ]);

  for (const row of imported) {
    if (row.userId) ids.add(row.userId);
  }
  for (const row of financeRows) ids.add(row.userId);
  for (const row of serviceRows) ids.add(row.userId);
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
  if (OPERATIONS_SYNC_PAUSED) {
    return;
  }

  const keepIds = await getOperationsClientIds();

  // Segurança: nunca apagar a planilha inteira se o Acompanhamento parecer vazio
  // (ex.: filtro MongoDB errado / sync ainda incompleto).
  if (keepIds.size < 20) {
    console.warn(
      "[finance] purge ignorado — poucos clientes do Acompanhamento:",
      keepIds.size,
    );
    return;
  }

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
