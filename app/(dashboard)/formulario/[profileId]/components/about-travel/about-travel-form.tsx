"use client";

import { z } from "zod";
import { toast } from "sonner";
import { ChangeEvent, useEffect, useState } from "react";
import { format, getYear, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import isEmail from "validator/lib/isEmail";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Save, Calendar as CalendarIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { FormSectionHelp } from "@/components/form/field-help";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import { FIELD_HELP, SECTION_HELP } from "@/lib/form-field-help";
import useFormStore from "@/constants/stores/useFormStore";
import { AboutTravelFormType } from "@/types";
import { USALocations } from "@/constants";

const formSchema = z
  .object({
    travelItineraryConfirmation: z.enum(["Sim", "Não"]),
    USAPreviewArriveDate: z.string().min(1, { message: "Campo obrigatório" }),
    arriveFlyNumber: z.string(),
    arriveCity: z.string(),
    USAPreviewReturnDate: z.string().optional(),
    returnFlyNumber: z.string(),
    returnCity: z.string(),
    estimatedTimeNumber: z.coerce.number().gt(0, "Campo precisa ter valor maior que zero"),
    estimatedTimeType: z.string().min(1, { message: "Campo obrigatório" }),
    visitLocations: z.string().min(1, { message: "Campo obrigatório" }),
    hasAddressInUSA: z.enum(["Sim", "Não"]),
    USACompleteAddress: z.string(),
    USAZipCode: z.string(),
    USACity: z.string(),
    USAState: z.string(),
    payer: z.string(),
    payerNameOrCompany: z.string(),
    payerTel: z
      .string()
      .trim()
      .refine((value) => value === "" || /^[^a-zA-Z]+$/.test(value), {
        message: "Celular inválido",
      }),
    payerAddress: z.string(),
    payerRelation: z.string(),
    payerEmail: z.string().trim(),
  })
  .superRefine(
    (
      {
        hasAddressInUSA,
        USACompleteAddress,
        USACity,
        USAState,
        payer,
        payerNameOrCompany,
        payerTel,
        payerAddress,
        payerRelation,
        payerEmail,
      },
      ctx
    ) => {
      if (hasAddressInUSA === "Sim" && USACompleteAddress.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["USACompleteAddress"],
        });
      }

      if (hasAddressInUSA === "Sim" && USACity.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["USACity"],
        });
      }

      if (hasAddressInUSA === "Sim" && USAState.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["USAState"],
        });
      }

      if ((payer === "Outra pessoa" || payer === "Outra Empresa") && payerNameOrCompany.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["payerNameOrCompany"],
        });
      }

      if ((payer === "Outra pessoa" || payer === "Outra Empresa") && payerTel.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["payerTel"],
        });
      }

      if ((payer === "Outra pessoa" || payer === "Outra Empresa") && payerAddress.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["payerAddress"],
        });
      }

      if (payer === "Outra pessoa" && payerRelation.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["payerRelation"],
        });
      }

      if ((payer === "Outra pessoa" || payer === "Outra Empresa") && !isEmail(payerEmail)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "E-mail inválido",
          path: ["payerEmail"],
        });
      }

      if ((payer === "Outra pessoa" || payer === "Outra Empresa") && payerEmail.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["payerEmail"],
        });
      }
    }
  );

interface Props {
  aboutTravelForm: AboutTravelFormType;
  profileId: string;
  isEditing: boolean;
}

