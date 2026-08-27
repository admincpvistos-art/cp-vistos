import payload from "@/data/arquivados-sheets.json";
import type { SheetClientRow } from "@/components/dashboard/sheet-clients-table";
import type { AcompanhamentoService } from "@/lib/acompanhamento-types";
import { isAcompanhamentoService } from "@/lib/acompanhamento-types";
import type { ArquivadosSheetCategory } from "@/lib/arquivados-categories";
import prisma from "@/lib/prisma";
import {
  ACOMPANHAMENTO_HEADERS,
  ACOMPANHAMENTO_ACTIVE_SOURCE,
  archiveNameGroupKey,
  uppercaseExistingClientRecords,
} from "@/server/acompanhamento-sheet";

export type { ArquivadosSheetCategory } from "@/lib/arquivados-categories";

type SheetPayload = {
  sheet: string;
  headers: string[];
  rows: string[][];
};

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cellByHeaders(headers: string[], row: string[], candidates: string[]) {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const target = normalizeHeader(candidate);
    const index = normalizedHeaders.findIndex((header) => header === target);
    if (index >= 0) {
      return (row[index] ?? "").trim();
    }
  }
  return "";
}

function makeId(category: string, index: number, name: string, barcode: string) {
  const key = `${category}:${index}:${name}:${barcode}`
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, "-")
    .slice(0, 120);
  return key || `${category}-${index}`;
}

function mapVisaLike(
  category: ArquivadosSheetCategory,
  headers: string[],
  row: string[],
  index: number,
  service: AcompanhamentoService,
): SheetClientRow {
  const name =
    cellByHeaders(headers, row, ["NOME", "NOME COMPLETO"]) || row[0] || "";
  const barcode = cellByHeaders(headers, row, ["BARCODE"]);
  const casv = cellByHeaders(headers, row, ["DT. CASV", "CASV", "DATA CASV"]);
  const interview = cellByHeaders(headers, row, ["DT. ENTREV", "DT. ENTREV.", "ENTREVISTA"]);
  const shipping = cellByHeaders(headers, row, ["ENVIO"]);
  const obs = cellByHeaders(headers, row, ["OBS", "OBSERVACOES", "OBSERVAÇÕES"]);
  const dob = cellByHeaders(headers, row, ["DOB"]);
  const passport = cellByHeaders(headers, row, ["PPT", "PASSAPORTE"]);
  const email = cellByHeaders(headers, row, ["E-MAIL", "EMAIL"]);
  const entryDate = cellByHeaders(headers, row, ["DT. ENT.", "DT. ENTRADA", "ENTRADA"]);
  const group = cellByHeaders(headers, row, ["GRUPO"]);
  const status = cellByHeaders(headers, row, ["APROVACAO", "APROVAÇÃO", "STATUS"]);
  const tax = cellByHeaders(headers, row, ["PGTO TAXA", "PAGTO", "TAX"]);

  return {
    id: makeId(category, index, name, barcode),
    name,
    services: [service],
    sheetComment: obs,
    barcode,
    barcodeIssued: "",
    barcodeDone: false,
    casv,
    interview,
    meeting: shipping,
    tax,
    dob,
    passport,
    email,
    entryDate,
    group,
    status,
  };
}

function mapPassport(
  headers: string[],
  row: string[],
  index: number,
): SheetClientRow {
  const name = cellByHeaders(headers, row, ["NOME COMPLETO", "NOME"]) || row[0] || "";
  const dob = cellByHeaders(headers, row, ["DOB"]);
  const email = cellByHeaders(headers, row, ["E-MAIL", "EMAIL"]);
  const status = cellByHeaders(headers, row, ["STATUS"]);
  const entryDate = cellByHeaders(headers, row, ["ENTRADA"]);
  const protocol = cellByHeaders(headers, row, ["PROTOCOLO"]);
  const obs = cellByHeaders(headers, row, ["OBSERVACOES", "OBSERVAÇÕES", "OBS"]);
  const pagto = cellByHeaders(headers, row, ["PAGTO"]);

  return {
    id: makeId("passport", index, name, protocol),
    name,
    services: ["passaporte"],
    sheetComment: obs,
    barcode: protocol,
    barcodeIssued: "",
    barcodeDone: false,
    casv: "",
    interview: cellByHeaders(headers, row, ["AGENDAMENTO"]),
    meeting: cellByHeaders(headers, row, ["ENVIO E-MAIL"]),
    tax: pagto,
    dob,
    passport: "",
    email,
    entryDate,
    group: "",
    status,
  };
}

