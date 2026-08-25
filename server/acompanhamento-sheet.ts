import { format, isValid, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import bcrypt from "bcryptjs";
import {
  BudgetPaid,
  Category,
  PaymentStatus,
  Role,
  ScheduleAccount,
  Shipping,
  Status,
  StatusDS,
  VisaClass,
  VisaType,
  type Profile,
  type User,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import payload from "@/data/acompanhamento-clientes.json";
import { expireDateFromIssued } from "@/lib/barcode-validity";
import type {
  AcompanhamentoAccountFields,
  AcompanhamentoRecord,
  AcompanhamentoService,
} from "@/lib/acompanhamento-types";
import { emptyAccountFields, isAcompanhamentoService } from "@/lib/acompanhamento-types";
import {
  ARQUIVADOS_CATEGORY_LABEL,
  SERVICE_TO_ARQUIVADOS_CATEGORY,
} from "@/lib/arquivados-categories";

/** Sync em lote pausado — importação Excel desligada; cadastro manual nas planilhas. */
export const OPERATIONS_SYNC_PAUSED = true;

/**
 * Clientes ativos no Acompanhamento usam source "imported".
 * Arquivados passam a source "archived" (evita filtro MongoDB em archivedAt).
 */
export const ACOMPANHAMENTO_ACTIVE_SOURCE = "imported";
export const ACOMPANHAMENTO_ARCHIVED_SOURCE = "archived";

export function whereActiveAcompanhamento() {
  return { source: ACOMPANHAMENTO_ACTIVE_SOURCE };
}

export const ACOMPANHAMENTO_HEADERS = [
  "NOME",
  "BARCODE",
  "DATA BARCODE",
  "CASV",
  "DT. ENTREV.",
  "REUNIÃO",
  "ENVIO",
  "TIPO",
  "RESP.",
  "PGTO TAXA",
  "DS-160",
  "ALIMTO",
  "OBS",
  "DOB",
  "PPT",
  "CONTA",
  "E-MAIL",
  "TEL.",
  "DT. ENTRADA",
  "GRUPO",
  "PAGTO",
  "STATUS",
] as const;

export const ACOMPANHAMENTO_VISIBLE_HEADERS = [
  "NOME",
  "BARCODE",
  "DATA BARCODE",
  "CASV",
  "DT. ENTREV.",
  "REUNIÃO",
  "PGTO TAXA",
  "DOB",
  "PPT",
  "E-MAIL",
  "DT. ENTRADA",
  "GRUPO",
  "STATUS",
] as const;

const COL = {
  name: 0,
  barcode: 1,
  barcodeDate: 2,
  casv: 3,
  interview: 4,
  meeting: 5,
  shipping: 6,
  tipo: 7,
  resp: 8,
  tax: 9,
  ds160: 10,
  alimto: 11,
  obs: 12,
  dob: 13,
  passport: 14,
  account: 15,
  email: 16,
  phone: 17,
  entry: 18,
  group: 19,
  pagto: 20,
  status: 21,
} as const;

export type { AcompanhamentoRecord };

function cell(cells: string[], index: number) {
  return (cells[index] ?? "").trim();
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return format(value, "dd/MM/yyyy");
}

function parseSheetDate(value: string) {
  if (!value || value.length < 8) {
    return null;
  }

  const parsed = parse(value, "dd/MM/yyyy", new Date());
  if (!isValid(parsed)) {
    return null;
  }

  return fromZonedTime(parsed, "America/Sao_Paulo");
}

function shippingLabel(value: Shipping | null | undefined, fallback = "") {
  switch (value) {
    case Shipping.pickup:
      return "RETIRADA";
    case Shipping.sedex:
      return "SEDEX";
    case Shipping.c_pickup:
      return "C-RETIRADA";
    case Shipping.c_sedex:
      return "C-SEDEX";
    case Shipping.verifying:
      return "A VERIFICAR";
    default:
      return fallback;
  }
}

function parseShipping(value: string): Shipping {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (normalized.includes("C-SEDEX") || normalized.includes("C SEDEX")) {
    return Shipping.c_sedex;
  }
  if (normalized.includes("C-RETIRADA") || normalized.includes("C RETIRADA")) {
    return Shipping.c_pickup;
  }
  if (normalized.includes("SEDEX")) {
    return Shipping.sedex;
  }
  if (normalized.includes("RETIRADA")) {
    return Shipping.pickup;
  }
  return Shipping.verifying;
}

function visaTypeLabel(value: VisaType | null | undefined, fallback = "") {
  switch (value) {
    case VisaType.renovacao:
      return "RENOVAÇÃO";
    case VisaType.primeiro_visto:
      return fallback || "1º VISTO";
    default:
      return fallback;
  }
}

function parseVisaType(value: string): VisaType {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (normalized.includes("RENOV")) {
    return VisaType.renovacao;
  }
  return VisaType.primeiro_visto;
}

function statusDsLabel(value: StatusDS | null | undefined, fallback = "") {
  switch (value) {
    case StatusDS.filling:
      return "PREENCHENDO";
    case StatusDS.filled:
      return "PREENCHIDO";
    case StatusDS.emitted:
      return "EMITIDO";
    case StatusDS.awaiting:
      return "AGUARDANDO";
    default:
      return fallback;
  }
}

function parseStatusDs(value: string): StatusDS {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (normalized.includes("EMIT")) {
    return StatusDS.emitted;
  }
  if (normalized.includes("PREENCHIDO") || normalized.includes("PREENCHIDA")) {
    return StatusDS.filled;
  }
  if (normalized.includes("PREENCHEN")) {
    return StatusDS.filling;
  }
  return StatusDS.awaiting;
}

function paymentLabel(value: PaymentStatus | null | undefined, fallback = "") {
  switch (value) {
    case PaymentStatus.paid:
      return "PAGO";
    case PaymentStatus.pending:
      return "PENDENTE";
    default:
      return fallback;
  }
}

function statusLabel(value: Status | null | undefined, fallback = "") {
  switch (value) {
    case Status.active:
      return "ATIVO";
    case Status.prospect:
      // No Acompanhamento não usamos PROSPECT — em preenchimento = ATIVO.
      return "ATIVO";
    case Status.archived:
      return "ARQUIVADO";
    default:
      return fallback || "ATIVO";
  }
}

function parseStatus(value: string): Status {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (normalized.includes("FINALIZ")) {
    return Status.active;
  }
  if (normalized.includes("ARQUIV")) {
    return Status.archived;
  }
  // PROSPECT no sheet vira ativo (fluxo de preenchimento).
  return Status.active;
}

/** Status da planilha Acompanhamento: ATIVO ou FINALIZADO (nunca PROSPECT). */
export function deriveAcompanhamentoSheetStatus(input: {
  barcode?: string | null;
  barcodeDone?: boolean;
  interview?: string | null;
  statusHint?: string | null;
}): "ATIVO" | "FINALIZADO" {
  const hint = (input.statusHint ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (hint.includes("FINALIZ")) {
    return "FINALIZADO";
  }

  const barcode = (input.barcode ?? "").trim();
  const hasBarcode = Boolean(barcode) || Boolean(input.barcodeDone);
  const interviewDate = parseSheetDate((input.interview ?? "").trim());
  const interviewExpired =
    interviewDate != null && interviewDate.getTime() < Date.now();

  if (hasBarcode && interviewExpired) {
    return "FINALIZADO";
  }

  return "ATIVO";
}

function slugPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

export function isChildSheetName(name: string) {
  return /\(\s*\d+\s*anos?\s*\)/i.test(name);
}

export function isKeptPre2026Client(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return normalized === "TESTE" || normalized === "ACERTODECAIXA";
}

function isPlaceholderEmail(email: string) {
  return email.endsWith("@grupo.cpvistos") || email.endsWith("@acompanhamento.cpvistos");
}

export async function seedImportedAcompanhamentoRows() {
  const rows = payload.rows ?? [];
  // Conta ativos + arquivados para não recriar quem já saiu do Acompanhamento.
  const knownCount = await prisma.acompanhamentoClient.count({
    where: {
      source: {
        in: [ACOMPANHAMENTO_ACTIVE_SOURCE, ACOMPANHAMENTO_ARCHIVED_SOURCE, "imported", "archived"],
      },
    },
  });
  const expected = rows.length;

  if (!expected) {
    return;
  }

  if (knownCount >= expected) {
    return;
  }

  if (knownCount === 0) {
    for (const cells of rows) {
      await prisma.acompanhamentoClient.create({
        data: {
          source: "imported",
          cells: cells.slice(0, ACOMPANHAMENTO_HEADERS.length),
          resp: cells[COL.resp] || null,
          alimto: cells[COL.alimto] || null,
          obs: cells[COL.obs] || null,
          pagto: cells[COL.pagto] || null,
          statusLabel: cells[COL.status] || null,
        },
      });
    }
    return;
  }

  // Partial seed: fingerprints incluem arquivados (evita duplicar após Arquivar).
  const existing = await prisma.acompanhamentoClient.findMany({
    where: {
      source: {
        in: [ACOMPANHAMENTO_ACTIVE_SOURCE, ACOMPANHAMENTO_ARCHIVED_SOURCE, "imported", "archived"],
      },
    },
    select: { cells: true },
  });
  const fingerprints = new Set(
    existing.map((row) => `${cell(row.cells, COL.name)}|${cell(row.cells, COL.barcode)}`.toLowerCase()),
  );

  for (const cells of rows) {
    const key = `${(cells[COL.name] ?? "").trim()}|${(cells[COL.barcode] ?? "").trim()}`.toLowerCase();
    if (fingerprints.has(key)) {
      continue;
    }
    await prisma.acompanhamentoClient.create({
      data: {
        source: "imported",
        cells: cells.slice(0, ACOMPANHAMENTO_HEADERS.length),
        resp: cells[COL.resp] || null,
        alimto: cells[COL.alimto] || null,
        obs: cells[COL.obs] || null,
        pagto: cells[COL.pagto] || null,
        statusLabel: cells[COL.status] || null,
      },
    });
    fingerprints.add(key);
  }
}

export async function purgeCadastroAcompanhamentoRows() {
  await prisma.acompanhamentoClient.deleteMany({
    where: { source: "cadastro" },
  });
}

async function uniqueEmail(preferred: string, fallbackKey: string) {
  const base = preferred.toLowerCase() || `${fallbackKey}@acompanhamento.cpvistos`;
  let email = base;
  let attempt = 1;

  while (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    attempt += 1;
    const [local, domain] = base.split("@");
    email = `${local}+${attempt}@${domain ?? "acompanhamento.cpvistos"}`;
  }

  return email;
}

async function ensureFinanceAndServiceForUser(userId: string) {
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

async function linkAcompanhamentoToUser(
  record: { id: string; cells: string[] },
  userId: string,
) {
  const cells = record.cells;
  await prisma.acompanhamentoClient.update({
    where: { id: record.id },
    data: {
      userId,
      resp: cell(cells, COL.resp) || null,
      alimto: cell(cells, COL.alimto) || null,
      obs: cell(cells, COL.obs) || null,
      pagto: cell(cells, COL.pagto) || null,
      statusLabel: cell(cells, COL.status) || null,
    },
  });
  await ensureFinanceAndServiceForUser(userId);
}

async function registerImportedRow(
  record: { id: string; cells: string[] },
  passwordHash: string,
  options?: { skipBarcodeLink?: boolean },
) {
  const cells = record.cells;
  const name = cell(cells, COL.name) || "Cliente importado";
  const barcode = cell(cells, COL.barcode);

  // Reaproveita usuário órfão de tentativas anteriores (mesmo e-mail import.{id}).
  const importEmail = `import.${record.id}@acompanhamento.cpvistos`;
  const orphan = await prisma.user.findUnique({
    where: { email: importEmail },
    select: { id: true },
  });
  if (orphan) {
    await linkAcompanhamentoToUser(record, orphan.id);
    return;
  }

  if (barcode && !options?.skipBarcodeLink) {
    const existingProfile = await prisma.profile.findFirst({
      where: { DSNumber: barcode },
      select: { userId: true },
    });

    if (existingProfile) {
      const taken = await prisma.acompanhamentoClient.findFirst({
        where: { userId: existingProfile.userId, NOT: { id: record.id } },
        select: { id: true },
      });

      if (!taken) {
        await linkAcompanhamentoToUser(record, existingProfile.userId);
        return;
      }
    }
  }

  const issued = parseSheetDate(cell(cells, COL.barcodeDate));
  const expire = issued ? expireDateFromIssued(issued) : expireDateFromIssued(new Date());
  const taxPaid = cell(cells, COL.tax).toUpperCase().includes("PAGO");
  const entryDate = parseSheetDate(cell(cells, COL.entry));

  let accountId: string;
  try {
    const account = await prisma.user.create({
      data: {
        name,
        email: importEmail,
        password: passwordHash,
        role: Role.CLIENT,
        group: cell(cells, COL.group) || null,
        cel: cell(cells, COL.phone) || null,
        emailScheduleAccount: cell(cells, COL.account) || null,
        wantsAmericanVisa: true,
        createdAt: entryDate ?? new Date(),
      },
    });
    accountId = account.id;
  } catch {
    // Corrida / e-mail já existe: vincula o usuário existente.
    const existing = await prisma.user.findUnique({
      where: { email: importEmail },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Não foi possível criar usuário para ${record.id}`);
    }
    await linkAcompanhamentoToUser(record, existing.id);
    return;
  }

  // Operações (Financeiro/Serviços) primeiro — perfil é opcional e não pode travar o lote.
  await linkAcompanhamentoToUser(record, accountId);

  try {
    const hasProfile = await prisma.profile.findFirst({
      where: { userId: accountId },
      select: { id: true },
    });
    if (hasProfile) {
      return;
    }

    const profile = await prisma.profile.create({
      data: {
        name,
        DSNumber: barcode || `IMP-${record.id.slice(-10)}`,
        DSValid: expire,
        issuanceDate: issued,
        expireDate: expire,
        visaClass: VisaClass.B2_B1,
        visaType: parseVisaType(cell(cells, COL.tipo)),
        category: Category.american_visa,
        status: parseStatus(cell(cells, COL.status)),
        statusDS: parseStatusDs(cell(cells, COL.ds160)),
        shipping: parseShipping(cell(cells, COL.shipping)),
        paymentStatus: taxPaid ? PaymentStatus.paid : PaymentStatus.pending,
        taxDate: taxPaid ? issued ?? new Date() : null,
        CASVDate: parseSheetDate(cell(cells, COL.casv)),
        interviewDate: parseSheetDate(cell(cells, COL.interview)),
        meetingDate: parseSheetDate(cell(cells, COL.meeting)),
        birthDate: parseSheetDate(cell(cells, COL.dob)),
        passport: cell(cells, COL.passport) || null,
        entryDate,
        user: { connect: { id: accountId } },
      },
    });

    await prisma.form.create({
      data: { profile: { connect: { id: profile.id } } },
    });
  } catch (error) {
    console.error("[acompanhamento] perfil/form opcional falhou", record.id, error);
  }
}

/** Religa linhas travadas cujo User já existe (falha parcial em lote anterior). */
export async function relinkOrphanImportUsers(limit = 80) {
  const pending = await prisma.acompanhamentoClient.findMany({
    where: { source: ACOMPANHAMENTO_ACTIVE_SOURCE, userId: null },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, cells: true },
  });

  let linked = 0;
  for (const record of pending) {
    const email = `import.${record.id}@acompanhamento.cpvistos`;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      continue;
    }
    try {
      await linkAcompanhamentoToUser(record, user.id);
      linked += 1;
    } catch (error) {
      console.error("[acompanhamento] relink órfão falhou", record.id, error);
    }
  }
  return linked;
}

export async function ensureImportedClientsRegistered(
  limit = 25,
  options?: { skipBarcodeLink?: boolean },
) {
  const pending = await prisma.acompanhamentoClient.findMany({
    where: { source: ACOMPANHAMENTO_ACTIVE_SOURCE, userId: null },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, cells: true },
  });

  if (!pending.length) {
    return 0;
  }

  // Hash leve: senha só de importação em lote.
  const passwordHash = await bcrypt.hash("cp-vistos-import", 4);
  // Concorrência moderada: operações já avançam antes do perfil.
  const CONCURRENCY = 6;

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const chunk = pending.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (record) => {
        try {
          await registerImportedRow(record, passwordHash, {
            skipBarcodeLink: options?.skipBarcodeLink ?? true,
          });
        } catch (error) {
          console.error("[acompanhamento] falha ao registrar", record.id, error);
          try {
            await prisma.acompanhamentoClient.update({
              where: { id: record.id },
              data: { createdAt: new Date() },
            });
          } catch {
            // ignore
          }
        }
      }),
    );
  }

  return prisma.acompanhamentoClient.count({
    where: { source: ACOMPANHAMENTO_ACTIVE_SOURCE, userId: null },
  });
}

export async function linkImportedFamilyGroups() {
  const records = await prisma.acompanhamentoClient.findMany({
    where: { source: ACOMPANHAMENTO_ACTIVE_SOURCE, userId: { not: null } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          group: true,
          payerUserId: true,
          createdAt: true,
          profiles: {
            select: { entryDate: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const byGroup = new Map<string, typeof records>();

  for (const record of records) {
    if (!record.user) {
      continue;
    }

    const entryDate = record.user.profiles.find((profile) => profile.entryDate)?.entryDate;
    if (entryDate && record.user.createdAt.getTime() !== entryDate.getTime()) {
      await prisma.user.update({
        where: { id: record.user.id },
        data: { createdAt: entryDate },
      });
      record.user.createdAt = entryDate;
    }

    const group = record.user.group?.trim();
    if (!group) {
      if (record.user.payerUserId) {
        await prisma.user.update({
          where: { id: record.user.id },
          data: { payerUserId: null },
        });
      }
      continue;
    }

    const key = group.toLowerCase();
    const list = byGroup.get(key) ?? [];
    list.push(record);
    byGroup.set(key, list);
  }

  for (const members of Array.from(byGroup.values())) {
    if (members.length === 1 && members[0].user?.payerUserId) {
      await prisma.user.update({
        where: { id: members[0].user.id },
        data: { payerUserId: null },
      });
      continue;
    }

    if (members.length < 2) {
      continue;
    }

    const people = members
      .map((member) => member.user)
      .filter((user): user is NonNullable<typeof user> => Boolean(user));
    const adults = people.filter((user) => !isChildSheetName(user.name));
    const pool = adults.length ? adults : people;
    const titular = [...pool].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )[0];

    if (!titular) {
      continue;
    }

    for (const user of people) {
      const nextPayer = user.id === titular.id ? null : titular.id;
      if (user.payerUserId !== nextPayer) {
        await prisma.user.update({
          where: { id: user.id },
          data: { payerUserId: nextPayer },
        });
      }
    }
  }
}

export async function getOperationsSyncStatus() {
  const [totalImported, linkedUsers, pendingUsers] = await Promise.all([
    prisma.acompanhamentoClient.count({
      where: { source: ACOMPANHAMENTO_ACTIVE_SOURCE },
    }),
    prisma.acompanhamentoClient.count({
      where: { source: ACOMPANHAMENTO_ACTIVE_SOURCE, userId: { not: null } },
    }),
    prisma.acompanhamentoClient.count({
      where: { source: ACOMPANHAMENTO_ACTIVE_SOURCE, userId: null },
    }),
  ]);

  return {
    pendingSync: pendingUsers,
    totalImported,
    linkedUsers,
  };
}

/**
 * Garante seed inicial do Excel. Nunca desarquiva clientes —
 * isso quebrava o botão Arquivar (eles voltavam na próxima listagem).
 */
export async function restoreAcompanhamentoFromExcel() {
  await seedImportedAcompanhamentoRows();
  await purgeCadastroAcompanhamentoRows();
  return getOperationsSyncStatus();
}

/**
 * Preenche Financeiro / Serviços a partir do Excel CLIENTES.
 * NÃO apaga progresso já feito (o wipe era o que travava em ~4/171).
 */
export async function rebuildFinanceFromExcel(options?: {
  budgetMs?: number;
  batchSize?: number;
}) {
  const budgetMs = options?.budgetMs ?? 45000;
  const batchSize = options?.batchSize ?? 40;
  const started = Date.now();

  await restoreAcompanhamentoFromExcel();
  await relinkOrphanImportUsers(120);

  let pendingUsers = await ensureImportedClientsRegistered(batchSize, {
    skipBarcodeLink: true,
  });
  while (pendingUsers > 0 && Date.now() - started < budgetMs) {
    await relinkOrphanImportUsers(80);
    pendingUsers = await ensureImportedClientsRegistered(batchSize, {
      skipBarcodeLink: true,
    });
  }

  const pendingFinance = await ensureImportedFinanceAndServiceRows();

  if (pendingUsers === 0) {
    await linkImportedFamilyGroups();
  } else {
    // Liga grupos já cadastrados mesmo com fila ainda andando.
    await linkImportedFamilyGroups();
  }

  // Garante Isadora
  const kept = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    select: { id: true, name: true },
  });
  for (const user of kept) {
    if (!isKeptPre2026Client(user.name)) continue;
    try {
      await ensureFinanceAndServiceForUser(user.id);
    } catch {
      // ignore
    }
  }

  const status = await getOperationsSyncStatus();
  return {
    ...status,
    pendingSync: pendingUsers + pendingFinance,
  };
}

/** Um lote de cadastro — front e cron. Nunca apaga o progresso já feito. */
export async function runOperationsSyncBatch(options?: {
  budgetMs?: number;
  batchSize?: number;
}) {
  if (OPERATIONS_SYNC_PAUSED) {
    const status = await getOperationsSyncStatus();
    return {
      ...status,
      pendingSync: Math.max(0, status.totalImported - status.linkedUsers),
      paused: true as const,
    };
  }

  const budgetMs = options?.budgetMs ?? 25000;
  const batchSize = options?.batchSize ?? 50;

  // Nunca chama wipe/rebuild destrutivo aqui — só avança o cadastro.
  await restoreAcompanhamentoFromExcel();
  await relinkOrphanImportUsers(100);

  const started = Date.now();
  let pendingUsers = await ensureImportedClientsRegistered(batchSize, {
    skipBarcodeLink: true,
  });

  while (pendingUsers > 0 && Date.now() - started < budgetMs) {
    await relinkOrphanImportUsers(60);
    pendingUsers = await ensureImportedClientsRegistered(batchSize, {
      skipBarcodeLink: true,
    });
  }

  const pendingFinance = await ensureImportedFinanceAndServiceRows();
  await linkImportedFamilyGroups();

  const status = await getOperationsSyncStatus();

  return {
    ...status,
    pendingSync: pendingUsers + pendingFinance,
  };
}

export async function syncExcelClientsForOperations(options?: {
  linkFamilies?: boolean;
}) {
  const batch = await runOperationsSyncBatch();

  if (options?.linkFamilies && batch.pendingSync === 0) {
    await linkImportedFamilyGroups();
  }

  return batch;
}

/**
 * Garante FinanceEntry + ServiceCost para todos os clientes importados do
 * Acompanhamento (ativos e arquivados — arquivados continuam no financeiro).
 * Retorna quantos usuários ainda faltam.
 */
async function ensureImportedFinanceAndServiceRows() {
  const imported = await prisma.acompanhamentoClient.findMany({
    where: {
      source: { in: [ACOMPANHAMENTO_ACTIVE_SOURCE, ACOMPANHAMENTO_ARCHIVED_SOURCE] },
      userId: { not: null },
    },
    select: { userId: true },
  });
  const ids = Array.from(
    new Set(imported.map((row) => row.userId).filter((id): id is string => Boolean(id))),
  );

  if (!ids.length) {
    return 0;
  }

  const hasFinance = new Set<string>();
  const hasCost = new Set<string>();

  // MongoDB/$in: busca em fatias para não estourar o payload.
  for (let i = 0; i < ids.length; i += 100) {
    const slice = ids.slice(i, i + 100);
    const [finances, costs] = await Promise.all([
      prisma.financeEntry.findMany({
        where: { userId: { in: slice } },
        select: { userId: true },
      }),
      prisma.serviceCost.findMany({
        where: { userId: { in: slice } },
        select: { userId: true },
      }),
    ]);
    for (const row of finances) hasFinance.add(row.userId);
    for (const row of costs) hasCost.add(row.userId);
  }

  const needFinance = ids.filter((userId) => !hasFinance.has(userId));
  const needCost = ids.filter((userId) => !hasCost.has(userId));

  const BATCH = 40;
  const budgetMs = 6000;
  const started = Date.now();

  for (let i = 0; i < needFinance.length && Date.now() - started < budgetMs; i += BATCH) {
    const chunk = needFinance.slice(i, i + BATCH);
    await Promise.all(
      chunk.map(async (userId) => {
        try {
          await prisma.financeEntry.create({
            data: { userId, status: BudgetPaid.pending },
          });
          hasFinance.add(userId);
        } catch {
          hasFinance.add(userId);
        }
      }),
    );
  }

  for (let i = 0; i < needCost.length && Date.now() - started < budgetMs; i += BATCH) {
    const chunk = needCost.slice(i, i + BATCH);
    await Promise.all(
      chunk.map(async (userId) => {
        try {
          await prisma.serviceCost.create({
            data: { userId },
          });
          hasCost.add(userId);
        } catch {
          hasCost.add(userId);
        }
      }),
    );
  }

  return ids.filter((userId) => !hasFinance.has(userId) || !hasCost.has(userId)).length;
}

function pickProfile(profiles: Profile[]) {
  return (
    profiles.find((profile) => profile.category === Category.american_visa) ??
    profiles[0] ??
    null
  );
}

function buildAccountFields(user: User | null | undefined): AcompanhamentoAccountFields | null {
  if (!user) {
    return null;
  }

  return emptyAccountFields({
    cpf: user.cpf ?? "",
    address: user.address ?? "",
    cel: user.cel ?? "",
    email: isPlaceholderEmail(user.email) ? "" : user.email,
    password: user.password ?? "",
    passwordConfirm: user.password ?? "",
    emailScheduleAccount: user.emailScheduleAccount ?? "",
    passwordScheduleAccount: user.passwordScheduleAccount ?? "",
    passwordConfirmScheduleAccount: user.passwordScheduleAccount ?? "",
    budget: user.budget != null ? String(user.budget) : "",
    budgetPaid: user.budgetPaid === BudgetPaid.paid ? "Pago" : user.budgetPaid === BudgetPaid.pending ? "Pendente" : "",
    scheduleAccount:
      user.scheduleAccount === ScheduleAccount.active
        ? "Ativado"
        : user.scheduleAccount === ScheduleAccount.inactive
          ? "Inativo"
          : "",
  });
}

function normalizeServices(values: string[] | undefined | null): AcompanhamentoService[] {
  if (!values?.length) {
    return [];
  }

  return Array.from(new Set(values.filter(isAcompanhamentoService)));
}

function buildRecord(
  record: {
    id: string;
    cells: string[];
    resp?: string | null;
    alimto?: string | null;
    obs?: string | null;
    pagto?: string | null;
    statusLabel?: string | null;
    extraDate?: string | null;
    sheetComment?: string | null;
    services?: string[] | null;
    userId: string | null;
    user: (User & { profiles: Profile[]; payerEmail?: string }) | null;
  },
): AcompanhamentoRecord {
  const cells = record.cells;
  const user = record.user;
  const profile = user ? pickProfile(user.profiles) : null;
  const email = user
    ? isPlaceholderEmail(user.email)
      ? user.payerEmail || cell(cells, COL.email)
      : user.email
    : cell(cells, COL.email);
  const issued = profile?.issuanceDate ?? parseSheetDate(cell(cells, COL.barcodeDate));
  const expire = profile?.expireDate ?? profile?.DSValid ?? (issued ? expireDateFromIssued(issued) : null);

  return {
    id: record.id,
    userId: record.userId,
    profileId: profile?.id ?? null,
    formStep: profile?.formStep ?? 0,
    name: profile?.name || user?.name || cell(cells, COL.name),
    barcode: profile?.DSNumber || cell(cells, COL.barcode),
    barcodeIssued: formatDate(issued) || cell(cells, COL.barcodeDate),
    barcodeExpire: formatDate(expire),
    barcodeDone: record.extraDate === "done",
    casv: formatDate(profile?.CASVDate) || cell(cells, COL.casv),
    interview: formatDate(profile?.interviewDate) || cell(cells, COL.interview),
    meeting: formatDate(profile?.meetingDate) || cell(cells, COL.meeting),
    shipping: cell(cells, COL.shipping) || shippingLabel(profile?.shipping),
    tipo: cell(cells, COL.tipo) || visaTypeLabel(profile?.visaType),
    resp: record.resp || cell(cells, COL.resp),
    tax: cell(cells, COL.tax) || (profile?.taxDate ? "PAGO" : paymentLabel(profile?.paymentStatus)),
    ds160: cell(cells, COL.ds160) || statusDsLabel(profile?.statusDS),
    alimto: record.alimto || cell(cells, COL.alimto),
    obs: record.obs || cell(cells, COL.obs),
    dob: formatDate(profile?.birthDate) || cell(cells, COL.dob),
    passport: profile?.passport || cell(cells, COL.passport),
    account: user?.emailScheduleAccount || cell(cells, COL.account),
    email,
    phone: user?.cel || cell(cells, COL.phone),
    entryDate: formatDate(profile?.entryDate) || cell(cells, COL.entry),
    group: user?.group || cell(cells, COL.group),
    pagto: record.pagto || cell(cells, COL.pagto),
    status: deriveAcompanhamentoSheetStatus({
      barcode: profile?.DSNumber || cell(cells, COL.barcode),
      barcodeDone: record.extraDate === "done",
      interview: formatDate(profile?.interviewDate) || cell(cells, COL.interview),
      statusHint: record.statusLabel || cell(cells, COL.status),
    }),
    sheetComment: record.sheetComment ?? "",
    services: normalizeServices(record.services),
    accountFields: buildAccountFields(user),
  };
}

export function visibleCells(row: AcompanhamentoRecord) {
  return ACOMPANHAMENTO_VISIBLE_HEADERS.map((header) => {
    switch (header) {
      case "NOME":
        return row.name;
      case "BARCODE":
        return row.barcode;
      case "DATA BARCODE":
        return row.barcodeIssued;
      case "CASV":
        return row.casv;
      case "DT. ENTREV.":
        return row.interview;
      case "REUNIÃO":
        return row.meeting;
      case "PGTO TAXA":
        return row.tax;
      case "DOB":
        return row.dob;
      case "PPT":
        return row.passport;
      case "E-MAIL":
        return row.email;
      case "DT. ENTRADA":
        return row.entryDate;
      case "GRUPO":
        return row.group;
      case "STATUS":
        return row.status;
      default:
        return "";
    }
  });
}

export async function listAcompanhamentoSheet() {
  await restoreAcompanhamentoFromExcel();
  const sync = await getOperationsSyncStatus();

  const records = await prisma.acompanhamentoClient.findMany({
    where: { source: ACOMPANHAMENTO_ACTIVE_SOURCE },
    include: {
      user: {
        include: {
          profiles: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const payerIds = Array.from(
    new Set(
      records
        .map((record) => record.user?.payerUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const payers = payerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: payerIds } },
        select: { id: true, email: true },
      })
    : [];
  const payerEmailById = new Map(payers.map((payer) => [payer.id, payer.email]));

  const mapped = records.map((record) =>
    buildRecord({
      ...record,
      user: record.user
        ? {
            ...record.user,
            payerEmail: record.user.payerUserId
              ? payerEmailById.get(record.user.payerUserId)
              : undefined,
          }
        : null,
    }),
  );

  // Mais recentes primeiro (cadastro do usuário / entrada na planilha).
  const rows = [...mapped].sort((a, b) => {
    const recordA = records.find((r) => r.id === a.id);
    const recordB = records.find((r) => r.id === b.id);
    const timeA = Math.max(
      recordA?.user?.createdAt?.getTime() ?? 0,
      recordA?.createdAt?.getTime() ?? 0,
    );
    const timeB = Math.max(
      recordB?.user?.createdAt?.getTime() ?? 0,
      recordB?.createdAt?.getTime() ?? 0,
    );
    return timeB - timeA;
  });

  return {
    headers: [...ACOMPANHAMENTO_VISIBLE_HEADERS],
    rows,
    pendingSync: sync.pendingSync,
    totalImported: sync.totalImported,
    linkedUsers: sync.linkedUsers,
  };
}

export async function getAcompanhamentoRecord(id: string) {
  const record = await prisma.acompanhamentoClient.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          profiles: true,
        },
      },
    },
  });

  if (!record) {
    return null;
  }

  return buildRecord(record);
}

export type AcompanhamentoUpdateInput = {
  id: string;
  name: string;
  barcode: string;
  barcodeIssued: string;
  casv: string;
  interview: string;
  meeting: string;
  shipping: string;
  tipo: string;
  resp: string;
  tax: string;
  ds160: string;
  alimto: string;
  obs: string;
  dob: string;
  passport: string;
  account: string;
  email: string;
  phone: string;
  entryDate: string;
  group: string;
  pagto: string;
  status: string;
  barcodeDone: boolean;
  sheetComment: string;
  services: AcompanhamentoService[];
  accountFields?: AcompanhamentoAccountFields | null;
};

export type AcompanhamentoCreateInput = Omit<AcompanhamentoUpdateInput, "id">;

function cellsFromInput(input: AcompanhamentoCreateInput) {
  return [
    input.name,
    input.barcode,
    input.barcodeIssued,
    input.casv,
    input.interview,
    input.meeting,
    input.shipping,
    input.tipo,
    input.resp,
    input.tax,
    input.ds160,
    input.alimto,
    input.obs,
    input.dob,
    input.passport,
    input.account,
    input.email,
    input.phone,
    input.entryDate,
    input.group,
    input.pagto,
    input.status,
  ];
}

async function applyAccountFields(userId: string, input: AcompanhamentoAccountFields, fallbackName: string) {
  const email = input.email.trim().toLowerCase();
  if (email && !isPlaceholderEmail(email)) {
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (taken && taken.id !== userId) {
      throw new Error("E-mail já está sendo utilizado em outra conta");
    }
  }

  if (input.password && input.password !== input.passwordConfirm) {
    throw new Error("As senhas da conta não coincidem");
  }

  if (
    input.passwordScheduleAccount &&
    input.passwordScheduleAccount !== input.passwordConfirmScheduleAccount
  ) {
    throw new Error("As senhas da conta de agendamento não coincidem");
  }

  if (input.password && input.password.length < 6) {
    throw new Error("Senha inválida, precisa ter no mínimo 6 caracteres");
  }

  if (input.passwordScheduleAccount && input.passwordScheduleAccount.length < 6) {
    throw new Error("Senha de agendamento inválida, precisa ter no mínimo 6 caracteres");
  }

  const budgetPaid =
    input.budgetPaid === "Pago"
      ? BudgetPaid.paid
      : input.budgetPaid === "Pendente"
        ? BudgetPaid.pending
        : null;
  const scheduleAccount =
    input.scheduleAccount === "Ativado"
      ? ScheduleAccount.active
      : input.scheduleAccount === "Inativo"
        ? ScheduleAccount.inactive
        : null;

  const budgetValue = input.budget.trim() ? Number(input.budget.replace(",", ".")) : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: fallbackName || undefined,
      cpf: input.cpf.trim() || null,
      address: input.address.trim() || null,
      cel: input.cel.trim() || null,
      ...(email && !isPlaceholderEmail(email) ? { email } : {}),
      ...(input.password ? { password: input.password } : {}),
      emailScheduleAccount: input.emailScheduleAccount.trim() || null,
      ...(input.passwordScheduleAccount
        ? { passwordScheduleAccount: input.passwordScheduleAccount }
        : {}),
      ...(budgetValue != null && Number.isFinite(budgetValue) ? { budget: budgetValue } : {}),
      ...(budgetPaid ? { budgetPaid } : { budgetPaid: null }),
      ...(scheduleAccount ? { scheduleAccount } : { scheduleAccount: null }),
    },
  });
}

export async function createAcompanhamentoRecord(input: AcompanhamentoCreateInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Informe o nome do cliente");
  }

  const services = normalizeServices(input.services);
  const derivedStatus = deriveAcompanhamentoSheetStatus({
    barcode: input.barcode,
    barcodeDone: input.barcodeDone,
    interview: input.interview,
    statusHint: input.status,
  });
  const cells = cellsFromInput({ ...input, name, status: derivedStatus });

  const record = await prisma.acompanhamentoClient.create({
    data: {
      source: "imported",
      cells,
      resp: input.resp || null,
      alimto: input.alimto || null,
      obs: input.obs || null,
      pagto: input.pagto || null,
      statusLabel: derivedStatus,
      extraDate: input.barcodeDone ? "done" : null,
      sheetComment: input.sheetComment.trim() || null,
      services,
    },
  });

  const updated = await updateAcompanhamentoRecord({
    id: record.id,
    ...input,
    name,
    services,
    status: derivedStatus,
  });
  if (input.group?.trim()) {
    await linkImportedFamilyGroups();
  }
  return updated;
}

export async function updateAcompanhamentoSheetComment(id: string, sheetComment: string) {
  const updated = await prisma.acompanhamentoClient.update({
    where: { id },
    data: { sheetComment: sheetComment.trim() || null },
  });

  return getAcompanhamentoRecord(updated.id);
}

export async function updateAcompanhamentoRecord(input: AcompanhamentoUpdateInput) {
  const current = await prisma.acompanhamentoClient.findUnique({
    where: { id: input.id },
    include: {
      user: {
        include: { profiles: true },
      },
    },
  });

  if (!current) {
    return null;
  }

  if (current.source === ACOMPANHAMENTO_ARCHIVED_SOURCE || current.archivedAt) {
    throw new Error("Cliente arquivado — edição indisponível no Acompanhamento");
  }

  await ensureImportedClientsRegistered(1);

  const linked =
    current.userId && current.user
      ? current
      : await prisma.acompanhamentoClient.findUnique({
          where: { id: input.id },
          include: { user: { include: { profiles: true } } },
        });

  if (!linked?.user) {
    const passwordHash = await bcrypt.hash("cp-vistos-import", 8);
    await registerImportedRow({ id: input.id, cells: current.cells }, passwordHash);
  }

  const fresh = await prisma.acompanhamentoClient.findUnique({
    where: { id: input.id },
    include: { user: { include: { profiles: true } } },
  });

  if (!fresh?.user) {
    return null;
  }

  const profile = pickProfile(fresh.user.profiles);
  const issued = parseSheetDate(input.barcodeIssued);
  const expire = issued ? expireDateFromIssued(issued) : profile?.DSValid;
  const taxPaid = input.tax.toUpperCase().includes("PAGO");

  await prisma.user.update({
    where: { id: fresh.user.id },
    data: {
      name: input.name.trim() || fresh.user.name,
      group: input.group.trim() || null,
      cel: input.phone.trim() || null,
      emailScheduleAccount: input.account.trim() || null,
      ...(!isPlaceholderEmail(fresh.user.email) || input.email.trim()
        ? {
            email: isPlaceholderEmail(fresh.user.email) && input.email.trim()
              ? await uniqueEmail(input.email.trim().toLowerCase(), fresh.user.id)
              : fresh.user.email,
          }
        : {}),
    },
  });

  if (isPlaceholderEmail(fresh.user.email) && input.email.trim() && !isPlaceholderEmail(input.email.trim())) {
    try {
      await prisma.user.update({
        where: { id: fresh.user.id },
        data: { email: input.email.trim().toLowerCase() },
      });
    } catch {
      // keep unique email if already taken
    }
  }

  const profileData = {
    name: input.name.trim() || fresh.user.name,
    DSNumber: input.barcode.trim(),
    issuanceDate: issued,
    expireDate: expire,
    DSValid: expire ?? expireDateFromIssued(new Date()),
    CASVDate: parseSheetDate(input.casv),
    interviewDate: parseSheetDate(input.interview),
    meetingDate: parseSheetDate(input.meeting),
    shipping: parseShipping(input.shipping),
    visaType: parseVisaType(input.tipo),
    statusDS: parseStatusDs(input.ds160),
    paymentStatus: taxPaid ? PaymentStatus.paid : PaymentStatus.pending,
    taxDate: taxPaid ? issued ?? new Date() : null,
    birthDate: parseSheetDate(input.dob),
    passport: input.passport.trim() || null,
    entryDate: parseSheetDate(input.entryDate),
    status: Status.active,
  };

  if (profile) {
    await prisma.profile.update({
      where: { id: profile.id },
      data: profileData,
    });
  }

  const derivedStatus = deriveAcompanhamentoSheetStatus({
    barcode: input.barcode,
    barcodeDone: input.barcodeDone,
    interview: input.interview,
    statusHint: input.status,
  });
  const nextCells = cellsFromInput({ ...input, status: derivedStatus });
  const services = normalizeServices(input.services);

  await prisma.acompanhamentoClient.update({
    where: { id: input.id },
    data: {
      cells: nextCells,
      resp: input.resp || null,
      alimto: input.alimto || null,
      obs: input.obs || null,
      pagto: input.pagto || null,
      statusLabel: derivedStatus,
      extraDate: input.barcodeDone ? "done" : null,
      sheetComment: input.sheetComment.trim() || null,
      services,
    },
  });

  if (input.accountFields) {
    await applyAccountFields(fresh.user.id, input.accountFields, input.name.trim() || fresh.user.name);
  }

  return getAcompanhamentoRecord(input.id);
}

/**
 * Move client out of Acompanhamento and copy into Arquivados tabs
 * matching each selected service (one row per service / intentional duplicates).
 */
export async function archiveAcompanhamentoClient(
  id: string,
  servicesInput: AcompanhamentoService[],
) {
  const services = normalizeServices(servicesInput);
  if (!services.length) {
    throw new Error("Marque ao menos um serviço para definir as abas de Arquivados");
  }

  const existing = await prisma.acompanhamentoClient.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  if (existing.source === ACOMPANHAMENTO_ARCHIVED_SOURCE || existing.archivedAt) {
    throw new Error("Este cliente já foi arquivado");
  }

  const row = await getAcompanhamentoRecord(id);
  if (!row) {
    return null;
  }

  const categories: string[] = [];

  for (const service of services) {
    const category = SERVICE_TO_ARQUIVADOS_CATEGORY[service];
    await prisma.arquivadoClient.create({
      data: {
        category,
        name: row.name,
        barcode: row.barcode,
        barcodeIssued: row.barcodeIssued,
        barcodeDone: row.barcodeDone,
        casv: row.casv,
        interview: row.interview,
        meeting: row.meeting || row.shipping,
        tax: row.tax,
        dob: row.dob,
        passport: row.passport,
        email: row.email,
        entryDate: row.entryDate,
        group: row.group,
        status: row.status,
        sheetComment: row.sheetComment,
        services: [service],
        sourceAcompanhamentoId: id,
        sourceUserId: row.userId,
      },
    });
    categories.push(category);
  }

  await prisma.acompanhamentoClient.update({
    where: { id },
    data: {
      services,
      archivedAt: new Date(),
      source: ACOMPANHAMENTO_ARCHIVED_SOURCE,
    },
  });

  return {
    categories,
    labels: categories.map((category) => ARQUIVADOS_CATEGORY_LABEL[category as keyof typeof ARQUIVADOS_CATEGORY_LABEL] ?? category),
  };
}
