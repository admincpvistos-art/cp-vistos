"use client";

import { z } from "zod";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { format, getYear } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form as FormType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Save, Loader2, ArrowRight, Plus, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import useFormStore from "@/constants/stores/useFormStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/constants";
import { AdditionalInformationFormType } from "@/types";

const formSchema = z
  .object({
    languages: z.array(z.string().min(1, { message: "Idioma precisa ser preenchido" })),
    fiveYearsOtherCountryTravelsConfirmation: z.enum(["Sim", "Não"]),
    fiveYearsOtherCountryTravels: z.array(z.string().min(1, { message: "Países precisam ser preenchidos" })),
    socialOrganizationConfirmation: z.enum(["Sim", "Não"]),
    socialOrganization: z.array(z.string().min(1, { message: "Os campos precisam ser preenchidos" })),
    weaponTrainingConfirmation: z.enum(["Sim", "Não"]),
    weaponTrainingDetails: z.string(),
    militaryServiceConfirmation: z.enum(["Sim", "Não"]),
    militaryServiceCountry: z.string(),
    militaryServiceLocal: z.string(),
    militaryServicePatent: z.string(),
    militaryServiceSpecialty: z.string(),
    militaryServiceStartDate: z.date().optional(),
    militaryServiceEndDate: z.date().optional(),
    insurgencyOrganizationConfirmation: z.enum(["Sim", "Não"]),
    insurgencyOrganizationDetails: z.string(),
  })
  .superRefine(
    (
      {
        fiveYearsOtherCountryTravelsConfirmation,
        fiveYearsOtherCountryTravels,
        socialOrganizationConfirmation,
        socialOrganization,
        weaponTrainingConfirmation,
        weaponTrainingDetails,
        militaryServiceConfirmation,
        militaryServicePatent,
        militaryServiceLocal,
        militaryServiceCountry,
        militaryServiceEndDate,
        militaryServiceSpecialty,
        militaryServiceStartDate,
        insurgencyOrganizationConfirmation,
        insurgencyOrganizationDetails,
      },
      ctx
    ) => {
      if (fiveYearsOtherCountryTravelsConfirmation === "Sim" && fiveYearsOtherCountryTravels.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["fiveYearsOtherCountryTravels"],
        });
      }

      if (socialOrganizationConfirmation === "Sim" && socialOrganization.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["socialOrganization"],
        });
      }

      if (weaponTrainingConfirmation === "Sim" && weaponTrainingDetails.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["weaponTrainingDetails"],
        });
      }

      if (militaryServiceConfirmation === "Sim" && militaryServiceSpecialty.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["militaryServiceSpecialty"],
        });
      }

      if (militaryServiceConfirmation === "Sim" && militaryServiceCountry.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["militaryServiceCountry"],
        });
      }

      if (militaryServiceConfirmation === "Sim" && militaryServiceLocal.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["militaryServiceLocal"],
        });
      }

      if (militaryServiceConfirmation === "Sim" && militaryServicePatent.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["militaryServicePatent"],
        });
      }

      if (militaryServiceConfirmation === "Sim" && militaryServiceStartDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["militaryServiceStartDate"],
        });
      }

      if (militaryServiceConfirmation === "Sim" && militaryServiceEndDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["militaryServiceEndDate"],
        });
      }

      if (insurgencyOrganizationConfirmation === "Sim" && insurgencyOrganizationDetails.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["insurgencyOrganizationDetails"],
        });
      }
    }
  );

interface Props {
  additionalInformationForm: AdditionalInformationFormType;
  profileId: string;
  isEditing: boolean;
}