function mapEsta(
  headers: string[],
  row: string[],
  index: number,
): SheetClientRow {
  const name = cellByHeaders(headers, row, ["NOME"]) || row[0] || "";
  const process = cellByHeaders(headers, row, ["PROCESSO"]);
  const group = cellByHeaders(headers, row, ["GRUPO"]);
  const passport = cellByHeaders(headers, row, ["PPT", "PASSAPORTE"]);
  const dob = cellByHeaders(headers, row, ["DOB"]);
  const status = cellByHeaders(headers, row, ["STATUS"]);
  const email = cellByHeaders(headers, row, ["E-MAIL", "EMAIL"]);
  const entryDate = cellByHeaders(headers, row, ["DT. INICIO", "DT. INÍCIO"]);
  const solicitation = cellByHeaders(headers, row, ["SOLICITACAO", "SOLICITAÇÃO"]);

  return {
    id: makeId("e_ta", index, name, process || passport),
    name,
    services: ["esta"],
    sheetComment: solicitation,
    barcode: process,
    barcodeIssued: "",
    barcodeDone: false,
    casv: "",
    interview: "",
    meeting: "",
    tax: "",
    dob,
    passport,
    email,
    entryDate,
    group,
    status,
  };
}

function listExcelArquivadosSheet(category: ArquivadosSheetCategory): SheetClientRow[] {
  const sheet = (payload as Record<string, SheetPayload>)[category];
  if (!sheet?.rows?.length) {
    return [];
  }

  const { headers, rows } = sheet;

  return rows.map((row, index) => {
    switch (category) {
      case "american_visa":
        return mapVisaLike(category, headers, row, index, "primeiro_visto");
      case "renovacao":
        return mapVisaLike(category, headers, row, index, "renovacao");
      case "passport":
        return mapPassport(headers, row, index);
      case "e_ta":
        return mapEsta(headers, row, index);
      default:
        return mapVisaLike("american_visa", headers, row, index, "primeiro_visto");
    }
  });
}

function mapDbArquivado(row: {
  id: string;
  name: string;
  barcode: string;
  barcodeIssued: string;
  barcodeDone: boolean;
  casv: string;
  interview: string;
  meeting: string;
  tax: string;
  dob: string;
  passport: string;
  email: string;
  entryDate: string;
  group: string;
  status: string;
  sheetComment: string;
  services: string[];
  createdAt?: Date;
}): SheetClientRow {
  const services = row.services.filter(isAcompanhamentoService);
  return {
    id: `db:${row.id}`,
    name: row.name,
    services,
    sheetComment: row.sheetComment,
    barcode: row.barcode,
    barcodeIssued: row.barcodeIssued,
    barcodeDone: row.barcodeDone,
    casv: row.casv,
    interview: row.interview,
    meeting: row.meeting,
    tax: row.tax,
    dob: row.dob,
    passport: row.passport,
    email: row.email,
    entryDate: row.entryDate,
    group: row.group,
    status: row.status,
    registeredAt: row.createdAt?.getTime() ?? 0,
  };
}

export async function listArquivadosSheet(
  category: ArquivadosSheetCategory,
): Promise<SheetClientRow[]> {
  await uppercaseExistingClientRecords(100);
  const excelRows = listExcelArquivadosSheet(category);

  const dbRows = await prisma.arquivadoClient.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
  });

  const appRows = dbRows.map(mapDbArquivado);
  return [...appRows, ...excelRows];
}

function parseArquivadoDbId(rowId: string) {
  if (rowId.startsWith("db:")) {
    return rowId.slice(3);
  }
  return null;
}

/**
 * Desarquiva: remove snapshots de Arquivados (todas as abas do cliente)
 * e recria a linha no Acompanhamento como ATIVO.
 */
