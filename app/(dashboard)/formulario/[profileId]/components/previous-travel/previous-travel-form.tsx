"use client";

import { z } from "zod";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { format, getYear } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Form as FormType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Plus, Save, X, CalendarIcon } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import useFormStore from "@/constants/stores/useFormStore";
import { PreviousTravelFormType } from "@/types";

const formSchema = z
  .object({
    hasBeenOnUSAConfirmation: z.enum(["Sim", "Não"]),
    USALastTravel: z.array(z.object({ arriveDate: z.date().optional(), estimatedTime: z.string() })),
    americanLicenseToDriveConfirmation: z.enum(["Sim", "Não"]),
    americanLicense: z.object({
      licenseNumber: z.string(),
      state: z.string(),
    }),
    USAVisaConfirmation: z.enum(["Sim", "Não"]),
    visaIssuingDate: z.date({ message: "Campo obrigatório" }).optional(),
    visaNumber: z.string(),
    newVisaConfirmation: z.enum(["Sim", "Não"]),
    sameCountryResidenceConfirmation: z.enum(["Sim", "Não"]),
    sameVisaTypeConfirmation: z.enum(["Sim", "Não"]),
    fingerprintsProvidedConfirmation: z.enum(["Sim", "Não"]),
    lostVisaConfirmation: z.enum(["Sim", "Não"]),
    lostVisaDetails: z.string(),
    canceledVisaConfirmation: z.enum(["Sim", "Não"]),
    canceledVisaDetails: z.string(),
    deniedVisaConfirmation: z.enum(["Sim", "Não"]),
    deniedVisaDetails: z.string(),
    consularPost: z.string(),
    deniedVisaType: z.string(),
    immigrationRequestByAnotherPersonConfirmation: z.enum(["Sim", "Não"]),
    immigrationRequestByAnotherPersonDetails: z.string(),
  })
  .superRefine(
    (
      {
        hasBeenOnUSAConfirmation,
        USALastTravel,
        americanLicenseToDriveConfirmation,
        americanLicense,
        USAVisaConfirmation,
        visaIssuingDate,
        visaNumber,
        lostVisaConfirmation,
        lostVisaDetails,
        canceledVisaConfirmation,
        canceledVisaDetails,
        deniedVisaConfirmation,
        deniedVisaDetails,
        immigrationRequestByAnotherPersonConfirmation,
        immigrationRequestByAnotherPersonDetails,
      },
      ctx
    ) => {
      if (
        hasBeenOnUSAConfirmation === "Sim" &&
        USALastTravel.length === 1 &&
        USALastTravel.filter((item) => item.arriveDate === undefined).length === 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: [`USALastTravel.${USALastTravel.length - 1}.arriveDate`],
        });
      }

      if (
        hasBeenOnUSAConfirmation === "Sim" &&
        USALastTravel.length === 1 &&
        USALastTravel.filter((item) => item.estimatedTime === "").length === 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: [`USALastTravel.${USALastTravel.length - 1}.estimatedTime`],
        });
      }

      if (americanLicenseToDriveConfirmation === "Sim" && americanLicense.licenseNumber === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["americanLicense.licenseNumber"],
        });
      }

      if (americanLicenseToDriveConfirmation === "Sim" && americanLicense.state === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["americanLicense.state"],
        });
      }

      if (USAVisaConfirmation === "Sim" && visaIssuingDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["visaIssuingDate"],
        });
      }

      if (USAVisaConfirmation === "Sim" && visaNumber.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["visaNumber"],
        });
      }

      if (lostVisaConfirmation === "Sim" && lostVisaDetails.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["lostVisaDetails"],
        });
      }

      if (canceledVisaConfirmation === "Sim" && canceledVisaDetails.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["canceledVisaDetails"],
        });
      }

      if (deniedVisaConfirmation === "Sim" && deniedVisaDetails.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["deniedVisaDetails"],
        });
      }

      if (
        immigrationRequestByAnotherPersonConfirmation === "Sim" &&
        immigrationRequestByAnotherPersonDetails.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["immigrationRequestByAnotherPersonDetails"],
        });
      }
    }
  );

interface Props {
  profileId: string;
  previousTravelForm: PreviousTravelFormType;
  isEditing: boolean;
}

