/**
 * Padroniza textos de cadastro/planilha em CAIXA ALTA (pt-BR).
 * Não use em e-mail, senha, URLs ou tokens.
 */
export function toUpperDisplay(value: string | null | undefined): string {
  if (value == null) {
    return "";
  }
  return String(value).trim().toLocaleUpperCase("pt-BR");
}

/** Aplica CAIXA ALTA só se houver conteúdo após trim. */
export function toUpperDisplayOrEmpty(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed.toLocaleUpperCase("pt-BR") : "";
}
