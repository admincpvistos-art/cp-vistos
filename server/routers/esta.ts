import { Category, StatusForm } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { format, isValid, parse } from "date-fns";
import { z } from "zod";

import {
  ESTA_MAX_STEP,
  estaStep0Schema,
  estaStep1Schema,
  estaStep2Schema,
  estaStep3Schema,
  estaStep4Schema,
  estaStep5Schema,
} from "@/lib/esta-form";
import prisma from "@/lib/prisma";
import { collaboratorProcedure, isUserAuthedProcedure, router } from "../trpc";

const ESTA_CATEGORIES: Category[] = [Category.passport, Category.e_ta];

function parseDateInput(value: string | undefined | null) {
  if (!value?.trim()) return null;
  const parsed = parse(value.trim(), "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

function formatDateOutput(value: Date | null | undefined) {
  if (!value) return "";
  return format(value, "dd/MM/yyyy");
}

function boolFromYesNo(value: "Sim" | "Não" | undefined | null) {
  if (value === "Sim") return true;
  if (value === "Não") return false;
  return null;
}

function yesNoFromBool(value: boolean | null | undefined): "Sim" | "Não" | undefined {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  return undefined;
}

function isFormLocked(statusForm: StatusForm, formLocked: boolean | null) {
  return statusForm === StatusForm.filled && formLocked !== false;
}

async function assertEstaProfile(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { estaForm: true },
  });

  if (!profile || !ESTA_CATEGORIES.includes(profile.category)) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Formulário ESTA não encontrado",
    });
  }

  return profile;
}

async function assertClientCanEditEsta(profileId: string, userEmail: string) {
  const profile = await assertEstaProfile(profileId);

  if (isFormLocked(profile.statusForm, profile.formLocked)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Formulário enviado e bloqueado. Aguarde o desbloqueio do administrador.",
    });
  }

  const user = await prisma.user.findFirst({
    where: { email: userEmail },
    select: { id: true, group: true, payerUserId: true },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não encontrado" });
  }

  const owner = await prisma.user.findUnique({
    where: { id: profile.userId },
    select: { id: true, group: true, payerUserId: true, email: true },
  });

  if (!owner) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
  }

  const sameAccount =
    owner.id === user.id ||
    (user.group && owner.group === user.group) ||
    owner.payerUserId === user.id ||
    user.payerUserId === owner.id;

  if (!sameAccount) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para este formulário" });
  }

  return profile;
}

async function ensureEstaForm(profileId: string) {
  const existing = await prisma.estaForm.findUnique({ where: { profileId } });
  if (existing) return existing;

  return prisma.estaForm.create({
    data: {
      profile: { connect: { id: profileId } },
    },
  });
}

