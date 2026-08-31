"use client";

import { ChangeEvent, useEffect } from "react";
import { toast } from "sonner";
import { useForm, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Save, Send } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FormSectionHelp } from "@/components/form/field-help";

import { countries } from "@/constants";
import { trpc } from "@/lib/trpc-client";
import {
  ESTA_FIELD_HELP,
  ESTA_STEPS,
  estaStep0Schema,
  estaStep1Schema,
  estaStep2Schema,
  estaStep3Schema,
  estaStep4Schema,
  estaStep5Schema,
  type EstaStep0Values,
  type EstaStep1Values,
  type EstaStep2Values,
  type EstaStep3Values,
  type EstaStep4Values,
  type EstaStep5Values,
} from "@/lib/esta-form";

type EstaFormValues = EstaStep0Values &
  EstaStep1Values &
  EstaStep2Values &
  EstaStep3Values &
  EstaStep4Values &
  EstaStep5Values & {
    truthfulnessConfirmation?: boolean;
  };

interface Props {
  step: number;
  profileId: string;
  isEditing?: boolean;
}

const STEP_SCHEMAS = [
  estaStep0Schema,
  estaStep1Schema,
  estaStep2Schema,
  estaStep3Schema,
  estaStep4Schema,
  estaStep5Schema.omit({ truthfulnessConfirmation: true }),
] as const;

const estaStep5SubmitSchema = estaStep5Schema;

function maskCep(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
}