export function PreviousTravelForm({ previousTravelForm, profileId, isEditing }: Props) {
  const [currentUSALastTravelIndex, setCurrentUSALastTravelIndex] = useState(
    previousTravelForm.USALastTravel.length ?? 0
  );
  const [resetUSALastTravelFields, setResetUSALastTravelFields] = useState<boolean>(false);

  const { redirectStep, setRedirectStep } = useFormStore();

  const currentYear = getYear(new Date());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasBeenOnUSAConfirmation: previousTravelForm.hasBeenOnUSAConfirmation ? "Sim" : "Não",
      USALastTravel:
        previousTravelForm.USALastTravel.length > 0
          ? [
              ...previousTravelForm.USALastTravel.map((item) => ({
                ...item,
                arriveDate: item.arriveDate ? new Date(item.arriveDate) : undefined,
              })),
              { arriveDate: undefined, estimatedTime: "" },
            ]
          : [{ arriveDate: undefined, estimatedTime: "" }],
      americanLicenseToDriveConfirmation: previousTravelForm.americanLicenseToDriveConfirmation ? "Sim" : "Não",
      americanLicense: previousTravelForm.americanLicense
        ? previousTravelForm.americanLicense
        : { licenseNumber: "", state: "" },
      USAVisaConfirmation: previousTravelForm.USAVisaConfirmation ? "Sim" : "Não",
      visaIssuingDate: previousTravelForm.visaIssuingDate ? previousTravelForm.visaIssuingDate : undefined,
      visaNumber: previousTravelForm.visaNumber ? previousTravelForm.visaNumber : "",
      newVisaConfirmation: previousTravelForm.newVisaConfirmation ? "Sim" : "Não",
      sameCountryResidenceConfirmation: previousTravelForm.sameCountryResidenceConfirmation ? "Sim" : "Não",
      sameVisaTypeConfirmation: previousTravelForm.sameVisaTypeConfirmation ? "Sim" : "Não",
      fingerprintsProvidedConfirmation: previousTravelForm.fingerprintsProvidedConfirmation ? "Sim" : "Não",
      lostVisaConfirmation: previousTravelForm.lostVisaConfirmation ? "Sim" : "Não",
      lostVisaDetails: previousTravelForm.lostVisaDetails ? previousTravelForm.lostVisaDetails : "",
      canceledVisaConfirmation: previousTravelForm.canceledVisaConfirmation ? "Sim" : "Não",
      canceledVisaDetails: previousTravelForm.canceledVisaDetails ? previousTravelForm.canceledVisaDetails : "",
      deniedVisaConfirmation: previousTravelForm.deniedVisaConfirmation ? "Sim" : "Não",
      deniedVisaDetails: previousTravelForm.deniedVisaDetails ? previousTravelForm.deniedVisaDetails : "",
      consularPost: previousTravelForm.consularPost ? previousTravelForm.consularPost : "",
      deniedVisaType: previousTravelForm.deniedVisaType ? previousTravelForm.deniedVisaType : "",
      immigrationRequestByAnotherPersonConfirmation: previousTravelForm.immigrationRequestByAnotherPersonConfirmation
        ? "Sim"
        : "Não",
      immigrationRequestByAnotherPersonDetails: previousTravelForm.immigrationRequestByAnotherPersonDetails
        ? previousTravelForm.immigrationRequestByAnotherPersonDetails
        : "",
    },
  });

  const hasBeenOnUSAConfirmation = form.watch("hasBeenOnUSAConfirmation");
  const USALastTravel = form.watch("USALastTravel");
  const americanLicenseToDriveConfirmation = form.watch("americanLicenseToDriveConfirmation");
  const USAVisaConfirmation = form.watch("USAVisaConfirmation");
  const lostVisaConfirmation = form.watch("lostVisaConfirmation");
  const canceledVisaConfirmation = form.watch("canceledVisaConfirmation");
  const deniedVisaConfirmation = form.watch("deniedVisaConfirmation");
  const immigrationRequestByAnotherPersonConfirmation = form.watch("immigrationRequestByAnotherPersonConfirmation");
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutate: submitPreviousTravel, isPending } = trpc.formsRouter.submitPreviousTravel.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.isEditing) {
        router.push(`/resumo-formulario/${profileId}`);
      } else {
        router.push(`/formulario/${profileId}?formStep=6`);
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
  const { mutate: savePreviousTravel, isPending: isSavePending } = trpc.formsRouter.savePreviousTravel.useMutation({
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
    if (previousTravelForm.USALastTravel.length > 0) {
      setCurrentUSALastTravelIndex(previousTravelForm.USALastTravel.length);
    }
  }, [previousTravelForm]);

  useEffect(() => {
    form.setValue(
      `USALastTravel.${currentUSALastTravelIndex}.arriveDate`,
      USALastTravel[currentUSALastTravelIndex].arriveDate
    );
    form.setValue(
      `USALastTravel.${currentUSALastTravelIndex}.estimatedTime`,
      USALastTravel[currentUSALastTravelIndex].estimatedTime
    );
  }, [currentUSALastTravelIndex]);

  useEffect(() => {
    if (resetUSALastTravelFields) {
      form.setValue(`USALastTravel.${currentUSALastTravelIndex}.arriveDate`, undefined);
      form.setValue(`USALastTravel.${currentUSALastTravelIndex}.estimatedTime`, "");

      setResetUSALastTravelFields(false);
    }
  }, [resetUSALastTravelFields]);

  useEffect(() => {
    if (redirectStep !== null) {
      const values = form.getValues();
      const USALastTravelFormatted = USALastTravel.map((travel) => ({
        ...travel,
        arriveDate: travel.arriveDate ?? null,
      }));

      savePreviousTravel({
        profileId,
        redirectStep,
        hasBeenOnUSAConfirmation:
          values.hasBeenOnUSAConfirmation ?? (previousTravelForm.hasBeenOnUSAConfirmation ? "Sim" : "Não"),
        USALastTravel: USALastTravelFormatted,
        americanLicenseToDriveConfirmation:
          values.americanLicenseToDriveConfirmation ??
          (previousTravelForm.americanLicenseToDriveConfirmation ? "Sim" : "Não"),
        americanLicense: values.americanLicense
          ? values.americanLicense
          : !previousTravelForm.americanLicense
          ? { licenseNumber: "", state: "" }
          : previousTravelForm.americanLicense,
        USAVisaConfirmation: values.USAVisaConfirmation ?? (previousTravelForm.USAVisaConfirmation ? "Sim" : "Não"),
        visaIssuingDate:
          values.visaIssuingDate !== undefined
            ? values.visaIssuingDate
            : !previousTravelForm.visaIssuingDate
            ? undefined
            : previousTravelForm.visaIssuingDate,
        visaNumber:
          values.visaNumber !== ""
            ? values.visaNumber
            : !previousTravelForm.visaNumber
            ? ""
            : previousTravelForm.visaNumber,
        newVisaConfirmation: values.newVisaConfirmation ?? (previousTravelForm.newVisaConfirmation ? "Sim" : "Não"),
        sameCountryResidenceConfirmation:
          values.sameCountryResidenceConfirmation ??
          (previousTravelForm.sameCountryResidenceConfirmation ? "Sim" : "Não"),
        sameVisaTypeConfirmation:
          values.sameVisaTypeConfirmation ?? (previousTravelForm.sameVisaTypeConfirmation ? "Sim" : "Não"),
        fingerprintsProvidedConfirmation:
          values.fingerprintsProvidedConfirmation ??
          (previousTravelForm.fingerprintsProvidedConfirmation ? "Sim" : "Não"),
        lostVisaConfirmation: values.lostVisaConfirmation ?? (previousTravelForm.lostVisaConfirmation ? "Sim" : "Não"),
        lostVisaDetails:
          values.lostVisaDetails !== ""
            ? values.lostVisaDetails
            : !previousTravelForm.lostVisaDetails
            ? ""
            : previousTravelForm.lostVisaDetails,
        canceledVisaConfirmation:
          values.canceledVisaConfirmation ?? (previousTravelForm.canceledVisaConfirmation ? "Sim" : "Não"),
        canceledVisaDetails:
          values.canceledVisaDetails !== ""
            ? values.canceledVisaDetails
            : !previousTravelForm.canceledVisaDetails
            ? ""
            : previousTravelForm.canceledVisaDetails,
        deniedVisaConfirmation:
          values.deniedVisaConfirmation ?? (previousTravelForm.deniedVisaConfirmation ? "Sim" : "Não"),
        deniedVisaDetails:
          values.deniedVisaDetails !== ""
            ? values.deniedVisaDetails
            : !previousTravelForm.deniedVisaDetails
            ? ""
            : previousTravelForm.deniedVisaDetails,
        consularPost:
          values.consularPost !== ""
            ? values.consularPost
            : !previousTravelForm.consularPost
            ? ""
            : previousTravelForm.consularPost,
        deniedVisaType:
          values.deniedVisaType !== ""
            ? values.deniedVisaType
            : !previousTravelForm.deniedVisaType
            ? ""
            : previousTravelForm.deniedVisaType,
        immigrationRequestByAnotherPersonConfirmation:
          values.immigrationRequestByAnotherPersonConfirmation ??
          (previousTravelForm.immigrationRequestByAnotherPersonConfirmation ? "Sim" : "Não"),
        immigrationRequestByAnotherPersonDetails:
          values.immigrationRequestByAnotherPersonDetails !== ""
            ? values.immigrationRequestByAnotherPersonDetails
            : !previousTravelForm.immigrationRequestByAnotherPersonDetails
            ? ""
            : previousTravelForm.immigrationRequestByAnotherPersonDetails,
      });
      setRedirectStep(null);
    }
  }, [redirectStep, setRedirectStep, savePreviousTravel, profileId]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const USALastTravelFormatted: { arriveDate: Date; estimatedTime: string }[] = USALastTravel.filter(
      (travel): travel is { arriveDate: Date; estimatedTime: string } =>
        (travel.arriveDate !== undefined || travel.estimatedTime !== "") && travel.arriveDate instanceof Date
    );

    submitPreviousTravel({
      ...values,
      USALastTravel: USALastTravelFormatted,
      profileId,
      step: 6,
      isEditing,
    });
  }

  function onSave() {
    const values = form.getValues();
    const USALastTravelFormatted = USALastTravel.map((travel) => ({
      ...travel,
      arriveDate: travel.arriveDate ?? null,
    }));

    savePreviousTravel({
      profileId,
      hasBeenOnUSAConfirmation:
        values.hasBeenOnUSAConfirmation ?? (previousTravelForm.hasBeenOnUSAConfirmation ? "Sim" : "Não"),
      USALastTravel: USALastTravelFormatted,
      americanLicenseToDriveConfirmation:
        values.americanLicenseToDriveConfirmation ??
        (previousTravelForm.americanLicenseToDriveConfirmation ? "Sim" : "Não"),
      americanLicense: values.americanLicense
        ? values.americanLicense
        : !previousTravelForm.americanLicense
        ? { licenseNumber: "", state: "" }
        : previousTravelForm.americanLicense,
      USAVisaConfirmation: values.USAVisaConfirmation ?? (previousTravelForm.USAVisaConfirmation ? "Sim" : "Não"),
      visaIssuingDate:
        values.visaIssuingDate !== undefined
          ? values.visaIssuingDate
          : !previousTravelForm.visaIssuingDate
          ? undefined
          : previousTravelForm.visaIssuingDate,
      visaNumber:
        values.visaNumber !== ""
          ? values.visaNumber
          : !previousTravelForm.visaNumber
          ? ""
          : previousTravelForm.visaNumber,
      newVisaConfirmation: values.newVisaConfirmation ?? (previousTravelForm.newVisaConfirmation ? "Sim" : "Não"),
      sameCountryResidenceConfirmation:
        values.sameCountryResidenceConfirmation ??
        (previousTravelForm.sameCountryResidenceConfirmation ? "Sim" : "Não"),
      sameVisaTypeConfirmation:
        values.sameVisaTypeConfirmation ?? (previousTravelForm.sameVisaTypeConfirmation ? "Sim" : "Não"),
      fingerprintsProvidedConfirmation:
        values.fingerprintsProvidedConfirmation ??
        (previousTravelForm.fingerprintsProvidedConfirmation ? "Sim" : "Não"),
      lostVisaConfirmation: values.lostVisaConfirmation ?? (previousTravelForm.lostVisaConfirmation ? "Sim" : "Não"),
      lostVisaDetails:
        values.lostVisaDetails !== ""
          ? values.lostVisaDetails
          : !previousTravelForm.lostVisaDetails
          ? ""
          : previousTravelForm.lostVisaDetails,
      canceledVisaConfirmation:
        values.canceledVisaConfirmation ?? (previousTravelForm.canceledVisaConfirmation ? "Sim" : "Não"),
      canceledVisaDetails:
        values.canceledVisaDetails !== ""
          ? values.canceledVisaDetails
          : !previousTravelForm.canceledVisaDetails
          ? ""
          : previousTravelForm.canceledVisaDetails,
      deniedVisaConfirmation:
        values.deniedVisaConfirmation ?? (previousTravelForm.deniedVisaConfirmation ? "Sim" : "Não"),
      deniedVisaDetails:
        values.deniedVisaDetails !== ""
          ? values.deniedVisaDetails
          : !previousTravelForm.deniedVisaDetails
          ? ""
          : previousTravelForm.deniedVisaDetails,
      consularPost:
        values.consularPost !== ""
          ? values.consularPost
          : !previousTravelForm.consularPost
          ? ""
          : previousTravelForm.consularPost,
      deniedVisaType:
        values.deniedVisaType !== ""
          ? values.deniedVisaType
          : !previousTravelForm.deniedVisaType
          ? ""
          : previousTravelForm.deniedVisaType,
      immigrationRequestByAnotherPersonConfirmation:
        values.immigrationRequestByAnotherPersonConfirmation ??
        (previousTravelForm.immigrationRequestByAnotherPersonConfirmation ? "Sim" : "Não"),
      immigrationRequestByAnotherPersonDetails:
        values.immigrationRequestByAnotherPersonDetails !== ""
          ? values.immigrationRequestByAnotherPersonDetails
          : !previousTravelForm.immigrationRequestByAnotherPersonDetails
          ? ""
          : previousTravelForm.immigrationRequestByAnotherPersonDetails,
    });
  }

  function addUSALastTravel() {
    form
      .trigger(
        [
          `USALastTravel.${currentUSALastTravelIndex}.arriveDate`,
          `USALastTravel.${currentUSALastTravelIndex}.estimatedTime`,
        ],
        { shouldFocus: true }
      )
      .then(() => {
        if (Object.keys(form.formState.errors).length === 0) {
          form.setValue("USALastTravel", [
            ...USALastTravel,
            {
              arriveDate: undefined,
              estimatedTime: "",
            },
          ]);

          setCurrentUSALastTravelIndex((prev) => prev + 1);
          setResetUSALastTravelFields(true);
        }
      });
  }

  function removeUSALastTravel(index: number) {
    const USALastTravelFiltered = USALastTravel.filter((_, i) => i !== index);

    form.setValue("USALastTravel", USALastTravelFiltered);

    setCurrentUSALastTravelIndex((prev) => prev - 1);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-6">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold mb-6">
          Viagens Anteriores
        </h2>

        <div className="w-full flex flex-col gap-12 justify-between flex-grow">
          <div className="w-full flex flex-col">
            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="hasBeenOnUSAConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Você já foi para os EUA?</FormLabel>

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

              <div
                className={cn(
                  "w-full bg-secondary rounded-xl p-4 space-y-6",
                  hasBeenOnUSAConfirmation === "Não" && "hidden"
                )}
              >
                <div className="w-full flex flex-col gap-2">
                  <span className="text-base text-foreground font-medium">
                    Informe as datas das suas últimas 5 viagens aos EUA (data de entrada) e tempo de permanência
                  </span>

                  <div className="w-full flex flex-col lg:flex-row gap-4">
                    <FormField
                      control={form.control}
                      name={`USALastTravel.${currentUSALastTravelIndex}.arriveDate`}
                      render={({ field }) => (
                        <FormItem className="w-full flex flex-col gap-2">
                          <FormLabel className="text-foreground">Data de chegada aos EUA</FormLabel>

                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  disabled={isPending || isSavePending}
                                  variant="date"
                                  className={cn("!mt-auto", !field.value && "text-muted-foreground")}
                                >
                                  <CalendarIcon
                                    strokeWidth={1.5}
                                    className="h-5 w-5 text-muted-foreground flex-shrink-0"
                                  />

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
                                disabled={(date) => date < new Date("1900-01-01")}
                                captionLayout="dropdown"
                                fromYear={1900}
                                toYear={2100}
                                classNames={{
                                  day_hidden: "invisible",
                                  dropdown: "px-2 py-1.5 bg-[#2E3675]/80 text-white text-sm focus-visible:outline-none",
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

                    <div className="w-full flex flex-col gap-4 lg:flex-row lg:gap-2">
                      <FormField
                        control={form.control}
                        name={`USALastTravel.${currentUSALastTravelIndex}.estimatedTime`}
                        render={({ field }) => (
                          <FormItem className="w-full flex flex-col gap-2">
                            <FormLabel className="text-foreground">Tempo de permanência nos EUA</FormLabel>

                            <FormControl>
                              <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                            </FormControl>

                            <FormMessage className="text-sm text-destructive" />
                          </FormItem>
                        )}
                      />

                      <Button
                        disabled={isPending || isSavePending}
                        type="button"
                        size="xl"
                        className="px-3 shrink-0 lg:mt-[32px]"
                        onClick={addUSALastTravel}
                      >
                        <Plus />
                      </Button>
                    </div>
                  </div>
                </div>

                {USALastTravel.length > 0 && (
                  <div className="w-full flex flex-col sm:flex-row sm:flex-wrap gap-2">
                    {USALastTravel.map((item, index) => (
                      <div
                        key={`otherName-${index}`}
                        className={cn(
                          "w-full py-2 px-4 bg-primary/50 hover:bg-primary/75 rounded-xl flex items-center gap-2 group sm:w-fit",
                          {
                            "bg-primary hover:bg-primary": currentUSALastTravelIndex === index,
                          }
                        )}
                      >
                        <div
                          onClick={() => setCurrentUSALastTravelIndex(index)}
                          className="w-full flex flex-col items-center gap-2 cursor-pointer"
                        >
                          <span className="text-sm font-medium text-white">
                            {item.arriveDate ? `Data: ${format(item.arriveDate!, "dd/MM/yyyy")}` : "(Não preenchido)"}
                          </span>

                          {item.estimatedTime && (
                            <>
                              <div className="w-full h-px bg-primary" />

                              <span className="text-sm font-medium text-white line-clamp-1">
                                Estimado:{" "}
                                {item.estimatedTime.length > 7
                                  ? `${item.estimatedTime.slice(0, 7)}...`
                                  : item.estimatedTime}
                              </span>
                            </>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="link"
                          size="icon"
                          className="size-5 hidden opacity-0 transition-all group-hover:block group-hover:opacity-100"
                          disabled={isPending || isSavePending}
                          onClick={() => removeUSALastTravel(index)}
                        >
                          <X strokeWidth={1} size={20} color="#FFF" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6",
                hasBeenOnUSAConfirmation === "Não" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="americanLicenseToDriveConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Já obteve uma licença americana para dirigir nos EUA?
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
                control={form.control}
                name="americanLicense.licenseNumber"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2", americanLicenseToDriveConfirmation === "Não" && "hidden")}
                  >
                    <FormLabel className="text-foreground">Número da licença</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="americanLicense.state"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2", americanLicenseToDriveConfirmation === "Não" && "hidden")}
                  >
                    <FormLabel className="text-foreground">Estado</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="USAVisaConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Você já teve um visto americano?</FormLabel>

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
                control={form.control}
                name="visaIssuingDate"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", USAVisaConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground">Data exata de Emissão</FormLabel>

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
                            dropdown: "px-2 py-1.5 bg-[#2E3675]/80 text-white text-sm focus-visible:outline-none",
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
                control={form.control}
                name="visaNumber"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", USAVisaConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground text-sm">
                      Nº do último visto (está em vermelho do lado direito inferior do selo do visto)
                    </FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={USAVisaConfirmation === "Não" || isPending || isSavePending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="newVisaConfirmation"
              render={({ field }) => (
                <FormItem className={cn("mb-4 sm:mb-6 flex flex-col gap-2", USAVisaConfirmation === "Não" && "hidden")}>
                  <FormLabel className="text-foreground">
                    Está solicitando o novo visto do mesmo País ou localização daquele concedido previamente?
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
              control={form.control}
              name="sameCountryResidenceConfirmation"
              render={({ field }) => (
                <FormItem className={cn("mb-4 sm:mb-6 flex flex-col gap-2", USAVisaConfirmation === "Não" && "hidden")}>
                  <FormLabel className="text-foreground">
                    Este País é o mesmo onde está localizada sua residência principal?
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
              control={form.control}
              name="sameVisaTypeConfirmation"
              render={({ field }) => (
                <FormItem className={cn("mb-4 sm:mb-6 flex flex-col gap-2", USAVisaConfirmation === "Não" && "hidden")}>
                  <FormLabel className="text-foreground">
                    Está solicitando o mesmo tipo de visto concedido anteriormente?
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
              control={form.control}
              name="fingerprintsProvidedConfirmation"
              render={({ field }) => (
                <FormItem className={cn("mb-4 sm:mb-6 flex flex-col gap-2", USAVisaConfirmation === "Não" && "hidden")}>
                  <FormLabel className="text-foreground">Forneceu digitais dos 10 dedos</FormLabel>

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

            <div
              className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", USAVisaConfirmation === "Não" && "hidden")}
            >
              <FormField
                control={form.control}
                name="lostVisaConfirmation"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", USAVisaConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground">Já teve um visto perdido ou roubado?</FormLabel>

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

              {USAVisaConfirmation === "Sim" && lostVisaConfirmation === "Sim" && (
                <FormField
                  control={form.control}
                  name="lostVisaDetails"
                  render={({ field }) => (
                    <FormItem className="w-full bg-secondary rounded-xl p-4 flex flex-col gap-2">
                      <FormLabel className="text-foreground text-sm">Em qual ano? Explique o ocorrido</FormLabel>

                      <FormControl>
                        <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                      </FormControl>

                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div
              className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6", USAVisaConfirmation === "Não" && "hidden")}
            >
              <FormField
                control={form.control}
                name="canceledVisaConfirmation"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2", USAVisaConfirmation === "Não" && "hidden")}>
                    <FormLabel className="text-foreground">Já teve um visto revogado ou cancelado?</FormLabel>

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

              {USAVisaConfirmation === "Sim" && canceledVisaConfirmation === "Sim" && (
                <FormField
                  control={form.control}
                  name="canceledVisaDetails"
                  render={({ field }) => (
                    <FormItem className="w-full flex flex-col gap-2 bg-secondary rounded-xl p-4">
                      <FormLabel className="text-foreground text-sm">Em qual ano? Explique o ocorrido</FormLabel>

                      <FormControl>
                        <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                      </FormControl>

                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="immigrationRequestByAnotherPersonConfirmation"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2")}>
                    <FormLabel className="text-foreground">
                      Alguém já solicitou alguma petição de imigração em seu nome perante o Departamento de Imigração
                      dos Estados Unidos?
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

              {immigrationRequestByAnotherPersonConfirmation === "Sim" && (
                <FormField
                  control={form.control}
                  name="immigrationRequestByAnotherPersonDetails"
                  render={({ field }) => (
                    <FormItem className="w-full flex flex-col gap-2 bg-secondary rounded-xl p-4">
                      <FormLabel className="text-foreground">Explique o motivo</FormLabel>

                      <FormControl>
                        <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
                      </FormControl>

                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="deniedVisaConfirmation"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-2")}>
                    <FormLabel className="text-foreground">Já teve um visto negado?</FormLabel>

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

              {deniedVisaConfirmation === "Sim" && (
                <div className="w-full flex flex-col gap-4 bg-secondary rounded-xl p-4">
                  <div className="w-full grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="deniedVisaDetails"
                      render={({ field }) => (
                        <FormItem className="w-full flex flex-col gap-2">
                          <FormLabel className="text-foreground">Em qual ano? Explique o ocorrido</FormLabel>

                          <FormControl>
                            <Textarea
                              disabled={isPending || isSavePending}
                              className="!mt-auto resize-none"
                              {...field}
                            />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="consularPost"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Qual posto consular do Brasil?</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deniedVisaType"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Categoria/tipo de visto negado</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
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
