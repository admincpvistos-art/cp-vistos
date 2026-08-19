import { addDays, differenceInDays, format, isValid, parse } from "date-fns";

export const BARCODE_VALIDITY_DAYS = 30;
export const BARCODE_WARNING_DAYS = 15;

export function expireDateFromIssued(issued: Date) {
  return addDays(issued, BARCODE_VALIDITY_DAYS);
}

export function expireDateStringFromIssued(issuedStr: string) {
  if (issuedStr.length !== 10) {
    return null;
  }

  const issued = parse(issuedStr, "dd/MM/yyyy", new Date());
  if (!isValid(issued)) {
    return null;
  }

  return format(expireDateFromIssued(issued), "dd/MM/yyyy");
}

export function barcodeDaysRemaining(expireAt: Date) {
  return differenceInDays(expireAt, new Date());
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