export async function unarchiveArquivadoClient(rowId: string) {
  const dbId = parseArquivadoDbId(rowId);
  if (!dbId) {
    throw new Error(
      "Este registro veio da planilha legada e não pode ser desarquivado por aqui.",
    );
  }

  const snapshot = await prisma.arquivadoClient.findUnique({
    where: { id: dbId },
  });
  if (!snapshot) {
    throw new Error("Cliente arquivado não encontrado");
  }

  const nameGroupKey = archiveNameGroupKey(snapshot.name, snapshot.group);
  const related = await prisma.arquivadoClient.findMany({
    where: {
      OR: [
        ...(snapshot.sourceUserId
          ? [{ sourceUserId: snapshot.sourceUserId }]
          : []),
        ...(snapshot.sourceAcompanhamentoId
          ? [{ sourceAcompanhamentoId: snapshot.sourceAcompanhamentoId }]
          : []),
        {
          name: snapshot.name,
          group: snapshot.group,
        },
      ],
    },
  });

  const services = Array.from(
    new Set(
      related
        .flatMap((row) => row.services)
        .filter(isAcompanhamentoService),
    ),
  );
  if (!services.length && snapshot.services.length) {
    services.push(
      ...snapshot.services.filter(isAcompanhamentoService),
    );
  }
  if (!services.length) {
    // Fallback: categoria da aba atual → serviço mínimo para poder arquivar de novo.
    const fromCategory: Partial<Record<string, AcompanhamentoService>> = {
      american_visa: "primeiro_visto",
      renovacao: "renovacao",
      passport: "passaporte",
      e_ta: "esta",
    };
    const fallback = fromCategory[snapshot.category];
    if (fallback) {
      services.push(fallback);
    }
  }

  // Já existe linha ativa no Acompanhamento? Só limpa Arquivados.
  if (snapshot.sourceUserId) {
    const existingActive = await prisma.acompanhamentoClient.findFirst({
      where: {
        userId: snapshot.sourceUserId,
        source: ACOMPANHAMENTO_ACTIVE_SOURCE,
      },
      select: { id: true },
    });
    if (existingActive) {
      await prisma.arquivadoClient.deleteMany({
        where: { id: { in: related.map((row) => row.id) } },
      });
      return {
        acompanhamentoId: existingActive.id,
        services,
        removedArquivadoIds: related.map((row) => row.id),
      };
    }
  }

  if (nameGroupKey) {
    const activeRows = await prisma.acompanhamentoClient.findMany({
      where: { source: ACOMPANHAMENTO_ACTIVE_SOURCE },
      include: { user: { select: { name: true, group: true } } },
      take: 2000,
    });
    const match = activeRows.find((row) => {
      const name = row.user?.name || row.cells[0] || "";
      const group = row.user?.group || row.cells[19] || "";
      return archiveNameGroupKey(name, group) === nameGroupKey;
    });
    if (match) {
      await prisma.arquivadoClient.deleteMany({
        where: { id: { in: related.map((row) => row.id) } },
      });
      return {
        acompanhamentoId: match.id,
        services,
        removedArquivadoIds: related.map((row) => row.id),
      };
    }
  }

  const cells = Array.from({ length: ACOMPANHAMENTO_HEADERS.length }, () => "");
  cells[0] = snapshot.name;
  cells[1] = snapshot.barcode;
  cells[2] = snapshot.barcodeIssued;
  cells[3] = snapshot.casv;
  cells[4] = snapshot.interview;
  cells[5] = snapshot.meeting;
  cells[9] = snapshot.tax;
  cells[13] = snapshot.dob;
  cells[14] = snapshot.passport;
  cells[16] = snapshot.email;
  cells[18] = snapshot.entryDate;
  cells[19] = snapshot.group;
  cells[21] = "ATIVO";

  // userId é @unique — só vincula se não houver outra linha (ativa ou arquivada soft).
  let userId: string | null = snapshot.sourceUserId;
  let createdByEmail: string | null = null;
  if (userId) {
    const taken = await prisma.acompanhamentoClient.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (taken) {
      userId = null;
    } else {
      const linkedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdByEmail: true },
      });
      createdByEmail = linkedUser?.createdByEmail ?? null;
    }
  }

  const created = await prisma.acompanhamentoClient.create({
    data: {
      source: ACOMPANHAMENTO_ACTIVE_SOURCE,
      cells,
      statusLabel: "ATIVO",
      extraDate: snapshot.barcodeDone ? "done" : null,
      sheetComment: snapshot.sheetComment || null,
      services,
      createdByEmail,
      ...(userId ? { userId } : {}),
    },
  });

  await prisma.arquivadoClient.deleteMany({
    where: { id: { in: related.map((row) => row.id) } },
  });

  return {
    acompanhamentoId: created.id,
    services,
    removedArquivadoIds: related.map((row) => row.id),
  };
}