function mapEstaFormToClient(esta: NonNullable<Awaited<ReturnType<typeof ensureEstaForm>>>) {
  return {
    firstName: esta.firstName ?? "",
    lastName: esta.lastName ?? "",
    passportNumber: esta.passportNumber ?? "",
    passportIssuingCountry: esta.passportIssuingCountry ?? "",
    passportIssueDate: formatDateOutput(esta.passportIssueDate),
    passportExpireDate: formatDateOutput(esta.passportExpireDate),
    citizenshipCountry: esta.citizenshipCountry ?? "",
    nationalIdNumber: esta.nationalIdNumber ?? "",
    sex: esta.sex ?? "",
    birthDate: formatDateOutput(esta.birthDate),
    otherCitizenshipNowConfirmation: yesNoFromBool(esta.otherCitizenshipNow) ?? "Não",
    otherCitizenshipNowCountry: esta.otherCitizenshipNowCountry ?? "",
    otherCitizenshipPastConfirmation: yesNoFromBool(esta.otherCitizenshipPast) ?? "Não",
    otherCitizenshipPastCountry: esta.otherCitizenshipPastCountry ?? "",
    otherNameUsedConfirmation: yesNoFromBool(esta.otherNameUsed) ?? "Não",
    otherName: esta.otherName ?? "",
    otherTravelDocConfirmation: yesNoFromBool(esta.otherTravelDoc) ?? "Não",
    otherTravelDocCountry: esta.otherTravelDocCountry ?? "",
    otherTravelDocType: esta.otherTravelDocType ?? "",
    otherTravelDocNumber: esta.otherTravelDocNumber ?? "",
    otherTravelDocExpireYear: esta.otherTravelDocExpireYear ?? "",
    address: esta.address ?? "",
    addressNumber: esta.addressNumber ?? "",
    complement: esta.complement ?? "",
    district: esta.district ?? "",
    city: esta.city ?? "",
    state: esta.state ?? "",
    cep: esta.cep ?? "",
    country: esta.country ?? "",
    phone: esta.phone ?? "",
    email: esta.email ?? "",
    instagram: esta.instagram ?? "",
    facebook: esta.facebook ?? "",
    linkedin: esta.linkedin ?? "",
    otherSocial: esta.otherSocial ?? "",
    globalEntryMemberConfirmation: yesNoFromBool(esta.globalEntryMember) ?? "Não",
    fatherFullName: esta.fatherFullName ?? "",
    motherFullName: esta.motherFullName ?? "",
    jobTitle: esta.jobTitle ?? "",
    employerName: esta.employerName ?? "",
    employerAddress: esta.employerAddress ?? "",
    employerAddressNumber: esta.employerAddressNumber ?? "",
    employerComplement: esta.employerComplement ?? "",
    employerDistrict: esta.employerDistrict ?? "",
    employerCity: esta.employerCity ?? "",
    employerState: esta.employerState ?? "",
    employerCep: esta.employerCep ?? "",
    employerCountry: esta.employerCountry ?? "",
    employerPhone: esta.employerPhone ?? "",
    transitToOtherCountryConfirmation: yesNoFromBool(esta.transitToOtherCountry) ?? "Não",
    usContactName: esta.usContactName ?? "",
    usContactAddress: esta.usContactAddress ?? "",
    usContactAddressNumber: esta.usContactAddressNumber ?? "",
    usContactComplement: esta.usContactComplement ?? "",
    usContactDistrict: esta.usContactDistrict ?? "",
    usContactCity: esta.usContactCity ?? "",
    usContactState: esta.usContactState ?? "",
    usContactCep: esta.usContactCep ?? "",
    usContactCountry: esta.usContactCountry ?? "",
    usContactPhone: esta.usContactPhone ?? "",
    usAddressSameAsContactConfirmation: yesNoFromBool(esta.usAddressSameAsContact) ?? "Sim",
    usStayAddress: esta.usStayAddress ?? "",
    usStayAddressNumber: esta.usStayAddressNumber ?? "",
    usStayComplement: esta.usStayComplement ?? "",
    usStayDistrict: esta.usStayDistrict ?? "",
    usStayCity: esta.usStayCity ?? "",
    usStayState: esta.usStayState ?? "",
    usStayCep: esta.usStayCep ?? "",
    usStayCountry: esta.usStayCountry ?? "",
    emergencyName: esta.emergencyName ?? "",
    emergencyEmail: esta.emergencyEmail ?? "",
    emergencyPhone: esta.emergencyPhone ?? "",
  };
}

const stepPayload = z.discriminatedUnion("step", [
  z.object({ profileId: z.string().min(1), step: z.literal(0), data: estaStep0Schema }),
  z.object({ profileId: z.string().min(1), step: z.literal(1), data: estaStep1Schema }),
  z.object({ profileId: z.string().min(1), step: z.literal(2), data: estaStep2Schema }),
  z.object({ profileId: z.string().min(1), step: z.literal(3), data: estaStep3Schema }),
  z.object({ profileId: z.string().min(1), step: z.literal(4), data: estaStep4Schema }),
  z.object({ profileId: z.string().min(1), step: z.literal(5), data: estaStep5Schema }),
]);

