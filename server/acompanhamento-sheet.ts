import { format, isValid, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import bcrypt from "bcryptjs";
import {
  BudgetPaid,
  Category,
  PaymentStatus,
  Role,
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
import type { AcompanhamentoRecord } from "@/lib/acompanhamento-types";

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
      return "PROSPECT";
    case Status.archived:
      return "ARQUIVADO";
    default:
      return fallback;
  }
}

function parseStatus(value: string): Status {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (normalized.includes("PROSPECT")) {
    return Status.prospect;
  }
  if (normalized.includes("ARQUIV")) {
    return Status.archived;
  }
  return Status.active;
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
    .replace(/[^A-Z]/g, "");

  return normalized.includes("ISADORAMARCILIDOSSANTOS");
}

function isPlaceholderEmail(email: string) {
  return email.endsWith("@grupo.cpvistos") || email.endsWith("@acompanhamento.cpvistos");
}

export async function seedImportedAcompanhamentoRows() {
  const rows = payload.rows ?? [];
  const importedCount = await prisma.acompanhamentoClient.count({
    where: { source: "imported" },
  });
  const expected = rows.length;

  if (!expected) {
    return;
  }

  if (importedCount >= expected) {
    return;
  }

  if (importedCount === 0) {
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

  // Partial seed: add missing rows by name+barcode fingerprint
  const existing = await prisma.acompanhamentoClient.findMany({
    where: { source: "imported" },
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

async function registerImportedRow(
  record: { id: string; cells: string[] },
  passwordHash: string,
) {
  const cells = record.cells;
  const name = cell(cells, COL.name) || "Cliente importado";
  const barcode = cell(cells, COL.barcode);
  const emailFromSheet = cell(cells, COL.email).toLowerCase();

  if (barcode) {
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
        await prisma.acompanhamentoClient.update({
          where: { id: record.id },
          data: {
            userId: existingProfile.userId,
            resp: cell(cells, COL.resp) || null,
            alimto: cell(cells, COL.alimto) || null,
            obs: cell(cells, COL.obs) || null,
            pagto: cell(cells, COL.pagto) || null,
            statusLabel: cell(cells, COL.status) || null,
          },
        });
        return;
      }
    }
  }

  const fallbackKey = slugPart(barcode || name) || record.id.slice(-8);
  const email = await uniqueEmail(emailFromSheet, `import.${fallbackKey}`);
  const issued = parseSheetDate(cell(cells, COL.barcodeDate));
  const expire = issued ? expireDateFromIssued(issued) : expireDateFromIssued(new Date());
  const taxPaid = cell(cells, COL.tax).toUpperCase().includes("PAGO");

  const entryDate = parseSheetDate(cell(cells, COL.entry));

  const account = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: Role.CLIENT,
      group: cell(cells, COL.group) || null,
      cel: cell(cells, COL.phone) || null,
      emailScheduleAccount: cell(cells, COL.account) || null,
      wantsAmericanVisa: true,
      createdAt: entryDate ?? new Date(),
    },
  });

  await prisma.financeEntry.create({
    data: { userId: account.id, status: BudgetPaid.pending },
  });
  await prisma.serviceCost.create({
    data: { userId: account.id },
  });

  const profile = await prisma.profile.create({
    data: {
      name,
      DSNumber: barcode,
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
      user: { connect: { id: account.id } },
    },
  });

  await prisma.form.create({
    data: { profile: { connect: { id: profile.id } } },
  });

  await prisma.acompanhamentoClient.update({
    where: { id: record.id },
    data: {
      userId: account.id,
      resp: cell(cells, COL.resp) || null,
      alimto: cell(cells, COL.alimto) || null,
      obs: cell(cells, COL.obs) || null,
      pagto: cell(cells, COL.pagto) || null,
      statusLabel: cell(cells, COL.status) || null,
    },
  });
}

export async function ensureImportedClientsRegistered(limit = 25) {
  const pending = await prisma.acompanhamentoClient.findMany({
    where: { source: "imported", userId: null },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, cells: true },
  });

  if (!pending.length) {
    return 0;
  }

  const passwordHash = await bcrypt.hash("cp-vistos-import", 8);

  for (const record of pending) {
    await registerImportedRow(record, passwordHash);
  }

  return prisma.acompanhamentoClient.count({
    where: { source: "imported", userId: null },
  });
}

export async function linkImportedFamilyGroups() {
  const records = await prisma.acompanhamentoClient.findMany({
    where: { source: "imported", userId: { not: null } },
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

export async function syncExcelClientsForOperations() {
  await seedImportedAcompanhamentoRows();
  await purgeCadastroAcompanhamentoRows();
  const started = Date.now();
  let pending = await ensureImportedClientsRegistered(20);

  while (pending > 0 && Date.now() - started < 7000) {
    pending = await ensureImportedClientsRegistered(20);
  }

  await linkImportedFamilyGroups();
  const pendingFinance = await ensureImportedFinanceAndServiceRows();
  return pending + pendingFinance;
}

async function ensureImportedFinanceAndServiceRows() {
  const imported = await prisma.acompanhamentoClient.findMany({
    where: { source: "imported", userId: { not: null } },
    select: { userId: true },
  });
  const ids = imported
    .map((row) => row.userId)
    .filter((id): id is string => Boolean(id));

  if (!ids.length) {
    return 0;
  }

  const [finances, costs] = await Promise.all([
    prisma.financeEntry.findMany({
      where: { userId: { in: ids } },
      select: { userId: true },
    }),
    prisma.serviceCost.findMany({
      where: { userId: { in: ids } },
      select: { userId: true },
    }),
  ]);

  const hasFinance = new Set(finances.map((row) => row.userId));
  const hasCost = new Set(costs.map((row) => row.userId));
  const missing = ids.filter((userId) => !hasFinance.has(userId) || !hasCost.has(userId));

  let created = 0;
  for (const userId of missing) {
    if (created >= 80) {
      break;
    }

    if (!hasFinance.has(userId)) {
      await prisma.financeEntry.create({
        data: { userId, status: BudgetPaid.pending },
      });
      created += 1;
    }
    if (!hasCost.has(userId)) {
      await prisma.serviceCost.create({
        data: { userId },
      });
      created += 1;
    }
  }

  return Math.max(0, missing.length - 80);
}

function pickProfile(profiles: Profile[]) {
  return (
    profiles.find((profile) => profile.category === Category.american_visa) ??
    profiles[0] ??
    null
  );
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
    status: record.statusLabel || cell(cells, COL.status) || statusLabel(profile?.status),
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
  const pendingSync = await syncExcelClientsForOperations();

  const records = await prisma.acompanhamentoClient.findMany({
    where: { source: "imported" },
    include: {
      user: {
        include: {
          profiles: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
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

  const rows = records.map((record) =>
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

  return {
    headers: [...ACOMPANHAMENTO_VISIBLE_HEADERS],
    rows,
    pendingSync,
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
};

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
    status: parseStatus(input.status),
  };

  if (profile) {
    await prisma.profile.update({
      where: { id: profile.id },
      data: profileData,
    });
  }

  const nextCells = [
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

  await prisma.acompanhamentoClient.update({
    where: { id: input.id },
    data: {
      cells: nextCells,
      resp: input.resp || null,
      alimto: input.alimto || null,
      obs: input.obs || null,
      pagto: input.pagto || null,
      statusLabel: input.status || null,
      extraDate: input.barcodeDone ? "done" : null,
    },
  });

  return getAcompanhamentoRecord(input.id);
}
