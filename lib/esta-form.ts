import { z } from "zod";

export const ESTA_STEPS = [
  { step: 0, label: "Requerente" },
  { step: 1, label: "Nacionalidades" },
  { step: 2, label: "Contato" },
  { step: 3, label: "Família e trabalho" },
  { step: 4, label: "Viagem e EUA" },
  { step: 5, label: "Emergência" },
] as const;

export const ESTA_MAX_STEP = 5;

const yesNo = z.enum(["Sim", "Não"]);

const addressFields = {
  address: z.string(),
  addressNumber: z.string(),
  complement: z.string(),
  district: z.string(),
  city: z.string(),
  state: z.string(),
  cep: z.string(),
  country: z.string(),
};

export const estaStep0Schema = z.object({
  firstName: z.string().min(1, "Campo obrigatório"),
  lastName: z.string().min(1, "Campo obrigatório"),
  passportNumber: z.string().min(1, "Campo obrigatório"),
  passportIssuingCountry: z.string().min(1, "Campo obrigatório"),
  passportIssueDate: z.string().min(1, "Campo obrigatório"),
  passportExpireDate: z.string().min(1, "Campo obrigatório"),
  citizenshipCountry: z.string().min(1, "Campo obrigatório"),
  nationalIdNumber: z.string().min(1, "Campo obrigatório"),
  sex: z.string().min(1, "Selecione uma opção"),
  birthDate: z.string().min(1, "Campo obrigatório"),
});

export const estaStep1Schema = z
  .object({
    otherCitizenshipNowConfirmation: yesNo,
    otherCitizenshipNowCountry: z.string(),
    otherCitizenshipPastConfirmation: yesNo,
    otherCitizenshipPastCountry: z.string(),
    otherNameUsedConfirmation: yesNo,
    otherName: z.string(),
    otherTravelDocConfirmation: yesNo,
    otherTravelDocCountry: z.string(),
    otherTravelDocType: z.string(),
    otherTravelDocNumber: z.string(),
    otherTravelDocExpireYear: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.otherCitizenshipNowConfirmation === "Sim" && !values.otherCitizenshipNowCountry.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a nacionalidade", path: ["otherCitizenshipNowCountry"] });
    }
    if (values.otherCitizenshipPastConfirmation === "Sim" && !values.otherCitizenshipPastCountry.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a nacionalidade", path: ["otherCitizenshipPastCountry"] });
    }
    if (values.otherNameUsedConfirmation === "Sim" && !values.otherName.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Campo obrigatório", path: ["otherName"] });
    }
    if (values.otherTravelDocConfirmation === "Sim") {
      if (!values.otherTravelDocCountry.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Campo obrigatório", path: ["otherTravelDocCountry"] });
      }
      if (!values.otherTravelDocType.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Campo obrigatório", path: ["otherTravelDocType"] });
      }
      if (!values.otherTravelDocNumber.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Campo obrigatório", path: ["otherTravelDocNumber"] });
      }
      if (!values.otherTravelDocExpireYear.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Campo obrigatório", path: ["otherTravelDocExpireYear"] });
      }
    }
  });

export const estaStep2Schema = z.object({
  ...addressFields,
  address: z.string().min(1, "Campo obrigatório"),
  addressNumber: z.string().min(1, "Campo obrigatório"),
  district: z.string().min(1, "Campo obrigatório"),
  city: z.string().min(1, "Campo obrigatório"),
  state: z.string().min(1, "Campo obrigatório"),
  cep: z.string().min(1, "Campo obrigatório"),
  country: z.string().min(1, "Campo obrigatório"),
  phone: z.string().min(1, "Campo obrigatório"),
  email: z.string().min(1, "Campo obrigatório").email("E-mail inválido"),
  instagram: z.string(),
  facebook: z.string(),
  linkedin: z.string(),
  otherSocial: z.string(),
});

export const estaStep3Schema = z
  .object({
    globalEntryMemberConfirmation: yesNo,
    fatherFullName: z.string().min(1, "Campo obrigatório"),
    motherFullName: z.string().min(1, "Campo obrigatório"),
    jobTitle: z.string().min(1, "Campo obrigatório"),
    employerName: z.string().min(1, "Campo obrigatório"),
    employerAddress: z.string().min(1, "Campo obrigatório"),
    employerAddressNumber: z.string().min(1, "Campo obrigatório"),
    employerDistrict: z.string().min(1, "Campo obrigatório"),
    employerCity: z.string().min(1, "Campo obrigatório"),
    employerState: z.string().min(1, "Campo obrigatório"),
    employerCep: z.string().min(1, "Campo obrigatório"),
    employerCountry: z.string().min(1, "Campo obrigatório"),
    employerPhone: z.string(),
  });