function stepToDb(step: number, data: Record<string, unknown>) {
  switch (step) {
    case 0:
      return {
        firstName: data.firstName as string,
        lastName: data.lastName as string,
        passportNumber: data.passportNumber as string,
        passportIssuingCountry: data.passportIssuingCountry as string,
        passportIssueDate: parseDateInput(data.passportIssueDate as string),
        passportExpireDate: parseDateInput(data.passportExpireDate as string),
        citizenshipCountry: data.citizenshipCountry as string,
        nationalIdNumber: data.nationalIdNumber as string,
        sex: data.sex as string,
        birthDate: parseDateInput(data.birthDate as string),
      };
    case 1:
      return {
        otherCitizenshipNow: boolFromYesNo(data.otherCitizenshipNowConfirmation as "Sim" | "Não"),
        otherCitizenshipNowCountry: (data.otherCitizenshipNowCountry as string) || null,
        otherCitizenshipPast: boolFromYesNo(data.otherCitizenshipPastConfirmation as "Sim" | "Não"),
        otherCitizenshipPastCountry: (data.otherCitizenshipPastCountry as string) || null,
        otherNameUsed: boolFromYesNo(data.otherNameUsedConfirmation as "Sim" | "Não"),
        otherName: (data.otherName as string) || null,
        otherTravelDoc: boolFromYesNo(data.otherTravelDocConfirmation as "Sim" | "Não"),
        otherTravelDocCountry: (data.otherTravelDocCountry as string) || null,
        otherTravelDocType: (data.otherTravelDocType as string) || null,
        otherTravelDocNumber: (data.otherTravelDocNumber as string) || null,
        otherTravelDocExpireYear: (data.otherTravelDocExpireYear as string) || null,
      };
    case 2:
      return {
        address: data.address as string,
        addressNumber: data.addressNumber as string,
        complement: (data.complement as string) || null,
        district: data.district as string,
        city: data.city as string,
        state: data.state as string,
        cep: data.cep as string,
        country: data.country as string,
        phone: data.phone as string,
        email: data.email as string,
        instagram: (data.instagram as string) || null,
        facebook: (data.facebook as string) || null,
        linkedin: (data.linkedin as string) || null,
        otherSocial: (data.otherSocial as string) || null,
      };
    case 3:
      return {
        globalEntryMember: boolFromYesNo(data.globalEntryMemberConfirmation as "Sim" | "Não"),
        fatherFullName: data.fatherFullName as string,
        motherFullName: data.motherFullName as string,
        jobTitle: data.jobTitle as string,
        employerName: data.employerName as string,
        employerAddress: data.employerAddress as string,
        employerAddressNumber: data.employerAddressNumber as string,
        employerComplement: (data.employerComplement as string) || null,
        employerDistrict: data.employerDistrict as string,
        employerCity: data.employerCity as string,
        employerState: data.employerState as string,
        employerCep: data.employerCep as string,
        employerCountry: data.employerCountry as string,
        employerPhone: (data.employerPhone as string) || null,
      };
    case 4:
      return {
        transitToOtherCountry: boolFromYesNo(data.transitToOtherCountryConfirmation as "Sim" | "Não"),
        usContactName: (data.usContactName as string) || null,
        usContactAddress: (data.usContactAddress as string) || null,
        usContactAddressNumber: (data.usContactAddressNumber as string) || null,
        usContactComplement: (data.usContactComplement as string) || null,
        usContactDistrict: (data.usContactDistrict as string) || null,
        usContactCity: (data.usContactCity as string) || null,
        usContactState: (data.usContactState as string) || null,
        usContactCep: (data.usContactCep as string) || null,
        usContactCountry: (data.usContactCountry as string) || null,
        usContactPhone: (data.usContactPhone as string) || null,
        usAddressSameAsContact: boolFromYesNo(
          (data.usAddressSameAsContactConfirmation as "Sim" | "Não" | undefined) ?? "Sim",
        ),
        usStayAddress: (data.usStayAddress as string) || null,
        usStayAddressNumber: (data.usStayAddressNumber as string) || null,
        usStayComplement: (data.usStayComplement as string) || null,
        usStayDistrict: (data.usStayDistrict as string) || null,
        usStayCity: (data.usStayCity as string) || null,
        usStayState: (data.usStayState as string) || null,
        usStayCep: (data.usStayCep as string) || null,
        usStayCountry: (data.usStayCountry as string) || null,
      };
    case 5:
      return {
        emergencyName: data.emergencyName as string,
        emergencyEmail: data.emergencyEmail as string,
        emergencyPhone: data.emergencyPhone as string,
      };
    default:
      return {};
  }
}

