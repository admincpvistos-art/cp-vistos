import { BudgetPaid, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import {
  ACOMPANHAMENTO_HEADERS,
  OPERATIONS_SYNC_PAUSED,
} from "@/server/acompanhamento-sheet";

export const ACERTO_DE_CAIXA_EMAIL = "ops.acerto-de-caixa@manual.cpvistos";
export const ACERTO_DE_CAIXA_NAME = "ACERTO DE CAIXA";

function normalizeClientName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** Mantém só TESTE e ACERTO DE CAIXA nas planilhas operacionais (baseline). */
export function isKeptOperationsSheetClient(name: string) {
  const normalized = normalizeClientName(name);
  return normalized === "TESTE" || normalized === "ACERTODECAIXA";
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

async function ensureAcompanhamentoRowForUser(user: {
  id: string;
  name: string;
  email: string;
  group: string | null;
  cel: string | null;
}) {
  const existing = await prisma.acompanhamentoClient.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) {
    return;
  }

  const cells = Array.from({ length: ACOMPANHAMENTO_HEADERS.length }, () => "");
  cells[0] = user.name;
  cells[16] = user.email.endsWith("@manual.cpvistos") ? "" : user.email;
  cells[17] = user.cel ?? "";
  cells[19] = user.group ?? "";

  await prisma.acompanhamentoClient.create({
    data: {
      source: "imported",
      userId: user.id,
      cells,
    },
  });
}

/**
 * Apaga todas as linhas de Financeiro e Serviços, exceto o cliente TESTE.
 * Não altera Acompanhamento nem cadastros de User/Profile.
 */
export async function clearFinanceAndServiceCostSheetsExceptTeste() {
  const clients = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    select: { id: true, name: true },
  });

  const keepIds = new Set(
    clients
      .filter((user) => normalizeClientName(user.name) === "TESTE")
      .map((user) => user.id),
  );

  const [financeRows, serviceRows] = await Promise.all([
    prisma.financeEntry.findMany({ select: { id: true, userId: true } }),
    prisma.serviceCost.findMany({ select: { id: true, userId: true } }),
  ]);

  const financeToDelete = financeRows
    .filter((row) => !keepIds.has(row.userId))
    .map((row) => row.id);
  const serviceToDelete = serviceRows
    .filter((row) => !keepIds.has(row.userId))
    .map((row) => row.id);

  for (let i = 0; i < financeToDelete.length; i += 100) {
    await prisma.financeEntry.deleteMany({
      where: { id: { in: financeToDelete.slice(i, i + 100) } },
    });
  }
  for (let i = 0; i < serviceToDelete.length; i += 100) {
    await prisma.serviceCost.deleteMany({
      where: { id: { in: serviceToDelete.slice(i, i + 100) } },
    });
  }

  for (const userId of Array.from(keepIds)) {
    await ensureFinanceAndServiceForUser(userId);
  }
}

/** @deprecated use clearFinanceAndServiceCostSheetsExceptTeste */
export async function clearFinanceAndServiceCostSheets() {
  await clearFinanceAndServiceCostSheetsExceptTeste();
}

async function ensureAcertoDeCaixaClient() {
  let user = await prisma.user.findUnique({
    where: { email: ACERTO_DE_CAIXA_EMAIL },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    const password = await bcrypt.hash("cp-vistos-import", 8);
    try {
      user = await prisma.user.create({
        data: {
          name: ACERTO_DE_CAIXA_NAME,
          email: ACERTO_DE_CAIXA_EMAIL,
          password,
          role: Role.CLIENT,
          wantsAmericanVisa: false,
        },
        select: { id: true, name: true, email: true, role: true },
      });
    } catch {
      user = await prisma.user.findUnique({
        where: { email: ACERTO_DE_CAIXA_EMAIL },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!user) {
        throw new Error("Não foi possível criar ACERTO DE CAIXA");
      }
    }
  } else if (normalizeClientName(user.name) !== "ACERTODECAIXA") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: ACERTO_DE_CAIXA_NAME },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  await ensureFinanceAndServiceForUser(user.id);
  return user;
}

/**
 * One-shot após o deploy: limpa planilhas (mantém TESTE), cria ACERTO DE CAIXA.
 * Idempotente — se ACERTO já existe, só garante as linhas.
 */
export async function ensureOperationsSheetsBaseline() {
  const marker = await prisma.user.findUnique({
    where: { email: ACERTO_DE_CAIXA_EMAIL },
    select: { id: true },
  });

  if (!marker) {
    await clearFinanceAndServiceCostSheetsExceptTeste();
  }

  await ensureAcertoDeCaixaClient();

  // Garante TESTE se o usuário existir
  const testeUsers = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    select: { id: true, name: true },
  });
  for (const user of testeUsers) {
    if (normalizeClientName(user.name) === "TESTE") {
      await ensureFinanceAndServiceForUser(user.id);
    }
  }
}

/** Inclui cliente em Serviços, Financeiro e Acompanhamento. */
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
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        group: true,
        cel: true,
      },
    });
    if (existing) {
      if (existing.role !== Role.CLIENT) {
        throw new Error("Este e-mail já está em uso por outra conta");
      }
      if (input.group?.trim() && !existing.group) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { group: input.group.trim() },
        });
        existing.group = input.group.trim();
      }
      await ensureFinanceAndServiceForUser(existing.id);
      await ensureAcompanhamentoRowForUser(existing);
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
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      group: true,
      cel: true,
    },
  });

  await ensureFinanceAndServiceForUser(user.id);
  await ensureAcompanhamentoRowForUser(user);
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
    if (isKeptOperationsSheetClient(user.name)) {
      ids.add(user.id);
    }
  }

  return ids;
}

/**
 * Remove finance/service-cost rows fora do keep set.
 * Desligado enquanto a importação Excel estiver pausada.
 */
export async function purgeFinanceOutsideAcompanhamento() {
  if (OPERATIONS_SYNC_PAUSED) {
    return;
  }

  const keepIds = await getOperationsClientIds();

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
