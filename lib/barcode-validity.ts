import { addDays, differenceInDays, format, isValid, parse, startOfDay } from "date-fns";

export const BARCODE_VALIDITY_DAYS = 30;
export const BARCODE_WARNING_DAYS = 15;

export function expireDateFromIssued(issued: Date) {
  return addDays(issued, BARCODE_VALIDITY_DAYS);
}

export function parseIssuedDate(issuedStr: string) {
  const value = issuedStr.trim();
  if (value.length < 8 || value.includes("--")) {
    return null;
  }

  const parsed = parse(value, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

export function expireDateStringFromIssued(issuedStr: string) {
  const issued = parseIssuedDate(issuedStr);
  if (!issued) {
    return null;
  }

  return format(expireDateFromIssued(issued), "dd/MM/yyyy");
}

export function barcodeDaysRemaining(expireAt: Date) {
  return differenceInDays(startOfDay(expireAt), startOfDay(new Date()));
}

export function barcodeValidityStatus(expireAt: Date | null | undefined) {
  if (!expireAt) {
    return "none" as const;
  }

  const remaining = barcodeDaysRemaining(expireAt);
  if (remaining < 0) {
    return "expired" as const;
  }
  if (remaining <= BARCODE_WARNING_DAYS) {
    return "warning" as const;
  }
  return "ok" as const;
}