export function AdditionalInformationForm({ additionalInformationForm, profileId, isEditing }: Props) {
  const [languageValue, setLanguageValue] = useState<string>("");
  const [countryValue, setCountryValue] = useState<string>("");
  const [organizationValue, setOrganizationValue] = useState<string>("");

  const { redirectStep, setRedirectStep } = useFormStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      languages: additionalInformationForm.languages,
      fiveYearsOtherCountryTravelsConfirmation: additionalInformationForm.fiveYearsOtherCountryTravelsConfirmation
        ? "Sim"
        : "Não",
      fiveYearsOtherCountryTravels: additionalInformationForm.fiveYearsOtherCountryTravels,
      socialOrganizationConfirmation: additionalInformationForm.socialOrganizationConfirmation ? "Sim" : "Não",
      socialOrganization: additionalInformationForm.socialOrganization,
      weaponTrainingConfirmation: additionalInformationForm.weaponTrainingConfirmation ? "Sim" : "Não",
      weaponTrainingDetails: additionalInformationForm.weaponTrainingDetails ?? "",
      militaryServiceConfirmation: additionalInformationForm.militaryServiceConfirmation ? "Sim" : "Não",
      militaryServiceCountry: additionalInformationForm.militaryServiceCountry ?? "",
      militaryServiceLocal: additionalInformationForm.militaryServiceLocal ?? "",
      militaryServicePatent: additionalInformationForm.militaryServicePatent ?? "",
      militaryServiceSpecialty: additionalInformationForm.militaryServiceSpecialty ?? "",
      militaryServiceStartDate: additionalInformationForm.militaryServiceStartDate
        ? new Date(additionalInformationForm.militaryServiceStartDate)
        : undefined,
      militaryServiceEndDate: additionalInformationForm.militaryServiceEndDate
        ? new Date(additionalInformationForm.militaryServiceEndDate)
        : undefined,
      insurgencyOrganizationConfirmation: additionalInformationForm.insurgencyOrganizationConfirmation ? "Sim" : "Não",
      insurgencyOrganizationDetails: additionalInformationForm.insurgencyOrganizationDetails ?? "",
    },
  });

  const currentYear = getYear(new Date());
  const languages = form.watch("languages");
  const fiveYearsOtherCountryTravelsConfirmation = form.watch("fiveYearsOtherCountryTravelsConfirmation");
  const fiveYearsOtherCountryTravels = form.watch("fiveYearsOtherCountryTravels");
  const socialOrganizationConfirmation = form.watch("socialOrganizationConfirmation");
  const socialOrganization = form.watch("socialOrganization");
  const weaponTrainingConfirmation = form.watch("weaponTrainingConfirmation");
  const militaryServiceConfirmation = form.watch("militaryServiceConfirmation");
  const insurgencyOrganizationConfirmation = form.watch("insurgencyOrganizationConfirmation");
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutate: submitAdditionalInformation, isPending } = trpc.formsRouter.submitAdditionalInformation.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.isEditing) {
        router.push(`/resumo-formulario/${profileId}`);
      } else {
        router.push(`/formulario/${profileId}?formStep=10`);
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
  const { mutate: saveAdditionalInformation, isPending: isSavePending } =
    trpc.formsRouter.saveAdditionalInformation.useMutation({
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

      saveAdditionalInformation({
        profileId,
        redirectStep,
        languages: values.languages.length > 0 ? values.languages : additionalInformationForm.languages,
        fiveYearsOtherCountryTravelsConfirmation:
          values.fiveYearsOtherCountryTravelsConfirmation ??
          (additionalInformationForm.fiveYearsOtherCountryTravelsConfirmation ? "Sim" : "Não"),
        fiveYearsOtherCountryTravels:
          values.fiveYearsOtherCountryTravels.length > 0
            ? values.fiveYearsOtherCountryTravels
            : additionalInformationForm.fiveYearsOtherCountryTravels,
        socialOrganizationConfirmation:
          values.socialOrganizationConfirmation ??
          (additionalInformationForm.socialOrganizationConfirmation ? "Sim" : "Não"),
        socialOrganization:
          values.socialOrganization.length > 0
            ? values.socialOrganization
            : additionalInformationForm.socialOrganization,
        weaponTrainingConfirmation:
          values.weaponTrainingConfirmation ?? (additionalInformationForm.weaponTrainingConfirmation ? "Sim" : "Não"),
        weaponTrainingDetails:
          values.weaponTrainingDetails !== ""
            ? values.weaponTrainingDetails
            : !additionalInformationForm.weaponTrainingDetails
            ? ""
            : additionalInformationForm.weaponTrainingDetails,
        militaryServiceConfirmation:
          values.militaryServiceConfirmation ?? (additionalInformationForm.militaryServiceConfirmation ? "Sim" : "Não"),
        militaryServiceCountry:
          values.militaryServiceCountry !== ""
            ? values.militaryServiceCountry
            : !additionalInformationForm.militaryServiceCountry
            ? ""
            : additionalInformationForm.militaryServiceCountry,
        militaryServiceLocal:
          values.militaryServiceLocal !== ""
            ? values.militaryServiceLocal
            : !additionalInformationForm.militaryServiceLocal
            ? ""
            : additionalInformationForm.militaryServiceLocal,
        militaryServicePatent:
          values.militaryServicePatent !== ""
            ? values.militaryServicePatent
            : !additionalInformationForm.militaryServicePatent
            ? ""
            : additionalInformationForm.militaryServicePatent,
        militaryServiceSpecialty:
          values.militaryServiceSpecialty !== ""
            ? values.militaryServiceSpecialty
            : !additionalInformationForm.militaryServiceSpecialty
            ? ""
            : additionalInformationForm.militaryServiceSpecialty,
        militaryServiceStartDate:
          values.militaryServiceStartDate !== undefined
            ? values.militaryServiceStartDate
            : !additionalInformationForm.militaryServiceStartDate
            ? undefined
            : additionalInformationForm.militaryServiceStartDate,
        militaryServiceEndDate:
          values.militaryServiceEndDate !== undefined
            ? values.militaryServiceEndDate
            : !additionalInformationForm.militaryServiceEndDate
            ? undefined
            : additionalInformationForm.militaryServiceEndDate,
        insurgencyOrganizationConfirmation:
          values.insurgencyOrganizationConfirmation ??
          (additionalInformationForm.insurgencyOrganizationConfirmation ? "Sim" : "Não"),
        insurgencyOrganizationDetails:
          values.insurgencyOrganizationDetails !== ""
            ? values.insurgencyOrganizationDetails
            : !additionalInformationForm.insurgencyOrganizationDetails
            ? ""
            : additionalInformationForm.insurgencyOrganizationDetails,
      });
      setRedirectStep(null);
    }
  }, [redirectStep, setRedirectStep, saveAdditionalInformation, profileId]);

  function addLanguages() {
    if (languageValue === "") {
      return;
    }

    const currentLanguages = languages ?? [];

    currentLanguages.push(languageValue);

    form.setValue("languages", currentLanguages);
    setLanguageValue("");
  }

  function addCountry() {
    if (countryValue === "") {
      return;
    }

    const currentCountry = fiveYearsOtherCountryTravels ?? [];

    if (fiveYearsOtherCountryTravels.includes(countryValue)) {
      toast.error("Esse país já foi adicionado!");

      return;
    }

    currentCountry.push(countryValue);

    form.setValue("fiveYearsOtherCountryTravels", currentCountry);
    setCountryValue("");
  }

  function addOrganization() {
    if (organizationValue === "") {
      return;
    }

    const currentOrganizations = socialOrganization ?? [];

    currentOrganizations.push(organizationValue);

    form.setValue("socialOrganization", currentOrganizations);
    setOrganizationValue("");
  }

  function removeLanguages(index: number) {
    const currentLanguages = languages ?? [];

    if (currentLanguages.length === 0) {
      return;
    }

    const languagesUpdated = currentLanguages.filter((_, languageIndex) => languageIndex !== index);

    form.setValue("languages", languagesUpdated);
  }

  function removeCountries(index: number) {
    const currentCountry = fiveYearsOtherCountryTravels ?? [];

    if (currentCountry.length === 0) {
      return;
    }

    const countriesUpdated = currentCountry.filter((_, countryIndex) => countryIndex !== index);

    form.setValue("fiveYearsOtherCountryTravels", countriesUpdated);
  }

  function removeOrganizations(index: number) {
    const currentOrganizations = socialOrganization ?? [];

    if (currentOrganizations.length === 0) {
      return;
    }

    const organizationsUpdated = currentOrganizations.filter((_, organizationIndex) => organizationIndex !== index);

    form.setValue("socialOrganization", organizationsUpdated);
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitAdditionalInformation({ ...values, profileId, step: 10, isEditing });
  }

  function onSave() {
    const values = form.getValues();

    saveAdditionalInformation({
      profileId,
      languages: values.languages.length > 0 ? values.languages : additionalInformationForm.languages,
      fiveYearsOtherCountryTravelsConfirmation:
        values.fiveYearsOtherCountryTravelsConfirmation ??
        (additionalInformationForm.fiveYearsOtherCountryTravelsConfirmation ? "Sim" : "Não"),
      fiveYearsOtherCountryTravels:
        values.fiveYearsOtherCountryTravels.length > 0
          ? values.fiveYearsOtherCountryTravels
          : additionalInformationForm.fiveYearsOtherCountryTravels,
      socialOrganizationConfirmation:
        values.socialOrganizationConfirmation ??
        (additionalInformationForm.socialOrganizationConfirmation ? "Sim" : "Não"),
      socialOrganization:
        values.socialOrganization.length > 0 ? values.socialOrganization : additionalInformationForm.socialOrganization,
      weaponTrainingConfirmation:
        values.weaponTrainingConfirmation ?? (additionalInformationForm.weaponTrainingConfirmation ? "Sim" : "Não"),
      weaponTrainingDetails:
        values.weaponTrainingDetails !== ""
          ? values.weaponTrainingDetails
          : !additionalInformationForm.weaponTrainingDetails
          ? ""
          : additionalInformationForm.weaponTrainingDetails,
      militaryServiceConfirmation:
        values.militaryServiceConfirmation ?? (additionalInformationForm.militaryServiceConfirmation ? "Sim" : "Não"),
      militaryServiceCountry:
        values.militaryServiceCountry !== ""
          ? values.militaryServiceCountry
          : !additionalInformationForm.militaryServiceCountry
          ? ""
          : additionalInformationForm.militaryServiceCountry,
      militaryServiceLocal:
        values.militaryServiceLocal !== ""
          ? values.militaryServiceLocal
          : !additionalInformationForm.militaryServiceLocal
          ? ""
          : additionalInformationForm.militaryServiceLocal,
      militaryServicePatent:
        values.militaryServicePatent !== ""
          ? values.militaryServicePatent
          : !additionalInformationForm.militaryServicePatent
          ? ""
          : additionalInformationForm.militaryServicePatent,
      militaryServiceSpecialty:
        values.militaryServiceSpecialty !== ""
          ? values.militaryServiceSpecialty
          : !additionalInformationForm.militaryServiceSpecialty
          ? ""
          : additionalInformationForm.militaryServiceSpecialty,
      militaryServiceStartDate:
        values.militaryServiceStartDate !== undefined
          ? values.militaryServiceStartDate
          : !additionalInformationForm.militaryServiceStartDate
          ? undefined
          : additionalInformationForm.militaryServiceStartDate,
      militaryServiceEndDate:
        values.militaryServiceEndDate !== undefined
          ? values.militaryServiceEndDate
          : !additionalInformationForm.militaryServiceEndDate
          ? undefined
          : additionalInformationForm.militaryServiceEndDate,
      insurgencyOrganizationConfirmation:
        values.insurgencyOrganizationConfirmation ??
        (additionalInformationForm.insurgencyOrganizationConfirmation ? "Sim" : "Não"),
      insurgencyOrganizationDetails:
        values.insurgencyOrganizationDetails !== ""
          ? values.insurgencyOrganizationDetails
          : !additionalInformationForm.insurgencyOrganizationDetails
          ? ""
          : additionalInformationForm.insurgencyOrganizationDetails,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-6">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold mb-6">
          Informações Adicionais
        </h2>

        <div className="w-full flex flex-col gap-12 justify-between flex-grow">
          <div className="w-full flex flex-col">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                name="languages"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 bg-secondary rounded-xl p-4">
                    <FormLabel className="text-foreground">Quais idiomas você fala?</FormLabel>

                    <FormControl>
                      <div className="!mt-auto w-full flex items-center justify-between gap-2">
                        <Input
                          disabled={isPending || isSavePending}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={languageValue}
                          onChange={(event) => setLanguageValue(event.target.value)}
                        />

                        <Button
                          disabled={isPending || isSavePending}
                          type="button"
                          size="xl"
                          className="px-3 shrink-0"
                          onClick={addLanguages}
                        >
                          <Plus />
                        </Button>
                      </div>
                    </FormControl>

                    {languages && (
                      <div className="w-full flex flex-wrap gap-2">
                        {languages.map((language, index) => (
                          <div
                            key={`otherName-${index}`}
                            className="py-2 px-4 bg-border rounded-full flex items-center gap-2 group"
                          >
                            <span className="text-sm font-medium text-foreground">{language}</span>

                            <Button
                              disabled={isPending || isSavePending}
                              type="button"
                              variant="link"
                              size="icon"
                              className="size-5 hidden opacity-0 transition-all group-hover:block group-hover:opacity-100"
                              onClick={() => removeLanguages(index)}
                            >
                              <X strokeWidth={1} size={20} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                name="fiveYearsOtherCountryTravelsConfirmation"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Viajou para outros países?</FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
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

              {/* TODO: adicionar select com os países que viajou */}
              <FormField
                name="fiveYearsOtherCountryTravels"
                control={form.control}
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      "flex flex-col gap-2 bg-secondary rounded-xl p-4",
                      fiveYearsOtherCountryTravelsConfirmation === "Não" && "hidden"
                    )}
                  >
                    <FormLabel className="text-foreground">Forneça uma lista dos países visitados</FormLabel>

                    <Select onValueChange={(value) => setCountryValue(value)} defaultValue={countryValue}>
                      <div className="!mt-auto w-full flex items-center justify-between gap-2">
                        <FormControl>
                          <SelectTrigger className="!mt-auto" disabled={isPending || isSavePending}>
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

                        <Button
                          disabled={isPending || isSavePending}
                          type="button"
                          size="xl"
                          className="px-3 shrink-0"
                          onClick={addCountry}
                        >
                          <Plus />
                        </Button>
                      </div>
                    </Select>

                    {fiveYearsOtherCountryTravels && (
                      <div className="w-full flex flex-wrap gap-2">
                        {fiveYearsOtherCountryTravels.map((country, index) => (
                          <div
                            key={`otherName-${index}`}
                            className="py-2 px-4 bg-primary/50 rounded-full flex items-center gap-2 group"
                          >
                            <span className="text-sm font-medium text-white">{country}</span>

                            <Button
                              disabled={isPending || isSavePending}
                              type="button"
                              variant="link"
                              size="icon"
                              className="size-5 hidden opacity-0 transition-all group-hover:block group-hover:opacity-100"
                              onClick={() => removeCountries(index)}
                            >
                              <X strokeWidth={1} size={20} className="#FFF" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                name="socialOrganizationConfirmation"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Contribui ou faz parte de alguma instituição de caridade ou organização social?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
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
                name="socialOrganization"
                control={form.control}
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      "flex flex-col gap-2 bg-secondary rounded-xl p-4",
                      socialOrganizationConfirmation === "Não" && "hidden"
                    )}
                  >
                    <FormLabel className="text-foreground">Quais organizações você faz parte?</FormLabel>

                    <FormControl>
                      <div className="!mt-auto w-full flex items-center justify-between gap-2">
                        <Input
                          disabled={isPending || isSavePending}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={organizationValue}
                          onChange={(event) => setOrganizationValue(event.target.value)}
                        />

                        <Button
                          disabled={isPending || isSavePending}
                          type="button"
                          size="xl"
                          className="px-3 shrink-0"
                          onClick={addOrganization}
                        >
                          <Plus />
                        </Button>
                      </div>
                    </FormControl>

                    {socialOrganization && (
                      <div className="w-full flex flex-wrap gap-2">
                        {socialOrganization.map((organization, index) => (
                          <div
                            key={`otherName-${index}`}
                            className="py-2 px-4 bg-primary/50 rounded-full flex items-center gap-2 group"
                          >
                            <span className="text-sm font-medium text-white">{organization}</span>

                            <Button
                              disabled={isPending || isSavePending}
                              type="button"
                              variant="link"
                              size="icon"
                              className="size-5 hidden opacity-0 transition-all group-hover:block group-hover:opacity-100"
                              onClick={() => removeOrganizations(index)}
                            >
                              <X strokeWidth={1} size={20} color="#FFF" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                name="weaponTrainingConfirmation"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Você tem treinamento com arma de fogo?</FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
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

            <FormField
              name="weaponTrainingDetails"
              control={form.control}
              render={({ field }) => (
                <FormItem className={cn("flex flex-col gap-2 mb-6", weaponTrainingConfirmation === "Não" && "hidden")}>
                  <FormLabel className="text-foreground">Explique</FormLabel>

                  <FormControl>
                    <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                  </FormControl>

                  <FormMessage className="text-sm text-destructive" />
                </FormItem>
              )}
            />

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                name="militaryServiceConfirmation"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Já prestou serviço militar?</FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
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

            <div
              className={cn(
                "w-full bg-secondary rounded-xl p-4 flex flex-col gap-x-4 gap-y-6 mb-6",
                militaryServiceConfirmation === "Não" && "hidden"
              )}
            >
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6">
                <FormField
                  name="militaryServiceCountry"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-foreground">País que serviu</FormLabel>

                      <FormControl>
                        <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                      </FormControl>

                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  name="militaryServiceLocal"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-foreground">Local que serviu</FormLabel>

                      <FormControl>
                        <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                      </FormControl>

                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  name="militaryServicePatent"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-foreground">Patente</FormLabel>

                      <FormControl>
                        <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                      </FormControl>

                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6">
                <FormField
                  name="militaryServiceSpecialty"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-foreground">Especialidade</FormLabel>

                      <FormControl>
                        <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                      </FormControl>

                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  name="militaryServiceStartDate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-foreground">Data de início</FormLabel>

                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              disabled={isPending || isSavePending}
                              variant="date"
                              className={cn("!mt-auto", !field.value && "text-muted-foreground")}
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

                        <PopoverContent className="w-auto p-0 bg-background" align="start">
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
                              dropdown: "px-2 py-1.5 bg-muted text-primary text-sm focus-visible:outline-none",
                              caption_dropdowns: "flex gap-3",
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

                <FormField
                  name="militaryServiceEndDate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-foreground">Data de término</FormLabel>

                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              disabled={isPending || isSavePending}
                              variant="date"
                              className={cn("!mt-auto", !field.value && "text-muted-foreground")}
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

                        <PopoverContent className="w-auto p-0 bg-background" align="start">
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
                              dropdown: "px-2 py-1.5 bg-muted text-primary text-sm focus-visible:outline-none",
                              caption_dropdowns: "flex gap-3",
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
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                name="insurgencyOrganizationConfirmation"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já serviu, foi membro ou esteve envolvido em uma unidade paramilitar, unidade de vigilantes,
                      grupo rebelde, grupo guerrilheiro ou organização insurgente?
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending || isSavePending}
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

            <FormField
              name="insurgencyOrganizationDetails"
              control={form.control}
              render={({ field }) => (
                <FormItem
                  className={cn("flex flex-col gap-2", insurgencyOrganizationConfirmation === "Não" && "hidden")}
                >
                  <FormLabel className="text-foreground">Explique</FormLabel>

                  <FormControl>
                    <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                  </FormControl>

                  <FormMessage className="text-sm text-destructive" />
                </FormItem>
              )}
            />
          </div>

          <div className="w-full flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-end">
            {isEditing ? (
              <>
                <Button
                  size="xl"
                  variant="outline"
                  type="button"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={isPending || isSavePending}
                  onClick={() => router.push(`/resumo-formulario/${profileId}`)}
                >
                  Cancelar
                </Button>

                <Button
                  size="xl"
                  type="submit"
                  className="w-full flex items-center gap-2 sm:w-fit"
                  disabled={isPending || isSavePending}
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
                  disabled={isPending || isSavePending}
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
                  disabled={isPending || isSavePending}
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
