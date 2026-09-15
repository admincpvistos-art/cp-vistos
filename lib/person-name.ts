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

/**
 * Conta vs formulário DS-160: o nome legal no formulário pode ter mais (ou
 * menos) partes que o nome cadastrado. Aceita se um conjunto de tokens
 * contém o outro após normalização.
 */
export function namesCompatible(formFullName: string, accountName: string) {
  if (namesMatch(formFullName, accountName)) {
    return true;
  }

  const formTokens = normalizePersonName(formFullName).split(" ").filter(Boolean);
  const accountTokens = normalizePersonName(accountName).split(" ").filter(Boolean);

  if (formTokens.length === 0 || accountTokens.length === 0) {
    return true;
  }

  const formSet = new Set(formTokens);
  const accountSet = new Set(accountTokens);

  const accountInForm = accountTokens.every((token) => formSet.has(token));
  const formInAccount = formTokens.every((token) => accountSet.has(token));

  return accountInForm || formInAccount;
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
