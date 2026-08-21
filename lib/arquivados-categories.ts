import type { AcompanhamentoService } from "@/lib/acompanhamento-types";

export type ArquivadosSheetCategory =
  | "american_visa"
  | "renovacao"
  | "passport"
  | "e_ta";

/** Serviços do Acompanhamento → aba de Arquivados. */
export const SERVICE_TO_ARQUIVADOS_CATEGORY: Record<
  AcompanhamentoService,
  ArquivadosSheetCategory
> = {
  primeiro_visto: "american_visa",
  renovacao: "renovacao",
  passaporte: "passport",
  esta: "e_ta",
};

export const ARQUIVADOS_CATEGORY_LABEL: Record<ArquivadosSheetCategory, string> = {
  american_visa: "Visto Americano",
  renovacao: "Renovação",
  passport: "Passaporte",
  e_ta: "ESTA/E-TA",
};
