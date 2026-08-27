export const ACOMPANHAMENTO_SERVICE_OPTIONS = [
  { value: "primeiro_visto", label: "1º visto" },
  { value: "renovacao", label: "Renovação" },
  { value: "passaporte", label: "Passaporte" },
  { value: "esta", label: "ESTA/eTA" },
] as const;

export type AcompanhamentoService = (typeof ACOMPANHAMENTO_SERVICE_OPTIONS)[number]["value"];

export const ACOMPANHAMENTO_SERVICE_LABEL: Record<AcompanhamentoService, string> = {
  primeiro_visto: "1º visto",
  renovacao: "Renovação",
  passaporte: "Passaporte",
  esta: "ESTA/eTA",
};

export type AcompanhamentoAccountFields = {
  cpf: string;
  address: string;
  cel: string;
  email: string;
  password: string;
  passwordConfirm: string;
  emailScheduleAccount: string;
  passwordScheduleAccount: string;
  passwordConfirmScheduleAccount: string;
  budget: string;
  budgetPaid: "" | "Pago" | "Pendente";
  scheduleAccount: "" | "Ativado" | "Inativo";
};

export type AcompanhamentoRecord = {
  id: string;
  userId: string | null;
  profileId: string | null;
  formStep: number;
  name: string;
  barcode: string;
  barcodeIssued: string;
  barcodeExpire: string;
  barcodeDone: boolean;
  casv: string;
  interview: string;
  meeting: string;
  shipping: string;
  tipo: string;
  resp: string;
  tax: string;
  ds160: string;
  alimto: string;
  obs: string;
  dob: string;
  passport: string;
  account: string;
  email: string;
  phone: string;
  entryDate: string;
  group: string;
  pagto: string;
  status: string;
  sheetComment: string;
  services: AcompanhamentoService[];
  /** Timestamp ms do cadastro (usuário / linha) — ordenação “mais recentes”. */
  registeredAt: number;
  /** Quem criou o cadastro (e-mail da equipe, "self", "system" ou vazio). Imutável na UI. */
  createdByEmail: string | null;
  accountFields: AcompanhamentoAccountFields | null;
};

export function emptyAccountFields(
  partial?: Partial<AcompanhamentoAccountFields>,
): AcompanhamentoAccountFields {
  return {
    cpf: "",
    address: "",
    cel: "",
    email: "",
    password: "",
    passwordConfirm: "",
    emailScheduleAccount: "",
    passwordScheduleAccount: "",
    passwordConfirmScheduleAccount: "",
    budget: "",
    budgetPaid: "",
    scheduleAccount: "",
    ...partial,
  };
}

export function isAcompanhamentoService(value: string): value is AcompanhamentoService {
  return ACOMPANHAMENTO_SERVICE_OPTIONS.some((option) => option.value === value);
}
