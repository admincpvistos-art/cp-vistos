export function normalizePersonName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function namesMatch(left: string, right: string) {
  return normalizePersonName(left) === normalizePersonName(right);
}

export function cpfDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function cpfsMatch(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  const a = cpfDigits(left);
  const b = cpfDigits(right);
  return !a || !b || a === b;
}