function YesNoField<T extends FieldValues>({
  control,
  name,
  label,
  help,
  disabled,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  help?: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <FormLabel help={help}>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex gap-6"
              disabled={disabled}
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="Sim" />
                <span>Sim</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="Não" />
                <span>Não</span>
              </label>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CountrySelect<T extends FieldValues>({
  control,
  name,
  label,
  help,
  disabled,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  help?: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <FormLabel help={help}>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger className="!mt-auto">
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextField<T extends FieldValues>({
  control,
  name,
  label,
  help,
  placeholder,
  disabled,
  onChange,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  help?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <FormLabel help={help}>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(event) => {
                if (onChange) {
                  onChange(event);
                  return;
                }
                field.onChange(event);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function getStepDefaults(step: number, form: EstaFormValues) {
  switch (step) {
    case 0:
      return {
        firstName: form.firstName,
        lastName: form.lastName,
        passportNumber: form.passportNumber,
        passportIssuingCountry: form.passportIssuingCountry,
        passportIssueDate: form.passportIssueDate,
        passportExpireDate: form.passportExpireDate,
        citizenshipCountry: form.citizenshipCountry,
        nationalIdNumber: form.nationalIdNumber,
        sex: form.sex,
        birthDate: form.birthDate,
      } satisfies EstaStep0Values;
    case 1:
      return {
        otherCitizenshipNowConfirmation: form.otherCitizenshipNowConfirmation,
        otherCitizenshipNowCountry: form.otherCitizenshipNowCountry,
        otherCitizenshipPastConfirmation: form.otherCitizenshipPastConfirmation,
        otherCitizenshipPastCountry: form.otherCitizenshipPastCountry,
        otherNameUsedConfirmation: form.otherNameUsedConfirmation,
        otherName: form.otherName,
        otherTravelDocConfirmation: form.otherTravelDocConfirmation,
        otherTravelDocCountry: form.otherTravelDocCountry,
        otherTravelDocType: form.otherTravelDocType,
        otherTravelDocNumber: form.otherTravelDocNumber,
        otherTravelDocExpireYear: form.otherTravelDocExpireYear,
      } satisfies EstaStep1Values;
    case 2:
      return {
        address: form.address,
        addressNumber: form.addressNumber,
        complement: form.complement,
        district: form.district,
        city: form.city,
        state: form.state,
        cep: form.cep,
        country: form.country,
        phone: form.phone,
        email: form.email,
        instagram: form.instagram,
        facebook: form.facebook,
        linkedin: form.linkedin,
        otherSocial: form.otherSocial,
      } satisfies EstaStep2Values;
    case 3:
      return {
        globalEntryMemberConfirmation: form.globalEntryMemberConfirmation,
        fatherFullName: form.fatherFullName,
        motherFullName: form.motherFullName,
        jobTitle: form.jobTitle,
        employerName: form.employerName,
        employerAddress: form.employerAddress,
        employerAddressNumber: form.employerAddressNumber,
        employerDistrict: form.employerDistrict,
        employerCity: form.employerCity,
        employerState: form.employerState,
        employerCep: form.employerCep,
        employerCountry: form.employerCountry,
        employerPhone: form.employerPhone,
      } satisfies EstaStep3Values;
    case 4:
      return {
        transitToOtherCountryConfirmation: form.transitToOtherCountryConfirmation,
        usContactName: form.usContactName,
        usContactAddress: form.usContactAddress,
        usContactAddressNumber: form.usContactAddressNumber,
        usContactComplement: form.usContactComplement,
        usContactDistrict: form.usContactDistrict,
        usContactCity: form.usContactCity,
        usContactState: form.usContactState,
        usContactCep: form.usContactCep,
        usContactCountry: form.usContactCountry,
        usContactPhone: form.usContactPhone,
        usAddressSameAsContactConfirmation: form.usAddressSameAsContactConfirmation ?? "Sim",
        usStayAddress: form.usStayAddress,
        usStayAddressNumber: form.usStayAddressNumber,
        usStayComplement: form.usStayComplement,
        usStayDistrict: form.usStayDistrict,
        usStayCity: form.usStayCity,
        usStayState: form.usStayState,
        usStayCep: form.usStayCep,
        usStayCountry: form.usStayCountry,
      } satisfies EstaStep4Values;
    case 5:
      return {
        emergencyName: form.emergencyName,
        emergencyEmail: form.emergencyEmail,
        emergencyPhone: form.emergencyPhone,
        truthfulnessConfirmation: false,
      };
    default:
      return {};
  }
}

export function EstaFormStep({ step, profileId, isEditing: _isEditing }: Props) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data, isPending } = trpc.estaRouter.getForm.useQuery({ profileId });
  const { data: meData } = trpc.userRouter.getMe.useQuery(undefined, {
    enabled: step === 0 || step === 2,
  });

  const schema = STEP_SCHEMAS[step] ?? estaStep0Schema;
  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    defaultValues: getStepDefaults(step, (data?.form ?? {}) as unknown as EstaFormValues),
  });

  useEffect(() => {
    if (!data?.form) return;
    form.reset(getStepDefaults(step, data.form as unknown as EstaFormValues));
  }, [data, step, form]);

  useEffect(() => {
    if (!meData?.user || !data?.form) return;

    if (step === 0) {
      const current = form.getValues();
      const updates: Partial<EstaStep0Values> = {};

      if (!current.firstName && meData.user.name) {
        const parts = meData.user.name.trim().split(/\s+/);
        updates.firstName = parts[0] ?? "";
        updates.lastName = parts.slice(1).join(" ");
      }
      if (!current.nationalIdNumber && meData.user.cpf) {
        updates.nationalIdNumber = meData.user.cpf;
      }

      if (Object.keys(updates).length > 0) {
        form.reset({ ...current, ...updates });
      }
    }

    if (step === 2) {
      const current = form.getValues();
      const updates: Partial<EstaStep2Values> = {};

      if (!current.email && meData.user.email) {
        updates.email = meData.user.email;
      }
      if (!current.phone && meData.user.cel) {
        updates.phone = meData.user.cel;
      }

      if (Object.keys(updates).length > 0) {
        form.reset({ ...current, ...updates });
      }
    }
  }, [meData, data, step, form]);

  const { mutate: saveDraft, isPending: isSaving } = trpc.estaRouter.saveDraft.useMutation({
    onSuccess(result) {
      toast.success(result.message);
      utils.estaRouter.getForm.invalidate({ profileId });
      router.push("/area-do-cliente");
    },
    onError(error) {
      toast.error(error.message || "Não foi possível salvar o rascunho");
    },
  });

  const { mutate: saveStep, isPending: isAdvancing } = trpc.estaRouter.saveStep.useMutation({
    onSuccess(result) {
      toast.success(result.message);
      utils.estaRouter.getForm.invalidate({ profileId });
      router.push(`/formulario-esta/${profileId}?formStep=${result.nextStep}`);
    },
    onError(error) {
      toast.error(error.message || "Não foi possível avançar");
    },
  });

  const { mutate: submitForm, isPending: isSubmitting } = trpc.estaRouter.submit.useMutation({
    onSuccess(result) {
      toast.success(result.message);
      utils.estaRouter.getForm.invalidate({ profileId });
      utils.clientRouter.getAreaData.invalidate();
      router.push("/area-do-cliente");
    },
    onError(error) {
      toast.error(error.message || "Não foi possível enviar o formulário");
    },
  });

  const busy = isSaving || isAdvancing || isSubmitting;
  const stepLabel = ESTA_STEPS.find((item) => item.step === step)?.label ?? "Formulário ESTA";
  const storedForm = (data?.form ?? {}) as unknown as EstaFormValues;

  function mergeWithStored<T extends Record<string, unknown>>(values: T): T {
    const defaults = getStepDefaults(step, storedForm) as T;
    const merged = { ...defaults };

    for (const key of Object.keys(values) as (keyof T)[]) {
      const value = values[key];
      if (value !== undefined && value !== "") {
        merged[key] = value;
      }
    }

    return merged;
  }

  function onSave() {
    const values = mergeWithStored(form.getValues() as Record<string, unknown>);

    if (step === 5) {
      values.truthfulnessConfirmation = true;
    }

    saveDraft({
      profileId,
      step: step as 0 | 1 | 2 | 3 | 4 | 5,
      data: values as never,
    });
  }

  function onAdvance(values: FieldValues) {
    const payload =
      step === 5
        ? {
            ...(values as EstaStep5Values),
            truthfulnessConfirmation: true as const,
          }
        : values;

    saveStep({
      profileId,
      step: step as 0 | 1 | 2 | 3 | 4 | 5,
      data: payload as never,
    });
  }

  function onSubmit(values: FieldValues) {
    if (step === 5) {
      const parsed = estaStep5SubmitSchema.safeParse(values);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === "string") {
            form.setError(path, { message: issue.message });
          }
        });
        return;
      }

      submitForm({
        profileId,
        data: parsed.data,
      });
      return;
    }

    onAdvance(values);
  }

  if (isPending || !data) {
    return (
      <div className="w-full flex flex-col gap-12">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const otherCitizenshipNow = form.watch("otherCitizenshipNowConfirmation") as unknown as
    | EstaStep1Values["otherCitizenshipNowConfirmation"]
    | undefined;
  const otherCitizenshipPast = form.watch("otherCitizenshipPastConfirmation") as unknown as
    | EstaStep1Values["otherCitizenshipPastConfirmation"]
    | undefined;
  const otherNameUsed = form.watch("otherNameUsedConfirmation") as unknown as
    | EstaStep1Values["otherNameUsedConfirmation"]
    | undefined;
  const otherTravelDoc = form.watch("otherTravelDocConfirmation") as unknown as
    | EstaStep1Values["otherTravelDocConfirmation"]
    | undefined;
  const usAddressSame = form.watch("usAddressSameAsContactConfirmation") as unknown as
    | EstaStep4Values["usAddressSameAsContactConfirmation"]
    | undefined;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-6">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold mb-6">{stepLabel}</h2>

        <div className="w-full flex flex-col gap-12 justify-between flex-grow rounded-2xl bg-secondary p-6 sm:p-8">
          {step === 0 && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <TextField control={form.control} name="firstName" label="Nome*" help={ESTA_FIELD_HELP.firstName} disabled={busy} />
              <TextField control={form.control} name="lastName" label="Sobrenome*" help={ESTA_FIELD_HELP.lastName} disabled={busy} />
              <TextField control={form.control} name="passportNumber" label="Número do passaporte*" help={ESTA_FIELD_HELP.passportNumber} disabled={busy} />
              <CountrySelect control={form.control} name="passportIssuingCountry" label="País emissor do passaporte*" help={ESTA_FIELD_HELP.passportIssuingCountry} disabled={busy} />
              <TextField control={form.control} name="passportIssueDate" label="Data de emissão*" placeholder="dd/mm/aaaa" disabled={busy} />
              <TextField control={form.control} name="passportExpireDate" label="Data de validade*" placeholder="dd/mm/aaaa" disabled={busy} />
              <CountrySelect control={form.control} name="citizenshipCountry" label="País de cidadania*" disabled={busy} />
              <TextField control={form.control} name="nationalIdNumber" label="CPF / documento nacional*" help={ESTA_FIELD_HELP.nationalIdNumber} disabled={busy} />
              <TextField control={form.control} name="birthDate" label="Data de nascimento*" placeholder="dd/mm/aaaa" disabled={busy} />
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>Sexo*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={busy}>
                      <FormControl>
                        <SelectTrigger className="!mt-auto">
                          <SelectValue placeholder="Selecione a opção" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 1 && (
            <div className="w-full flex flex-col gap-8">
              <YesNoField
                control={form.control}
                name="otherCitizenshipNowConfirmation"
                label="Possui outra cidadania atualmente?*"
                help={ESTA_FIELD_HELP.otherCitizenship}
                disabled={busy}
              />
              {otherCitizenshipNow === "Sim" && (
                <CountrySelect
                  control={form.control}
                  name="otherCitizenshipNowCountry"
                  label="Qual nacionalidade?*"
                  disabled={busy}
                />
              )}

              <YesNoField
                control={form.control}
                name="otherCitizenshipPastConfirmation"
                label="Já possuiu outra cidadania?*"
                help={ESTA_FIELD_HELP.otherCitizenship}
                disabled={busy}
              />
              {otherCitizenshipPast === "Sim" && (
                <CountrySelect
                  control={form.control}
                  name="otherCitizenshipPastCountry"
                  label="Qual nacionalidade?*"
                  disabled={busy}
                />
              )}

              <YesNoField
                control={form.control}
                name="otherNameUsedConfirmation"
                label="Já usou outro nome?*"
                help={ESTA_FIELD_HELP.otherName}
                disabled={busy}
              />
              {otherNameUsed === "Sim" && (
                <TextField control={form.control} name="otherName" label="Outro nome*" help={ESTA_FIELD_HELP.otherName} disabled={busy} />
              )}

              <YesNoField
                control={form.control}
                name="otherTravelDocConfirmation"
                label="Possui outro documento de viagem?*"
                help={ESTA_FIELD_HELP.otherTravelDoc}
                disabled={busy}
              />
              {otherTravelDoc === "Sim" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                  <CountrySelect control={form.control} name="otherTravelDocCountry" label="País do documento*" disabled={busy} />
                  <TextField control={form.control} name="otherTravelDocType" label="Tipo do documento*" disabled={busy} />
                  <TextField control={form.control} name="otherTravelDocNumber" label="Número do documento*" disabled={busy} />
                  <TextField control={form.control} name="otherTravelDocExpireYear" label="Ano de validade*" disabled={busy} />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="w-full flex flex-col gap-8">
              <FormSectionHelp
                title="Endereço e contato"
                items={[
                  ESTA_FIELD_HELP.address,
                  ESTA_FIELD_HELP.socialMedia,
                ]}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <TextField control={form.control} name="address" label="Endereço*" help={ESTA_FIELD_HELP.address} disabled={busy} />
                <TextField control={form.control} name="addressNumber" label="Número*" disabled={busy} />
                <TextField control={form.control} name="complement" label="Complemento" disabled={busy} />
                <TextField control={form.control} name="district" label="Bairro*" disabled={busy} />
                <TextField control={form.control} name="city" label="Cidade*" disabled={busy} />
                <TextField control={form.control} name="state" label="Estado*" disabled={busy} />
                <TextField
                  control={form.control}
                  name="cep"
                  label="CEP*"
                  disabled={busy}
                  onChange={(event) => form.setValue("cep", maskCep(event.target.value))}
                />
                <CountrySelect control={form.control} name="country" label="País*" disabled={busy} />
                <TextField control={form.control} name="phone" label="Telefone*" disabled={busy} />
                <TextField control={form.control} name="email" label="E-mail*" disabled={busy} />
                <TextField control={form.control} name="instagram" label="Instagram" help={ESTA_FIELD_HELP.socialMedia} disabled={busy} />
                <TextField control={form.control} name="facebook" label="Facebook" help={ESTA_FIELD_HELP.socialMedia} disabled={busy} />
                <TextField control={form.control} name="linkedin" label="LinkedIn" help={ESTA_FIELD_HELP.socialMedia} disabled={busy} />
                <TextField control={form.control} name="otherSocial" label="Outra rede social" help={ESTA_FIELD_HELP.socialMedia} disabled={busy} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full flex flex-col gap-8">
              <FormSectionHelp
                title="Família e trabalho"
                items={[ESTA_FIELD_HELP.globalEntry, ESTA_FIELD_HELP.parents, ESTA_FIELD_HELP.employer]}
              />
              <YesNoField
                control={form.control}
                name="globalEntryMemberConfirmation"
                label="É membro do Global Entry, NEXUS ou SENTRI?*"
                help={ESTA_FIELD_HELP.globalEntry}
                disabled={busy}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <TextField control={form.control} name="fatherFullName" label="Nome completo do pai*" help={ESTA_FIELD_HELP.parents} disabled={busy} />
                <TextField control={form.control} name="motherFullName" label="Nome completo da mãe*" help={ESTA_FIELD_HELP.parents} disabled={busy} />
                <TextField control={form.control} name="jobTitle" label="Cargo*" disabled={busy} />
                <TextField control={form.control} name="employerName" label="Empregador*" help={ESTA_FIELD_HELP.employer} disabled={busy} />
                <TextField control={form.control} name="employerAddress" label="Endereço do empregador*" disabled={busy} />
                <TextField control={form.control} name="employerAddressNumber" label="Número*" disabled={busy} />
                <TextField control={form.control} name="employerDistrict" label="Bairro*" disabled={busy} />
                <TextField control={form.control} name="employerCity" label="Cidade*" disabled={busy} />
                <TextField control={form.control} name="employerState" label="Estado*" disabled={busy} />
                <TextField
                  control={form.control}
                  name="employerCep"
                  label="CEP*"
                  disabled={busy}
                  onChange={(event) => form.setValue("employerCep", maskCep(event.target.value))}
                />
                <CountrySelect control={form.control} name="employerCountry" label="País*" disabled={busy} />
                <TextField control={form.control} name="employerPhone" label="Telefone comercial" help={ESTA_FIELD_HELP.employer} disabled={busy} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="w-full flex flex-col gap-8">
              <YesNoField
                control={form.control}
                name="transitToOtherCountryConfirmation"
                label="Os EUA são apenas escala para outro país?*"
                help={ESTA_FIELD_HELP.transit}
                disabled={busy}
              />

              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium text-foreground">Contato nos EUA (opcional)</p>
                <p className="text-sm text-muted-foreground">{ESTA_FIELD_HELP.usContact}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                  <TextField control={form.control} name="usContactName" label="Nome do contato" disabled={busy} />
                  <TextField control={form.control} name="usContactPhone" label="Telefone" disabled={busy} />
                  <TextField control={form.control} name="usContactAddress" label="Endereço" disabled={busy} />
                  <TextField control={form.control} name="usContactAddressNumber" label="Número" disabled={busy} />
                  <TextField control={form.control} name="usContactComplement" label="Complemento" disabled={busy} />
                  <TextField control={form.control} name="usContactDistrict" label="Bairro" disabled={busy} />
                  <TextField control={form.control} name="usContactCity" label="Cidade" disabled={busy} />
                  <TextField control={form.control} name="usContactState" label="Estado" disabled={busy} />
                  <TextField control={form.control} name="usContactCep" label="CEP / ZIP" disabled={busy} />
                  <CountrySelect control={form.control} name="usContactCountry" label="País" disabled={busy} />
                </div>
              </div>

              <YesNoField
                control={form.control}
                name="usAddressSameAsContactConfirmation"
                label="O endereço nos EUA é o mesmo do contato?*"
                help={ESTA_FIELD_HELP.usStay}
                disabled={busy}
              />

              {usAddressSame === "Não" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm font-medium text-foreground">Endereço nos EUA</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                    <TextField control={form.control} name="usStayAddress" label="Endereço*" disabled={busy} />
                    <TextField control={form.control} name="usStayAddressNumber" label="Número*" disabled={busy} />
                    <TextField control={form.control} name="usStayComplement" label="Complemento" disabled={busy} />
                    <TextField control={form.control} name="usStayDistrict" label="Bairro*" disabled={busy} />
                    <TextField control={form.control} name="usStayCity" label="Cidade*" disabled={busy} />
                    <TextField control={form.control} name="usStayState" label="Estado*" disabled={busy} />
                    <TextField control={form.control} name="usStayCep" label="CEP / ZIP" disabled={busy} />
                    <CountrySelect control={form.control} name="usStayCountry" label="País*" disabled={busy} />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="w-full flex flex-col gap-8">
              <FormSectionHelp title="Contato de emergência" items={[ESTA_FIELD_HELP.emergency]} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <TextField control={form.control} name="emergencyName" label="Nome*" help={ESTA_FIELD_HELP.emergency} disabled={busy} />
                <TextField control={form.control} name="emergencyEmail" label="E-mail*" help={ESTA_FIELD_HELP.emergency} disabled={busy} />
                <TextField control={form.control} name="emergencyPhone" label="Telefone*" help={ESTA_FIELD_HELP.emergency} disabled={busy} />
              </div>

              <FormField
                control={form.control}
                name="truthfulnessConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-xl border border-border bg-background p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        disabled={busy}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal">
                        Declaro que todas as informações fornecidas são verdadeiras e completas.*
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="w-full flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <Button
              size="xl"
              variant="outline"
              type="button"
              className="w-full flex items-center gap-2 sm:w-fit"
              disabled={busy}
              onClick={onSave}
            >
              {isSaving ? (
                <>
                  Salvando
                  <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
                </>
              ) : (
                <>
                  Salvar
                  <Save className="size-5" strokeWidth={1.5} />
                </>
              )}
            </Button>

            {step < 5 && (
              <Button
                size="xl"
                type="submit"
                className="w-full flex items-center gap-2 sm:w-fit"
                disabled={busy}
              >
                {isAdvancing ? (
                  <>
                    Salvando
                    <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
                  </>
                ) : (
                  <>
                    Avançar
                    <ArrowRight className="size-5" strokeWidth={1.5} />
                  </>
                )}
              </Button>
            )}

            {step === 5 && (
              <>
                <Button
                  size="xl"
                  type="button"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={busy}
                  onClick={form.handleSubmit(onAdvance)}
                >
                  {isAdvancing ? (
                    <>
                      Salvando
                      <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
                    </>
                  ) : (
                    <>
                      Avançar
                      <ArrowRight className="size-5" strokeWidth={1.5} />
                    </>
                  )}
                </Button>

                <Button
                  size="xl"
                  type="submit"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={busy}
                >
                  {isSubmitting ? (
                    <>
                      Enviando
                      <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
                    </>
                  ) : (
                    <>
                      Enviar
                      <Send className="size-5" strokeWidth={1.5} />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
