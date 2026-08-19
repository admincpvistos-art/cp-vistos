import { format } from "date-fns";
import {
  Category,
  PaymentStatus,
  Role,
  Shipping,
  Status,
  StatusDS,
  VisaType,
  type Profile,
  type User,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import payload from "@/data/acompanhamento-clientes.json";

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
  "8/11/26",
] as const;

export type AcompanhamentoSheetRow = {
  id: string;
  userId: string | null;
  profileId: string | null;
  category: "american_visa" | "passport" | "e_ta" | null;
  formStep: number;
  cells: string[];
};

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return format(value, "dd/MM/yyyy");
}

function shippingLabel(value: Shipping | null | undefined) {
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
      return "";
  }
}

function visaTypeLabel(value: VisaType | null | undefined) {
  switch (value) {
    case VisaType.renovacao:
      return "RENOVAÇÃO";
    case VisaType.primeiro_visto:
      return "1º VISTO";
    default:
      return "";
  }
}

function statusDsLabel(value: StatusDS | null | undefined) {
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
      return "";
  }
}

function paymentLabel(value: PaymentStatus | null | undefined) {
  switch (value) {
    case PaymentStatus.paid:
      return "PAGO";
    case PaymentStatus.pending:
      return "PENDENTE";
    default:
      return "";
  }
}

function statusLabel(value: Status | null | undefined) {
  switch (value) {
    case Status.active:
      return "ATIVO";
    case Status.prospect:
      return "PROSPECT";
    case Status.archived:
      return "ARQUIVADO";
    default:
      return "";
  }
}

function isPlaceholderEmail(email: string) {
  return email.endsWith("@grupo.cpvistos");
}

function pickProfile(profiles: Profile[]) {
  return (
    profiles.find((profile) => profile.category === Category.american_visa) ??
    profiles[0] ??
    null
  );
}

export async function upsertAcompanhamentoForUser(userId: string) {
  const existing = await prisma.acompanhamentoClient.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.acompanhamentoClient.create({
    data: {
      userId,
      source: "cadastro",
      cells: [],
    },
  });
}

export async function seedImportedAcompanhamentoRows() {
  const importedCount = await prisma.acompanhamentoClient.count({
    where: { source: "imported" },
  });

  if (importedCount > 0 || !payload.rows?.length) {
    return;
  }

  for (const cells of payload.rows) {
    await prisma.acompanhamentoClient.create({
      data: {
        source: "imported",
        cells,
      },
    });
  }
}

export async function backfillCadastroAcompanhamentoRows() {
  const [clients, existing] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.CLIENT },
      select: { id: true },
    }),
    prisma.acompanhamentoClient.findMany({
      where: { userId: { not: null } },
      select: { userId: true },
    }),
  ]);

  const alreadyTracked = new Set(existing.map((row) => row.userId));

  for (const client of clients) {
    if (!alreadyTracked.has(client.id)) {
      await upsertAcompanhamentoForUser(client.id);
    }
  }
}

function buildCellsFromUser(
  user: User & { profiles: Profile[]; payerEmail?: string },
  extras: {
    resp?: string | null;
    alimto?: string | null;
    obs?: string | null;
    pagto?: string | null;
    statusLabel?: string | null;
    extraDate?: string | null;
  },
) {
  const profile = pickProfile(user.profiles);
  const email = isPlaceholderEmail(user.email) ? user.payerEmail ?? "" : user.email;

  return [
    user.name,
    profile?.DSNumber ?? "",
    formatDate(profile?.issuanceDate ?? profile?.DSValid),
    formatDate(profile?.CASVDate),
    formatDate(profile?.interviewDate),
    formatDate(profile?.meetingDate),
    shippingLabel(profile?.shipping),
    visaTypeLabel(profile?.visaType),
    extras.resp ?? "",
    profile?.taxDate ? "PAGO" : paymentLabel(profile?.paymentStatus),
    statusDsLabel(profile?.statusDS),
    extras.alimto ?? "",
    extras.obs ?? "",
    formatDate(profile?.birthDate),
    profile?.passport ?? "",
    user.emailScheduleAccount ?? "",
    email,
    user.cel ?? "",
    formatDate(user.createdAt),
    user.group ?? "",
    extras.pagto ?? paymentLabel(profile?.paymentStatus),
    extras.statusLabel ?? statusLabel(profile?.status),
    extras.extraDate ?? "",
  ];
}

export async function listAcompanhamentoSheet(): Promise<{
  headers: string[];
  rows: AcompanhamentoSheetRow[];
}> {
  await seedImportedAcompanhamentoRows();
  await backfillCadastroAcompanhamentoRows();

  const records = await prisma.acompanhamentoClient.findMany({
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

  const cadastroRows: AcompanhamentoSheetRow[] = [];
  const importedRows: AcompanhamentoSheetRow[] = [];

  for (const record of records) {
    if (record.source === "imported" || !record.user) {
      importedRows.push({
        id: record.id,
        userId: record.userId,
        profileId: null,
        category: null,
        formStep: 0,
        cells: record.cells.length ? record.cells : ACOMPANHAMENTO_HEADERS.map(() => ""),
      });
      continue;
    }

    const profile = pickProfile(record.user.profiles);
    cadastroRows.push({
      id: record.id,
      userId: record.userId,
      profileId: profile?.id ?? null,
      category: profile?.category ?? null,
      formStep: profile?.formStep ?? 0,
      cells: buildCellsFromUser(
        {
          ...record.user,
          payerEmail: record.user.payerUserId
            ? payerEmailById.get(record.user.payerUserId)
            : undefined,
        },
        record,
      ),
    });
  }

  importedRows.reverse();

  return {
    headers: [...ACOMPANHAMENTO_HEADERS],
    rows: [...cadastroRows, ...importedRows],
  };
}
