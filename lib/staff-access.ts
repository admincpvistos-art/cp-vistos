export const FINANCE_ADMIN_EMAILS = [
  "cpassessoriavistos@gmail.com",
  "admin@cpvistos.com",
] as const;

export const OFFICE_COLLABORATOR_EMAILS = [
  "cpassessoriavistos1@gmail.com",
  "cpassessoriavistos2@gmail.com",
  "cpassessoriavistos3@gmail.com",
] as const;

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export function isFinanceAdminEmail(email?: string | null) {
  return (FINANCE_ADMIN_EMAILS as readonly string[]).includes(
    normalizeEmail(email),
  );
}

export function isOfficeCollaboratorEmail(email?: string | null) {
  return (OFFICE_COLLABORATOR_EMAILS as readonly string[]).includes(
    normalizeEmail(email),
  );
}

export function isFullAdmin(role?: string | null, email?: string | null) {
  return role === "ADMIN" && !isOfficeCollaboratorEmail(email);
}

/** Full admin ou as 3 contas de colaborador do escritório. */
export function canAccessAcompanhamento(
  role?: string | null,
  email?: string | null,
) {
  return isFullAdmin(role, email) || isOfficeCollaboratorEmail(email);
}

/** Somente full admin — colaboradores do escritório só editam. */
export function canArchiveAcompanhamento(
  role?: string | null,
  email?: string | null,
) {
  return isFullAdmin(role, email);
}

export function canAccessFinance(role?: string | null, email?: string | null) {
  return isFullAdmin(role, email) && isFinanceAdminEmail(email);
}

export function canAccessDs160(role?: string | null, email?: string | null) {
  return isFullAdmin(role, email) || isOfficeCollaboratorEmail(email);
}

export function canCreateClientAccounts(
  role?: string | null,
  email?: string | null,
) {
  if (isOfficeCollaboratorEmail(email)) {
    return false;
  }

  return role === "ADMIN" || role === "COLLABORATOR";
}

export function canAccessDevelopmentTools(
  role?: string | null,
  email?: string | null,
) {
  return isFullAdmin(role, email);
}
