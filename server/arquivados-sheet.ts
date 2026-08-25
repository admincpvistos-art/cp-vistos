import payload from "@/data/arquivados-sheets.json";
import type { SheetClientRow } from "@/components/dashboard/sheet-clients-table";
import type { AcompanhamentoService } from "@/lib/acompanhamento-types";
import { isAcompanhamentoService } from "@/lib/acompanhamento-types";
import type { ArquivadosSheetCategory } from "@/lib/arquivados-categories";
import prisma from "@/lib/prisma";

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
  const excelRows = listExcelArquivadosSheet(category);

  const dbRows = await prisma.arquivadoClient.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
  });

  const appRows = dbRows.map(mapDbArquivado);
  return [...appRows, ...excelRows];
}
