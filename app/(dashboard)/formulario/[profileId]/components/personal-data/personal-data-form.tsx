"use client";

import { z } from "zod";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { format, getYear } from "date-fns";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar as CalendarIcon } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { ArrowRight, Loader2, Plus, Save, X } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { countries } from "@/constants";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import { FIELD_HELP } from "@/lib/form-field-help";
import useFormStore from "@/constants/stores/useFormStore";
import { PersonalDataFormType } from "@/types";

// TODO: alterar input de date para string igual nos outros forms
const formSchema = z
  .object({
    firstName: z.string().min(1, "Campo obrigatório"),
    lastName: z.string().min(1, "Campo obrigatório"),
    cpf: z.string().min(1, "Campo obrigatório").min(14, "CPF Inválido"),
    warNameConfirmation: z.enum(["Sim", "Não"]),
    warName: z.string().optional(),
    fullNameNative: z.string().optional(),
    otherNamesConfirmation: z.enum(["Sim", "Não"]),
    otherNames: z.array(z.string().min(1, { message: "Valor não pode ser vazio" })).optional(),
    sex: z.string({ message: "Selecione uma opção" }).min(1, { message: "Selecione uma opção" }),
    maritalStatus: z.string({ message: "Selecione uma opção" }).min(1, { message: "Selecione uma opção" }),
    birthDate: z.date({ message: "Selecione uma data" }),
    birthCity: z.string().min(1, "Campo obrigatório"),
    birthState: z.string().min(1, "Campo obrigatório"),
    birthCountry: z.string().min(1, "Campo obrigatório"),
    originCountry: z.string().min(1, "Campo obrigatório"),
    ESTAVisaDeniedConfirmation: z.enum(["Sim", "Não"]),
    otherNationalityConfirmation: z.enum(["Sim", "Não"]),
    otherNationalityPassport: z.string().optional(),
    otherNationalityCountry: z.string().optional(),
    otherCountryResidentConfirmation: z.enum(["Sim", "Não"]),
    otherCountryResident: z.string().optional(),
    USSocialSecurityNumber: z.string(),
    USTaxpayerIDNumber: z.string(),
  })
  .superRefine(
    (
      {
        otherNationalityConfirmation,
        otherNationalityPassport,
        otherNationalityCountry,
        otherNamesConfirmation,
        otherNames,
        warNameConfirmation,
        warName,
        otherCountryResidentConfirmation,
        otherCountryResident,
      },
      ctx
    ) => {
      if (
        otherNationalityConfirmation === "Sim" &&
        (otherNationalityPassport === undefined || otherNationalityPassport?.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["otherNationalityPassport"],
        });
      }

      if (
        otherNationalityConfirmation === "Sim" &&
        (otherNationalityCountry === undefined || otherNationalityCountry?.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["otherNationalityCountry"],
        });
      }

      if (otherNamesConfirmation === "Sim" && otherNames && otherNames.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["otherNames"],
        });
      }

      if (warNameConfirmation === "Sim" && (warName === undefined || warName.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["warName"],
        });
      }

      if (
        otherCountryResidentConfirmation === "Sim" &&
        (otherCountryResident === undefined || otherCountryResident?.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["otherCountryResident"],
        });
      }
    }
  );

interface Props {
  personalDataForm: PersonalDataFormType;
  profileId: string;
  isEditing: boolean;
}