export function AboutTravelForm({ aboutTravelForm, profileId, isEditing }: Props) {
  const [USAPreviewArriveDateCalendar, setUSAPreviewArriveDateCalendar] = useState<Date | undefined>(undefined);
  const [USAPreviewReturnDateCalendar, setUSAPreviewReturnDateCalendar] = useState<Date | undefined>(undefined);
  const { redirectStep, setRedirectStep } = useFormStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      travelItineraryConfirmation: aboutTravelForm.travelItineraryConfirmation ? "Sim" : "Não",
      USAPreviewArriveDate: aboutTravelForm.USAPreviewArriveDate
        ? format(aboutTravelForm.USAPreviewArriveDate, "dd/MM/yyyy")
        : "",
      arriveFlyNumber: aboutTravelForm.arriveFlyNumber ? aboutTravelForm.arriveFlyNumber : "",
      arriveCity: aboutTravelForm.arriveCity ? aboutTravelForm.arriveCity : "",
      USAPreviewReturnDate: aboutTravelForm.USAPreviewReturnDate
        ? format(aboutTravelForm.USAPreviewReturnDate, "dd/MM/yyyy")
        : "",
      returnFlyNumber: aboutTravelForm.returnFlyNumber ? aboutTravelForm.returnFlyNumber : "",
      returnCity: aboutTravelForm.returnCity ? aboutTravelForm.returnCity : "",
      estimatedTimeNumber: aboutTravelForm.estimatedTimeOnUSA
        ? Number(aboutTravelForm.estimatedTimeOnUSA.split(" ")[0])
        : 0,
      estimatedTimeType: aboutTravelForm.estimatedTimeOnUSA ? aboutTravelForm.estimatedTimeOnUSA.split(" ")[1] : "",
      visitLocations: aboutTravelForm.visitLocations ? aboutTravelForm.visitLocations : "",
      hasAddressInUSA: aboutTravelForm.hasAddressInUSA ? "Sim" : "Não",
      USACompleteAddress: aboutTravelForm.USACompleteAddress ? aboutTravelForm.USACompleteAddress : "",
      USAZipCode: aboutTravelForm.USAZipCode ? aboutTravelForm.USAZipCode : "",
      USACity: aboutTravelForm.USACity ? aboutTravelForm.USACity : "",
      USAState: aboutTravelForm.USAState ? aboutTravelForm.USAState : "",
      payer: aboutTravelForm.payer ? aboutTravelForm.payer : "",
      payerNameOrCompany: aboutTravelForm.payerNameOrCompany ? aboutTravelForm.payerNameOrCompany : "",
      payerTel: aboutTravelForm.payerTel ? aboutTravelForm.payerTel : "",
      payerAddress: aboutTravelForm.payerAddress ? aboutTravelForm.payerAddress : "",
      payerRelation: aboutTravelForm.payerRelation ? aboutTravelForm.payerRelation : "",
      payerEmail: aboutTravelForm.payerEmail ? aboutTravelForm.payerEmail : "",
    },
  });

  const travelItineraryConfirmation = form.watch("travelItineraryConfirmation");
  const hasAddressInUSA = form.watch("hasAddressInUSA");
  const currentYear = getYear(new Date());
  const payer = form.watch("payer");
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutate: submitAboutTravel, isPending } = trpc.formsRouter.submitAboutTravel.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.isEditing) {
        router.push(`/resumo-formulario/${profileId}`);
      } else {
        router.push(`/formulario/${profileId}?formStep=4`);
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
  const { mutate: saveAboutTravel, isPending: isSavePending } = trpc.formsRouter.saveAboutTravel.useMutation({
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
    if (USAPreviewArriveDateCalendar !== undefined) {
      const dateFormatted = format(USAPreviewArriveDateCalendar, "dd/MM/yyyy");

      form.setValue("USAPreviewArriveDate", dateFormatted);
    }
  }, [USAPreviewArriveDateCalendar]);

  useEffect(() => {
    if (USAPreviewReturnDateCalendar !== undefined) {
      const dateFormatted = format(USAPreviewReturnDateCalendar, "dd/MM/yyyy");

      form.setValue("USAPreviewReturnDate", dateFormatted);
    }
  }, [USAPreviewReturnDateCalendar]);

  useEffect(() => {
    if (redirectStep !== null) {
      const values = form.getValues();

      saveAboutTravel({
        profileId,
        redirectStep,
        travelItineraryConfirmation:
          values.travelItineraryConfirmation ?? (aboutTravelForm.travelItineraryConfirmation ? "Sim" : "Não"),
        USAPreviewArriveDate: values.USAPreviewArriveDate
          ? values.USAPreviewArriveDate
          : aboutTravelForm.USAPreviewArriveDate
          ? format(aboutTravelForm.USAPreviewArriveDate, "dd/MM/yyyy")
          : "",
        arriveFlyNumber: values.arriveFlyNumber !== "" ? values.arriveFlyNumber : aboutTravelForm.arriveFlyNumber,
        arriveCity: values.arriveCity !== "" ? values.arriveCity : aboutTravelForm.arriveCity,
        USAPreviewReturnDate: values.USAPreviewReturnDate
          ? format(values.USAPreviewReturnDate, "dd/MM/yyyy")
          : aboutTravelForm.USAPreviewReturnDate
          ? format(aboutTravelForm.USAPreviewReturnDate, "dd/MM/yyyy")
          : "",
        returnFlyNumber: values.returnFlyNumber !== "" ? values.returnFlyNumber : aboutTravelForm.returnFlyNumber,
        returnCity: values.returnCity !== "" ? values.returnCity : aboutTravelForm.returnCity,
        estimatedTimeNumber: values.estimatedTimeNumber
          ? values.estimatedTimeNumber
          : Number(aboutTravelForm.estimatedTimeOnUSA?.split(" ")[0]),
        estimatedTimeType: values.estimatedTimeType
          ? values.estimatedTimeType
          : aboutTravelForm.estimatedTimeOnUSA!.split(" ")[1],
        visitLocations:
          values.visitLocations !== ""
            ? values.visitLocations
            : !aboutTravelForm.visitLocations
            ? ""
            : aboutTravelForm.visitLocations,
        hasAddressInUSA: values.hasAddressInUSA ?? (aboutTravelForm.hasAddressInUSA ? "Sim" : "Não"),
        USACompleteAddress:
          values.USACompleteAddress !== "" ? values.USACompleteAddress : aboutTravelForm.USACompleteAddress,
        USAZipCode: values.USAZipCode !== "" ? values.USAZipCode : aboutTravelForm.USAZipCode,
        USACity: values.USACity !== "" ? values.USACity : aboutTravelForm.USACity,
        USAState: values.USAState !== "" ? values.USAState : aboutTravelForm.USAState,
        payer: values.payer !== "" ? values.payer : aboutTravelForm.payer,
        payerNameOrCompany:
          values.payerNameOrCompany !== "" ? values.payerNameOrCompany : aboutTravelForm.payerNameOrCompany,
        payerTel: values.payerTel !== "" ? values.payerTel : aboutTravelForm.payerTel,
        payerAddress: values.payerAddress !== "" ? values.payerAddress : aboutTravelForm.payerAddress,
        payerRelation: values.payerRelation !== "" ? values.payerRelation : aboutTravelForm.payerRelation,
        payerEmail: values.payerEmail !== "" ? values.payerEmail : aboutTravelForm.payerEmail,
      });
      setRedirectStep(null);
    }
  }, [redirectStep, setRedirectStep, saveAboutTravel, profileId]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitAboutTravel({ ...values, profileId, step: 4, isEditing });
  }

  function onSave() {
    const values = form.getValues();

    saveAboutTravel({
      profileId,
      travelItineraryConfirmation:
        values.travelItineraryConfirmation ?? (aboutTravelForm.travelItineraryConfirmation ? "Sim" : "Não"),
      USAPreviewArriveDate: values.USAPreviewArriveDate
        ? values.USAPreviewArriveDate
        : aboutTravelForm.USAPreviewArriveDate
        ? format(aboutTravelForm.USAPreviewArriveDate, "dd/MM/yyyy")
        : "",
      arriveFlyNumber: values.arriveFlyNumber !== "" ? values.arriveFlyNumber : aboutTravelForm.arriveFlyNumber,
      arriveCity: values.arriveCity !== "" ? values.arriveCity : aboutTravelForm.arriveCity,
      USAPreviewReturnDate: values.USAPreviewReturnDate
        ? format(values.USAPreviewReturnDate, "dd/MM/yyyy")
        : aboutTravelForm.USAPreviewReturnDate
        ? format(aboutTravelForm.USAPreviewReturnDate, "dd/MM/yyyy")
        : "",
      returnFlyNumber: values.returnFlyNumber !== "" ? values.returnFlyNumber : aboutTravelForm.returnFlyNumber,
      returnCity: values.returnCity !== "" ? values.returnCity : aboutTravelForm.returnCity,
      estimatedTimeNumber: values.estimatedTimeNumber
        ? values.estimatedTimeNumber
        : Number(aboutTravelForm.estimatedTimeOnUSA?.split(" ")[0]),
      estimatedTimeType: values.estimatedTimeType
        ? values.estimatedTimeType
        : aboutTravelForm.estimatedTimeOnUSA!.split(" ")[1],
      visitLocations:
        values.visitLocations !== ""
          ? values.visitLocations
          : !aboutTravelForm.visitLocations
          ? ""
          : aboutTravelForm.visitLocations,
      hasAddressInUSA: values.hasAddressInUSA ?? (aboutTravelForm.hasAddressInUSA ? "Sim" : "Não"),
      USACompleteAddress:
        values.USACompleteAddress !== "" ? values.USACompleteAddress : aboutTravelForm.USACompleteAddress,
      USAZipCode: values.USAZipCode !== "" ? values.USAZipCode : aboutTravelForm.USAZipCode,
      USACity: values.USACity !== "" ? values.USACity : aboutTravelForm.USACity,
      USAState: values.USAState !== "" ? values.USAState : aboutTravelForm.USAState,
      payer: values.payer !== "" ? values.payer : aboutTravelForm.payer,
      payerNameOrCompany:
        values.payerNameOrCompany !== "" ? values.payerNameOrCompany : aboutTravelForm.payerNameOrCompany,
      payerTel: values.payerTel !== "" ? values.payerTel : aboutTravelForm.payerTel,
      payerAddress: values.payerAddress !== "" ? values.payerAddress : aboutTravelForm.payerAddress,
      payerRelation: values.payerRelation !== "" ? values.payerRelation : aboutTravelForm.payerRelation,
      payerEmail: values.payerEmail !== "" ? values.payerEmail : aboutTravelForm.payerEmail,
    });
  }

  function formatDate(e: ChangeEvent<HTMLInputElement>) {
    const numbersOnly = e.target.value.replace(/\D/g, "");

    // Limita a 8 dígitos (ddmmaaaa)
    const limitedNumbers = numbersOnly.slice(0, 8);

    // Formata a data com regex
    const formattedDate = limitedNumbers.replace(/^(\d{0,2})(\d{0,2})(\d{0,4})/, (_, d, m, y) => {
      if (!m) return d;
      if (!y) return `${d}/${m}`;
      return `${d}/${m}/${y}`;
    });

    return formattedDate;
  }

  function handleDateBlur(field: "USAPreviewArriveDate" | "USAPreviewReturnDate") {
    const currentDate = form.getValues(field);

    if (currentDate) {
      const [day, month, year] = currentDate.split("/");

      if (!day) {
        form.setError(field, { message: "Data inválida" }, { shouldFocus: true });

        return;
      }

      if (!month) {
        form.setError(field, { message: "Data inválida" }, { shouldFocus: true });

        return;
      }

      if (!year) {
        form.setError(field, { message: "Data inválida" }, { shouldFocus: true });

        return;
      }

      if (
        day.length !== 2 ||
        month.length !== 2 ||
        year.length !== 4 ||
        Number(day) === 0 ||
        Number(month) === 0 ||
        Number(year) === 0
      ) {
        form.setError(field, { message: "Data inválida" }, { shouldFocus: true });

        return;
      } else {
        form.clearErrors(field);
      }

      if (currentDate?.length === 10) {
        const dateFormatted = parse(currentDate, "dd/MM/yyyy", new Date());

        if (!isValid(dateFormatted)) {
          form.setError(field, { message: "Data inválida" }, { shouldFocus: true });

          return;
        }

        if (field === "USAPreviewArriveDate") {
          setUSAPreviewArriveDateCalendar(dateFormatted);
        }

        if (field === "USAPreviewReturnDate") {
          setUSAPreviewReturnDateCalendar(dateFormatted);
        }
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-6">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold mb-6">Sobre a Viagem</h2>

        <FormSectionHelp items={[...SECTION_HELP.travelPlan]} className="mb-6" />

        <div className="w-full flex flex-col gap-12 justify-between flex-grow">
          <div className="w-full flex flex-col">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="travelItineraryConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Possui itinerário de viagem?*</FormLabel>

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

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="USAPreviewArriveDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.travelPlan}>
                      Data prevista da viagem aos EUA*
                    </FormLabel>

                    <FormControl>
                      <div className="w-full relative">
                        <Input
                          {...field}
                          className="pl-14"
                          maxLength={10}
                          placeholder="Insira a data prevista da viagem aos EUA"
                          onChange={(e) => {
                            const formattedDate = formatDate(e);

                            form.setValue("USAPreviewArriveDate", formattedDate);
                          }}
                          onBlur={() => handleDateBlur("USAPreviewArriveDate")}
                        />

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex items-center gap-2 h-12 py-2 absolute left-2 top-1/2 -translate-y-1/2"
                            >
                              <CalendarIcon strokeWidth={1.5} className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                              <div className="h-full w-[2px] bg-secondary" />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-auto p-0 bg-background" align="start">
                            <Calendar
                              mode="single"
                              locale={ptBR}
                              selected={USAPreviewArriveDateCalendar}
                              onSelect={setUSAPreviewArriveDateCalendar}
                              disabled={(date) => date < new Date("1900-01-01")}
                              captionLayout="dropdown"
                              fromYear={1900}
                              toYear={new Date().getFullYear() + 10}
                              month={USAPreviewArriveDateCalendar}
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
                      </div>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arriveFlyNumber"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", travelItineraryConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground" help={FIELD_HELP.flightOnlyIfBought}>
                      Número do voo de chegada
                    </FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={travelItineraryConfirmation === "Não" || isPending || isSavePending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arriveCity"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", travelItineraryConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground">Cidade de chegada</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={travelItineraryConfirmation === "Não" || isPending || isSavePending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6",
                travelItineraryConfirmation === "Não" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="USAPreviewReturnDate"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", travelItineraryConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground">Data prevista de retorno ao Brasil</FormLabel>

                    <FormControl>
                      <div className="w-full relative">
                        <Input
                          {...field}
                          className="pl-14"
                          maxLength={10}
                          placeholder="Insira a data prevista de retorno ao Brasil"
                          onChange={(e) => {
                            const formattedDate = formatDate(e);

                            form.setValue("USAPreviewReturnDate", formattedDate);
                          }}
                          onBlur={() => handleDateBlur("USAPreviewReturnDate")}
                        />

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex items-center gap-2 h-12 py-2 absolute left-2 top-1/2 -translate-y-1/2"
                            >
                              <CalendarIcon strokeWidth={1.5} className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                              <div className="h-full w-[2px] bg-secondary" />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-auto p-0 bg-background" align="start">
                            <Calendar
                              mode="single"
                              locale={ptBR}
                              selected={USAPreviewReturnDateCalendar}
                              onSelect={setUSAPreviewReturnDateCalendar}
                              disabled={(date) => date < new Date("1900-01-01")}
                              captionLayout="dropdown"
                              fromYear={1900}
                              toYear={new Date().getFullYear() + 10}
                              month={USAPreviewReturnDateCalendar}
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
                      </div>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnFlyNumber"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", travelItineraryConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground" help={FIELD_HELP.flightOnlyIfBought}>
                      Número do voo de partida
                    </FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={travelItineraryConfirmation === "Não" || isPending || isSavePending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnCity"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", travelItineraryConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground">Cidade de partida</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={travelItineraryConfirmation === "Não" || isPending || isSavePending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-10">
              <div className="w-full grid grid-cols-[calc(100%-120px-16px)_calc(120px)] gap-x-4 gap-y-6">
                <FormField
                  control={form.control}
                  name="estimatedTimeNumber"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel className="text-foreground" help={FIELD_HELP.travelPlan}>
                        Tempo de permanência estimado nos EUA
                      </FormLabel>

                      <FormControl>
                        <Input
                          type="number"
                          className="!mt-auto"
                          disabled={isPending || isSavePending}
                          onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()}
                          {...field}
                        />
                      </FormControl>

                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />

                {/* TODO: remover label */}
                <FormField
                  control={form.control}
                  name="estimatedTimeType"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger
                            className={cn("!mt-auto", field.value === "" && "[&>span]:text-muted-foreground")}
                          >
                            <SelectValue placeholder="Selecione se vai ser dia/mês/ano" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          <SelectItem value="Dia(s)">Dia(s)</SelectItem>

                          <SelectItem value="Mês(es)">Mês(es)</SelectItem>

                          <SelectItem value="Ano(s)">Ano(s)</SelectItem>
                        </SelectContent>
                      </Select>

                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="visitLocations"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.travelPlan}>
                      Qual estado pretende visitar?
                    </FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          className={cn("!mt-auto", field.value === "" && "[&>span]:text-muted-foreground")}
                        >
                          <SelectValue placeholder="Selecione o estado que pretende visitar" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {USALocations.map((location, index) => (
                          <SelectItem key={`location-${index}`} value={location}>
                            {location}
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
                name="hasAddressInUSA"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.hotelOnlyIfBooked}>
                      Você tem o endereço onde ficará nos EUA?
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

            <div
              className={cn("w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6", {
                hidden: hasAddressInUSA === "Não",
              })}
            >
              <FormField
                control={form.control}
                name="USACompleteAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.hotelOnlyIfBooked}>
                      Endereço completo de onde ficará nos EUA*
                    </FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="USAZipCode"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Zip Code (caso souber)</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} maxLength={5} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-10", {
                hidden: hasAddressInUSA === "Não",
              })}
            >
              <FormField
                control={form.control}
                name="USACity"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Cidade nos EUA*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="USAState"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Estado nos EUA*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="payer"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.tripPayer}>
                      Você pagará pela viagem?
                    </FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="!mt-auto">
                          <SelectValue placeholder="Selecione quem irá pagar a viagem" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="Eu mesmo">Eu mesmo</SelectItem>

                        <SelectItem value="Outra pessoa">Outra pessoa</SelectItem>

                        <SelectItem value="Outra Empresa">Outra Empresa</SelectItem>

                        <SelectItem value="Empregador">Empregador</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6", {
                hidden: payer === "Eu mesmo" || payer === "Empregador" || payer === "",
                "sm:grid-cols-2": payer !== "Outra pessoa",
              })}
            >
              {/* TODO: adicionar campo Empregador (não precisa abrir nenhum campo) */}
              <FormField
                control={form.control}
                name="payerNameOrCompany"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      {payer === "Outra pessoa"
                        ? "Nome de quem pagará a viagem*"
                        : payer === "Outra Empresa"
                        ? "Empresa que pagará a viagem*"
                        : "Nome ou Empresa que pagará a viagem*"}
                    </FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payerTel"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Telefone Residencial*</FormLabel>

                    <FormControl>
                      <Input
                        disabled={isPending || isSavePending}
                        placeholder="Insira o telefone residencial..."
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payerRelation"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", payer !== "Outra pessoa" && "hidden")}>
                    <FormLabel className="text-foreground">Relação com o Solicitante*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6", {
                hidden: payer === "Eu mesmo" || payer === "Empregador" || payer === "",
              })}
            >
              <FormField
                control={form.control}
                name="payerAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Endereço completo*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payerEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">E-mail*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
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