export const estaStep4Schema = z
  .object({
    transitToOtherCountryConfirmation: yesNo,
    usContactName: z.string(),
    usContactAddress: z.string(),
    usContactAddressNumber: z.string(),
    usContactComplement: z.string(),
    usContactDistrict: z.string(),
    usContactCity: z.string(),
    usContactState: z.string(),
    usContactCep: z.string(),
    usContactCountry: z.string(),
    usContactPhone: z.string(),
    usAddressSameAsContactConfirmation: yesNo.optional(),
    usStayAddress: z.string(),
    usStayAddressNumber: z.string(),
    usStayComplement: z.string(),
    usStayDistrict: z.string(),
    usStayCity: z.string(),
    usStayState: z.string(),
    usStayCep: z.string(),
    usStayCountry: z.string(),
  })
  .superRefine((values, ctx) => {
    const hasUsContact = Boolean(values.usContactName.trim());
    if (hasUsContact) {
      const required: (keyof typeof values)[] = [
        "usContactAddress",
        "usContactAddressNumber",
        "usContactDistrict",
        "usContactCity",
        "usContactState",
        "usContactCountry",
      ];
      for (const key of required) {
        if (!String(values[key] ?? "").trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Campo obrigatório", path: [key] });
        }
      }
    }
    if (values.usAddressSameAsContactConfirmation === "Não") {
      const required: (keyof typeof values)[] = [
        "usStayAddress",
        "usStayAddressNumber",
        "usStayDistrict",
        "usStayCity",
        "usStayState",
        "usStayCountry",
      ];
      for (const key of required) {
        if (!String(values[key] ?? "").trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Campo obrigatório", path: [key] });
        }
      }
    }
  });

export const estaStep5Schema = z.object({
  emergencyName: z.string().min(1, "Campo obrigatório"),
  emergencyEmail: z.string().min(1, "Campo obrigatório").email("E-mail inválido"),
  emergencyPhone: z.string().min(1, "Campo obrigatório"),
  truthfulnessConfirmation: z.literal(true, {
    errorMap: () => ({ message: "Confirme que as informações são verdadeiras" }),
  }),
});

export type EstaStep0Values = z.infer<typeof estaStep0Schema>;
export type EstaStep1Values = z.infer<typeof estaStep1Schema>;
export type EstaStep2Values = z.infer<typeof estaStep2Schema>;
export type EstaStep3Values = z.infer<typeof estaStep3Schema>;
export type EstaStep4Values = z.infer<typeof estaStep4Schema>;
export type EstaStep5Values = z.infer<typeof estaStep5Schema>;

export const ESTA_FIELD_HELP = {
  firstName: "Como está no passaporte, sem abreviações.",
  lastName: "Como está no passaporte, sem abreviações.",
  passportNumber: "Número do passaporte estrangeiro utilizado na viagem.",
  passportIssuingCountry: "País que emitiu o passaporte.",
  nationalIdNumber: "No Brasil, informe o CPF.",
  otherCitizenship: "Informe se possui ou já possuiu outra cidadania.",
  otherName: "Nome de solteira, apelido ou nome profissional, se aplicável.",
  otherTravelDoc: "Somente se já recebeu passaporte ou documento de viagem de outro país.",
  address: "Endereço residencial completo, incluindo número e complemento.",
  socialMedia: "Informe as redes que utiliza. Para ESTA, não precisam estar públicas.",
  globalEntry: "Programa CBP Global Entry, NEXUS ou SENTRI nos EUA/Canadá.",
  parents: "Informe o nome completo, mesmo se falecidos.",
  employer: "Dados do emprego atual. Telefone comercial, se houver.",
  transit: "Marque Sim se os EUA forem apenas escala para outro país.",
  usContact: "Opcional. Preencha somente se tiver contato frequente nos EUA.",
  usStay: "Se o endereço nos EUA for diferente do contato, informe aqui.",
  emergency: "Contato de emergência dentro ou fora dos EUA.",
} as const;