export const estaRouter = router({
  getForm: isUserAuthedProcedure
    .input(z.object({ profileId: z.string().min(1) }))
    .query(async (opts) => {
      const email = opts.ctx.user.user?.email;
      if (!email) throw new TRPCError({ code: "UNAUTHORIZED" });

      const profile = await assertEstaProfile(opts.input.profileId);
      const locked = isFormLocked(profile.statusForm, profile.formLocked);
      const esta = profile.estaForm ?? (await ensureEstaForm(profile.id));

      return {
        form: mapEstaFormToClient(esta),
        formStep: profile.formStep,
        statusForm: profile.statusForm,
        formLocked: locked,
        profileName: profile.name,
      };
    }),

  getFormAdmin: collaboratorProcedure
    .input(z.object({ profileId: z.string().min(1) }))
    .query(async (opts) => {
      const profile = await assertEstaProfile(opts.input.profileId);
      const esta = profile.estaForm ?? (await ensureEstaForm(profile.id));

      return {
        form: mapEstaFormToClient(esta),
        formStep: profile.formStep,
        statusForm: profile.statusForm,
        profileName: profile.name,
        process: profile.process,
      };
    }),

  saveStep: isUserAuthedProcedure.input(stepPayload).mutation(async (opts) => {
    const email = opts.ctx.user.user?.email;
    if (!email) throw new TRPCError({ code: "UNAUTHORIZED" });

    await assertClientCanEditEsta(opts.input.profileId, email);
    await ensureEstaForm(opts.input.profileId);

    const nextStep = Math.min(opts.input.step + 1, ESTA_MAX_STEP);

    await prisma.estaForm.update({
      where: { profileId: opts.input.profileId },
      data: stepToDb(opts.input.step, opts.input.data as Record<string, unknown>),
    });

    await prisma.profile.update({
      where: { id: opts.input.profileId },
      data: {
        statusForm: StatusForm.filling,
        formStep: nextStep,
        ...(opts.input.step === 0
          ? {
              name: [opts.input.data.firstName, opts.input.data.lastName]
                .filter(Boolean)
                .join(" ")
                .trim(),
            }
          : {}),
      },
    });

    return { message: "Salvo", nextStep };
  }),

  saveDraft: isUserAuthedProcedure.input(stepPayload).mutation(async (opts) => {
    const email = opts.ctx.user.user?.email;
    if (!email) throw new TRPCError({ code: "UNAUTHORIZED" });

    await assertClientCanEditEsta(opts.input.profileId, email);
    await ensureEstaForm(opts.input.profileId);

    await prisma.estaForm.update({
      where: { profileId: opts.input.profileId },
      data: stepToDb(opts.input.step, opts.input.data as Record<string, unknown>),
    });

    await prisma.profile.update({
      where: { id: opts.input.profileId },
      data: { statusForm: StatusForm.filling },
    });

    return { message: "Rascunho salvo" };
  }),

  submit: isUserAuthedProcedure
    .input(z.object({ profileId: z.string().min(1), data: estaStep5Schema }))
    .mutation(async (opts) => {
      const email = opts.ctx.user.user?.email;
      if (!email) throw new TRPCError({ code: "UNAUTHORIZED" });

      const profile = await assertClientCanEditEsta(opts.input.profileId, email);
      await ensureEstaForm(opts.input.profileId);

      await prisma.estaForm.update({
        where: { profileId: opts.input.profileId },
        data: stepToDb(5, opts.input.data as Record<string, unknown>),
      });

      await prisma.profile.update({
        where: { id: opts.input.profileId },
        data: {
          statusForm: StatusForm.filled,
          formStep: ESTA_MAX_STEP,
          formLocked: true,
          name:
            [profile.estaForm?.firstName, profile.estaForm?.lastName].filter(Boolean).join(" ").trim() ||
            profile.name,
        },
      });

      return { message: "Formulário ESTA enviado" };
    }),
});

export async function createEstaFormForProfile(profileId: string) {
  const existing = await prisma.estaForm.findUnique({ where: { profileId } });
  if (!existing) {
    await prisma.estaForm.create({ data: { profile: { connect: { id: profileId } } } });
  }
}
