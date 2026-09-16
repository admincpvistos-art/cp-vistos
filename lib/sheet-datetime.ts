import { format, isValid, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

/** Extrai data e hora de strings da planilha (legado: só data). */
export function splitSheetDateTime(value: string): { date: string; time: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { date: "", time: "" };
  }

  const match = trimmed.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})(?:\s*[-–]?\s*(\d{1,2}:\d{2})(?::\d{2})?)?/,
  );
  if (!match) {
    return { date: trimmed, time: "" };
  }

  const time = (match[2] ?? "").trim();
  return {
    date: match[1],
    time: time.length >= 5 ? time.slice(0, 5) : time,
  };
}

export function combineSheetDateTime(date: string, time: string): string {
  const d = date.trim();
  const t = time.trim().slice(0, 5);
  if (!d) {
    return "";
  }
  return t ? `${d} ${t}` : d;
}

/** Formata Date + HH:mm opcional para exibição na planilha. */
export function formatSheetDateTime(
  value: Date | null | undefined,
  time?: string | null,
): string {
  if (!value) {
    return "";
  }

  const datePart = format(value, "dd/MM/yyyy");
  const timePart = (time ?? "").trim().slice(0, 5);
  return timePart ? `${datePart} ${timePart}` : datePart;
}

/** Parse da parte de data (ignora hora). Compatível com dd/MM/yyyy e dd/MM/yyyy HH:mm. */
export function parseSheetDateOnly(value: string): Date | null {
  const { date } = splitSheetDateTime(value);
  if (!date || date.length < 8) {
    return null;
  }

  const parsed = parse(date, "dd/MM/yyyy", new Date());
  if (!isValid(parsed)) {
    return null;
  }

  return fromZonedTime(parsed, "America/Sao_Paulo");
}

export function timeFromSheetValue(value: string): string {
  return splitSheetDateTime(value).time;
}

/** Compara só o dia (ignora hora) entre valor da planilha e uma data. */
export function sheetValueMatchesDate(value: string, day: Date): boolean {
  const { date } = splitSheetDateTime(value);
  if (!date) {
    return false;
  }

  const parsed = parse(date, "dd/MM/yyyy", new Date());
  if (!isValid(parsed)) {
    return false;
  }

  return format(parsed, "dd/MM/yyyy") === format(day, "dd/MM/yyyy");
}

/** Linha tem CASV, entrevista ou reunião no dia informado. */
export function rowHasScheduleOnDate(
  row: { casv?: string; interview?: string; meeting?: string },
  day: Date,
): boolean {
  return (
    sheetValueMatchesDate(row.casv ?? "", day) ||
    sheetValueMatchesDate(row.interview ?? "", day) ||
    sheetValueMatchesDate(row.meeting ?? "", day)
  );
}
