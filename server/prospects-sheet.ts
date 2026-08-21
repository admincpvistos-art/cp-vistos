import payload from "@/data/prospects-sheet.json";
import type { SheetClientRow } from "@/components/dashboard/sheet-clients-table";
import type { AcompanhamentoService } from "@/lib/acompanhamento-types";

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

function makeId(index: number, name: string, barcode: string) {
  const key = `prospect:${index}:${name}:${barcode}`
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, "-")
    .slice(0, 120);
  return key || `prospect-${index}`;
}

export function listProspectsSheet(): SheetClientRow[] {
  const sheet = payload as SheetPayload;
  if (!sheet?.rows?.length) {
    return [];
  }

  const { headers, rows } = sheet;

  return rows.map((row, index) => {
    const name = cellByHeaders(headers, row, ["NOME", "NOME COMPLETO"]) || row[0] || "";
    const barcode = cellByHeaders(headers, row, ["BARCODE"]);
    const dob = cellByHeaders(headers, row, ["DOB"]);
    const passport = cellByHeaders(headers, row, ["PPT", "PASSAPORTE"]);
    const email = cellByHeaders(headers, row, ["E-MAIL", "EMAIL"]);
    const entryDate = cellByHeaders(headers, row, ["DT. ENTRADA", "DT. ENT.", "ENTRADA"]);
    const observacao = cellByHeaders(headers, row, ["OBSERVACAO", "OBSERVAÇÃO", "OBSERVACOES"]);
    const group = cellByHeaders(headers, row, ["OBS", "GRUPO"]);
    const account = cellByHeaders(headers, row, ["CONTA DE AGENDAMENTO", "CONTA"]);

    return {
      id: makeId(index, name, barcode),
      name,
      services: ["primeiro_visto"] as AcompanhamentoService[],
      sheetComment: [observacao, account ? `Conta: ${account}` : ""].filter(Boolean).join("\n"),
      barcode,
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
      status: "PROSPECT",
    };
  });
}
