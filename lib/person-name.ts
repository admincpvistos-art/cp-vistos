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

/** Divide nome completo legado em nome + sobrenome (primeiro token / restante). */
export function splitPersonName(complete?: string | null): {
  firstName: string;
  lastName: string;
} {
  const text = complete?.trim() ?? "";
  if (!text) return { firstName: "", lastName: "" };
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function joinPersonName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

export type TravelCompanionInput = {
  firstName?: string;
  lastName?: string;
  /** Nome completo legado */
  name?: string;
  relation: string;
};

/** Normaliza acompanhante: aceita legado `name` ou `firstName`/`lastName`. */
export function normalizeTravelCompanion(item: TravelCompanionInput): {
  firstName: string;
  lastName: string;
  name: string;
  relation: string;
} {
  const firstName = item.firstName?.trim() ?? "";
  const lastName = item.lastName?.trim() ?? "";
  if (firstName || lastName) {
    return {
      firstName,
      lastName,
      name: joinPersonName(firstName, lastName),
      relation: item.relation ?? "",
    };
  }
  const split = splitPersonName(item.name);
  return {
    firstName: split.firstName,
    lastName: split.lastName,
    name: item.name?.trim() || joinPersonName(split.firstName, split.lastName),
    relation: item.relation ?? "",
  };
}