export function PersonalDataForm({ personalDataForm, profileId, isEditing }: Props) {
  const [otherNamesValue, setOtherNamesValue] = useState<string>("");

  const { redirectStep, setRedirectStep } = useFormStore();

  const { data: profileBirthDate, isLoading: isBirthLoading } = trpc.clientRouter.getProfileBirthDate.useQuery({
    profileId,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: personalDataForm.firstName ? personalDataForm.firstName : "",
      lastName: personalDataForm.lastName ? personalDataForm.lastName : "",
      cpf: personalDataForm.cpf ? personalDataForm.cpf : "",
      warNameConfirmation: personalDataForm.warNameConfirmation ? "Sim" : "Não",
      warName: personalDataForm.warName ? personalDataForm.warName : "",
      fullNameNative: personalDataForm.fullNameNative ? personalDataForm.fullNameNative : "",
      otherNamesConfirmation: personalDataForm.otherNamesConfirmation ? "Sim" : "Não",
      otherNames: personalDataForm.otherNames.length > 0 ? personalDataForm.otherNames : [],
      sex: personalDataForm.sex ? personalDataForm.sex : undefined,
      maritalStatus: personalDataForm.maritalStatus ? personalDataForm.maritalStatus : undefined,
      birthDate: personalDataForm.birthDate ? personalDataForm.birthDate : undefined,
      birthCity: personalDataForm.birthCity ? personalDataForm.birthCity : "",
      birthState: personalDataForm.birthState ? personalDataForm.birthState : "",
      birthCountry: personalDataForm.birthCountry ? personalDataForm.birthCountry : "",
      originCountry: personalDataForm.originCountry ? personalDataForm.originCountry : "",
      ESTAVisaDeniedConfirmation: personalDataForm.ESTAVisaDeniedConfirmation ? "Sim" : "Não",
      otherNationalityConfirmation: personalDataForm.otherNationalityConfirmation ? "Sim" : "Não",
      otherNationalityPassport: personalDataForm.otherNationalityPassport
        ? personalDataForm.otherNationalityPassport
        : "",
      otherNationalityCountry: personalDataForm.otherNationalityCountry ? personalDataForm.otherNationalityCountry : "",
      otherCountryResidentConfirmation: personalDataForm.otherCountryResidentConfirmation ? "Sim" : "Não",
      otherCountryResident: personalDataForm.otherCountryResident ? personalDataForm.otherCountryResident : "",
      USSocialSecurityNumber: personalDataForm.USSocialSecurityNumber ? personalDataForm.USSocialSecurityNumber : "",
      USTaxpayerIDNumber: personalDataForm.USTaxpayerIDNumber ? personalDataForm.USTaxpayerIDNumber : "",
    },
  });

  const currentYear = getYear(new Date());
  const birthDate = form.watch("birthDate");
  const otherNamesConfirmationValue: "Sim" | "Não" = form.watch("otherNamesConfirmation");
  const warNameConfirmationValue: "Sim" | "Não" = form.watch("warNameConfirmation");
  const otherNationalityConfirmation: "Sim" | "Não" = form.watch("otherNationalityConfirmation");
  const otherCountryResidentConfirmation: "Sim" | "Não" = form.watch("otherCountryResidentConfirmation");
  const otherNames = form.watch("otherNames");
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutate: submitPersonalData, isPending } = trpc.formsRouter.submitPersonalData.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.isEditing) {
        router.push(`/resumo-formulario/${profileId}`);
      } else {
        router.push(`/formulario/${profileId}?formStep=1`);
      }
    },
    onError: (error) => {
      console.error(error.data);

      if (error.data && error.data.code === "NOT_FOUND") {
        toast.error(error.message);
      } else {
        toast.error("Erro ao enviar as informações do formulário, tente novamente mais tarde");
      }
    },
  });
  const { mutate: savePersonalData, isPending: isSavePending } = trpc.formsRouter.savePersonalData.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.redirectStep !== undefined) {
        router.push(`/formulario/${profileId}?formStep=${data.redirectStep}`);
      } else {
        router.push("/area-do-cliente");
      }
    },
    onError: (error) => {
      console.error(error.data);

      if (error.data && error.data.code === "NOT_FOUND") {
        toast.error(error.message);
      } else {
        toast.error("Ocorreu um erro ao salvar os dados");
      }
    },
  });

  useEffect(() => {
    if (redirectStep !== null) {
      const values = form.getValues();

      if (birthDate !== undefined) {
        if (profileBirthDate && format(birthDate, "dd/MM/yyyy") !== profileBirthDate) {
          toast.error("Data de nascimento é diferente da data cadastrada no perfil, verifique e tente novamente");

          return;
        }
      }

      savePersonalData({
        profileId,
        redirectStep,
        firstName: values.firstName !== "" ? values.firstName : personalDataForm.firstName,
        lastName: values.lastName !== "" ? values.lastName : personalDataForm.lastName,
        cpf: values.cpf !== "" ? values.cpf : personalDataForm.cpf,
        warNameConfirmation: values.warNameConfirmation ?? (personalDataForm.warNameConfirmation ? "Sim" : "Não"),
        warName: values.warName !== "" ? values.warName : personalDataForm.warName,
        fullNameNative: values.fullNameNative !== "" ? values.fullNameNative : personalDataForm.fullNameNative,
        otherNamesConfirmation:
          values.otherNamesConfirmation ?? (personalDataForm.otherNamesConfirmation ? "Sim" : "Não"),
        otherNames: values.otherNames ?? personalDataForm.otherNames,
        sex: values.sex !== "" ? values.sex : !personalDataForm.sex ? undefined : personalDataForm.sex,
        maritalStatus:
          values.maritalStatus !== ""
            ? values.maritalStatus
            : !personalDataForm.maritalStatus
            ? undefined
            : personalDataForm.maritalStatus,
        birthDate: values.birthDate ?? personalDataForm.birthDate,
        birthCity: values.birthCity !== "" ? values.birthCity : personalDataForm.birthCity,
        birthState: values.birthState !== "" ? values.birthState : personalDataForm.birthState,
        birthCountry: values.birthCountry !== "" ? values.birthCountry : personalDataForm.birthCountry,
        originCountry: values.originCountry !== "" ? values.originCountry : personalDataForm.originCountry,
        ESTAVisaDeniedConfirmation:
          values.ESTAVisaDeniedConfirmation ?? (personalDataForm.ESTAVisaDeniedConfirmation ? "Sim" : "Não"),
        otherNationalityConfirmation:
          values.otherNationalityConfirmation ?? (personalDataForm.otherNationalityConfirmation ? "Sim" : "Não"),
        otherNationalityPassport:
          values.otherNationalityPassport !== ""
            ? values.otherNationalityPassport
            : personalDataForm.otherNationalityPassport,
        otherNationalityCountry:
          values.otherNationalityCountry !== ""
            ? values.otherNationalityCountry
            : personalDataForm.otherNationalityCountry,
        otherCountryResidentConfirmation:
          values.otherCountryResidentConfirmation ??
          (personalDataForm.otherCountryResidentConfirmation ? "Sim" : "Não"),
        otherCountryResident:
          values.otherCountryResident !== "" ? values.otherCountryResident : personalDataForm.otherCountryResident,
        USSocialSecurityNumber:
          values.USSocialSecurityNumber !== ""
            ? values.USSocialSecurityNumber
            : personalDataForm.USSocialSecurityNumber,
        USTaxpayerIDNumber:
          values.USTaxpayerIDNumber !== "" ? values.USTaxpayerIDNumber : personalDataForm.USTaxpayerIDNumber,
      });
      setRedirectStep(null);
    }
  }, [redirectStep, setRedirectStep, savePersonalData, profileId]);

  function onSave() {
    const values = form.getValues();

    if (birthDate !== undefined) {
      if (profileBirthDate && format(birthDate, "dd/MM/yyyy") !== profileBirthDate) {
        toast.error("Data de nascimento é diferente da data cadastrada no perfil, verifique e tente novamente");

        return;
      }
    }

    savePersonalData({
      profileId,
      firstName: values.firstName !== "" ? values.firstName : personalDataForm.firstName,
      lastName: values.lastName !== "" ? values.lastName : personalDataForm.lastName,
      cpf: values.cpf !== "" ? values.cpf : personalDataForm.cpf,
      warNameConfirmation: values.warNameConfirmation ?? (personalDataForm.warNameConfirmation ? "Sim" : "Não"),
      warName: values.warName !== "" ? values.warName : personalDataForm.warName,
      fullNameNative: values.fullNameNative !== "" ? values.fullNameNative : personalDataForm.fullNameNative,
      otherNamesConfirmation:
        values.otherNamesConfirmation ?? (personalDataForm.otherNamesConfirmation ? "Sim" : "Não"),
      otherNames: values.otherNames ?? personalDataForm.otherNames,
      sex: values.sex !== "" ? values.sex : !personalDataForm.sex ? undefined : personalDataForm.sex,
      maritalStatus:
        values.maritalStatus !== ""
          ? values.maritalStatus
          : !personalDataForm.maritalStatus
          ? undefined
          : personalDataForm.maritalStatus,
      birthDate: values.birthDate ?? personalDataForm.birthDate,
      birthCity: values.birthCity !== "" ? values.birthCity : personalDataForm.birthCity,
      birthState: values.birthState !== "" ? values.birthState : personalDataForm.birthState,
      birthCountry: values.birthCountry !== "" ? values.birthCountry : personalDataForm.birthCountry,
      originCountry: values.originCountry !== "" ? values.originCountry : personalDataForm.originCountry,
      ESTAVisaDeniedConfirmation:
        values.ESTAVisaDeniedConfirmation ?? (personalDataForm.ESTAVisaDeniedConfirmation ? "Sim" : "Não"),
      otherNationalityConfirmation:
        values.otherNationalityConfirmation ?? (personalDataForm.otherNationalityConfirmation ? "Sim" : "Não"),
      otherNationalityPassport:
        values.otherNationalityPassport !== ""
          ? values.otherNationalityPassport
          : personalDataForm.otherNationalityPassport,
      otherNationalityCountry:
        values.otherNationalityCountry !== ""
          ? values.otherNationalityCountry
          : personalDataForm.otherNationalityCountry,
      otherCountryResidentConfirmation:
        values.otherCountryResidentConfirmation ?? (personalDataForm.otherCountryResidentConfirmation ? "Sim" : "Não"),
      otherCountryResident:
        values.otherCountryResident !== "" ? values.otherCountryResident : personalDataForm.otherCountryResident,
      USSocialSecurityNumber:
        values.USSocialSecurityNumber !== "" ? values.USSocialSecurityNumber : personalDataForm.USSocialSecurityNumber,
      USTaxpayerIDNumber:
        values.USTaxpayerIDNumber !== "" ? values.USTaxpayerIDNumber : personalDataForm.USTaxpayerIDNumber,
    });
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (profileBirthDate && format(birthDate, "dd/MM/yyyy") !== profileBirthDate) {
      toast.error("Data de nascimento é diferente da data cadastrada no perfil, verifique e tente novamente");

      return;
    }

    submitPersonalData({ ...values, profileId, step: 1, isEditing });
  }

  function handleAddOtherNamesInput() {
    if (otherNamesValue === "") {
      return;
    }

    const currentNames = otherNames ?? [];

    currentNames.push(otherNamesValue);

    form.setValue("otherNames", currentNames);
    setOtherNamesValue("");
  }

  function handleRemoveOtherNames(index: number) {
    const currentNames = otherNames ?? [];

    if (currentNames.length === 0) {
      return;
    }

    const namesUpdated = currentNames.filter((_, nameIndex) => nameIndex !== index);

    form.setValue("otherNames", namesUpdated);
  }

  function handleCPFPersonalDataChange(event: ChangeEvent<HTMLInputElement>) {
    let value = event.target.value.replace(/[^\d]/g, "");

    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    form.setValue("cpf", value);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-12">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold">Dados Pessoais</h2>

        <div className="w-full flex flex-col gap-12 justify-between flex-grow">
          <div className="w-full flex flex-col">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.firstName}>
                      Primeiro nome (Conforme passaporte)*
                    </FormLabel>

                    <FormControl>
                      <Input disabled={isPending || isSavePending || isBirthLoading} className="!mt-auto" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.lastName}>
                      Sobrenome (Conforme passaporte)*
                    </FormLabel>

                    <FormControl>
                      <Input disabled={isPending || isSavePending || isBirthLoading} className="!mt-auto" {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">CPF*</FormLabel>

                    <FormControl>
                      <Input
                        disabled={isPending || isSavePending || isBirthLoading}
                        maxLength={14}
                        value={field.value}
                        ref={field.ref}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={handleCPFPersonalDataChange}
                        className="!mt-auto"
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="warNameConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.warName}>
                      Possui código ou nome de guerra?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending || isBirthLoading}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>
                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>
                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warName"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2", {
                      hidden: warNameConfirmationValue === "Não",
                    })}
                  >
                    <FormLabel className="text-foreground" help={FIELD_HELP.warName}>
                      Código ou nome de guerra
                    </FormLabel>
                    <FormControl>
                      <Input disabled={isPending || isSavePending || isBirthLoading} className="!mt-auto" {...field} />
                    </FormControl>
                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fullNameNative"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 mb-6">
                  <FormLabel className="text-foreground" help={FIELD_HELP.fullNameNative}>
                    Nome completo em alfabeto nativo (deixe vazio se igual ao passaporte ou não se aplica)
                  </FormLabel>
                  <FormControl>
                    <Input disabled={isPending || isSavePending || isBirthLoading} className="!mt-auto" {...field} />
                  </FormControl>
                  <FormMessage className="text-sm text-destructive" />
                </FormItem>
              )}
            />

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="otherNamesConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.otherNames}>
                      Possui outros nomes? (Solteira/Nome Profissional/Religioso/etc...)
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending || isBirthLoading}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                name="otherNames"
                control={form.control}
                render={({ field }) => (
                  <FormItem
                    className={cn("w-full bg-secondary rounded-xl p-4 flex flex-col gap-2", {
                      hidden: otherNamesConfirmationValue === "Não",
                    })}
                  >
                    <FormLabel className="text-foreground" help={FIELD_HELP.otherNames}>
                      Outro nome
                    </FormLabel>

                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 justify-between">
                          <Input
                            className="!mt-auto"
                            disabled={isPending || isSavePending || isBirthLoading}
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={otherNamesValue}
                            onChange={(event) => setOtherNamesValue(event.target.value)}
                          />

                          <Button
                            type="button"
                            size="xl"
                            className="px-3"
                            disabled={isPending}
                            onClick={handleAddOtherNamesInput}
                          >
                            <Plus />
                          </Button>
                        </div>

                        {otherNames && (
                          <div className="w-full flex flex-wrap gap-2">
                            {otherNames.map((name, index) => (
                              <div
                                key={`otherName-${index}`}
                                className="py-2 px-4 bg-primary/40 rounded-full flex items-center gap-2 group"
                              >
                                <span className="text-sm font-medium text-white">{name}</span>

                                <Button
                                  type="button"
                                  variant="link"
                                  size="icon"
                                  className="size-5 hidden opacity-0 transition-all group-hover:block group-hover:opacity-100"
                                  disabled={isPending || isSavePending || isBirthLoading}
                                  onClick={() => handleRemoveOtherNames(index)}
                                >
                                  <X strokeWidth={1} size={20} color="#FFFFFF" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Sexo*</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading}>
                          <SelectValue placeholder="Selecione a opção" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>

                        <SelectItem value="Feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.maritalStatus}>
                      Estado civil*
                    </FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading}>
                          <SelectValue placeholder="Selecione a opção" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="Casado(a)">Casado(a)</SelectItem>

                        <SelectItem value="União Estável">União Estável</SelectItem>

                        <SelectItem value="Parceiro(a) Doméstico(a)">Parceiro(a) Doméstico(a)</SelectItem>

                        <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>

                        <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>

                        <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>

                        <SelectItem value="Separado(a)">Separado(a)</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Data de nascimento*</FormLabel>

                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="date"
                            className={cn("!mt-auto", !field.value && "text-muted-foreground")}
                            disabled={isPending || isSavePending || isBirthLoading}
                          >
                            <CalendarIcon strokeWidth={1.5} className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                            <div className="w-[2px] h-full bg-muted rounded-full flex-shrink-0" />

                            {field.value ? (
                              format(field.value, "PPP", {
                                locale: ptBR,
                              })
                            ) : (
                              <span className="text-muted-foreground">Selecione a data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          locale={ptBR}
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={currentYear}
                          classNames={{
                            day_hidden: "invisible",
                            dropdown:
                              "px-2 py-1.5 bg-background border border-border rounded-lg text-foreground text-sm focus-visible:outline-none",
                            caption_dropdowns: "flex rounded-lg gap-3",
                            vhidden: "hidden",
                            caption_label: "hidden",
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="birthCity"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Cidade de Nascimento*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthState"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Estado de Nascimento*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthCountry"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">País de Nascimento*</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading}>
                          <SelectValue placeholder="Selecione o país de nascimento" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem value={country} key={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="originCountry"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">País de origem (nacionalidade)*</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading}>
                          <SelectValue placeholder="Selecione o país" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem value={country} key={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="otherNationalityConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.otherNationality}>
                      Possui outra nacionalidade?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending || isBirthLoading}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="otherNationalityCountry"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", otherNationalityConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground" help={FIELD_HELP.otherNationality}>
                      País da outra nacionalidade
                    </FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading}>
                          <SelectValue placeholder="Selecione o país de outra nacionalidade" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem value={country} key={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherNationalityPassport"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", otherNationalityConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground">Número do passaporte da outra nacionalidade</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={otherNationalityConfirmation === "Não" || isPending || isSavePending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ESTAVisaDeniedConfirmation"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", otherNationalityConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground" help={FIELD_HELP.estaDenied}>
                      Você já teve sua autorização de viagem negada pelo Departamento de Segurança Interna por meio do
                      Sistema Eletrônico de Autorização de Viagem (ESTA)?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending || isBirthLoading}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="otherCountryResidentConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      É residente de um país diferente da sua nacionalidade?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending || isBirthLoading}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Não" />
                          </FormControl>

                          <FormLabel className="font-normal">Não</FormLabel>
                        </FormItem>

                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Sim" />
                          </FormControl>

                          <FormLabel className="font-normal">Sim</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherCountryResident"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2", otherCountryResidentConfirmation === "Não" && "hidden")}
                  >
                    <FormLabel className="text-foreground">País diferente da nacionalidade</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading}>
                          <SelectValue placeholder="Selecione o país" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem value={country} key={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <FormField
                control={form.control}
                name="USSocialSecurityNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.usSsn}>
                      U.S. Social Security Number (aplicável somente para quem já trabalhou nos EUA)
                    </FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="USTaxpayerIDNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.usTaxpayer}>
                      U.S. Taxpayer ID Number (aplicável somente para quem já trabalhou nos EUA)
                    </FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending || isBirthLoading} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="w-full flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-end">
            {isEditing ? (
              <>
                <Button
                  size="xl"
                  variant="outline"
                  type="button"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={isPending || isSavePending || isBirthLoading}
                  onClick={() => router.push(`/resumo-formulario/${profileId}`)}
                >
                  Cancelar
                </Button>

                <Button
                  size="xl"
                  type="submit"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={isPending || isSavePending || isBirthLoading}
                >
                  {isPending ? (
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
              </>
            ) : (
              <>
                <Button
                  size="xl"
                  variant="outline"
                  type="button"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={isPending || isSavePending || isBirthLoading}
                  onClick={onSave}
                >
                  {isSavePending ? (
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

                <Button
                  size="xl"
                  type="submit"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={isPending || isSavePending || isBirthLoading}
                >
                  {isPending ? (
                    <>
                      Enviando
                      <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
                    </>
                  ) : (
                    <>
                      Proximo
                      <ArrowRight className="size-5" strokeWidth={1.5} />
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
