"use client";

import {
  ArrowRight,
  CircleDollarSign,
  Loader2,
  Plus,
  Save,
  X,
  Calendar as CalendarIcon,
  Edit,
  Trash,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { format, getYear } from "date-fns";
import { useRouter } from "next/navigation";
import { Form as FormType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import CurrencyInput from "react-currency-input-field";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionTrigger, AccordionItem } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

import { FormSectionHelp } from "@/components/form/field-help";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import { FIELD_HELP, SECTION_HELP } from "@/lib/form-field-help";
import useFormStore from "@/constants/stores/useFormStore";
import { WorkEducationFormType } from "@/types";

const formSchema = z
  .object({
    occupation: z.string(),
    office: z.string(),
    companyOrBossName: z.string(),
    companyAddress: z.string(),
    companyCity: z.string(),
    companyState: z.string(),
    companyCountry: z.string(),
    companyCep: z.string(),
    companyTel: z
      .string()
      .trim()
      .refine((value) => value === "" || /^[^a-zA-Z]+$/.test(value), {
        message: "Celular inválido",
      }),
    admissionDate: z.date({ message: "Campo obrigatório" }).optional(),
    monthlySalary: z.string(),
    retireeDate: z.date({ message: "Campo obrigatório" }).optional(),
    jobDetails: z.string(),
    previousJobConfirmation: z.enum(["Sim", "Não"]),
    previousJobs: z.array(
      z.object({
        companyName: z.string(),
        companyAddress: z.string(),
        companyCity: z.string(),
        companyState: z.string(),
        companyCountry: z.string(),
        companyCep: z.string(),
        companyTel: z
          .string()
          .trim()
          .refine((value) => value === "" || /^[^a-zA-Z]+$/.test(value), {
            message: "Celular inválido",
          }),
        office: z.string(),
        supervisorName: z.string(),
        admissionDate: z.date({ message: "Data inválida" }).optional(),
        resignationDate: z.date({ message: "Data inválida" }).optional(),
        jobDescription: z.string(),
      })
    ),
    courses: z.array(
      z.object({
        institutionName: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        country: z.string(),
        cep: z.string(),
        courseName: z.string(),
        initialDate: z.date({ message: "Data inválida" }).optional(),
        finishDate: z.date({ message: "Data inválida" }).optional(),
      })
    ),
  })
  .superRefine(({ occupation, admissionDate, previousJobConfirmation, previousJobs, courses }, ctx) => {
    if (
      (occupation === "Empresário/Proprietário" ||
        occupation === "Estudante" ||
        occupation === "Contratado (CLT/PJ)" ||
        occupation === "Autônomo" ||
        occupation === "Outro") &&
      !admissionDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Campo obrigatório",
        path: ["admissionDate"],
      });
    }

    for (let i = 0; i < previousJobs.length; i++) {
      console.log(previousJobs[i]);

      if (previousJobConfirmation === "Sim" && previousJobs[i].companyCity === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`previousJobs.${i}.companyCity`],
        });
      }

      if (previousJobConfirmation === "Sim" && previousJobs[i].companyAddress === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`previousJobs.${i}.companyAddress`],
        });
      }

      if (previousJobConfirmation === "Sim" && previousJobs[i].companyName === "") {
        console.log("Company name is empty");

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`previousJobs.${i}.companyName`],
        });
      }

      if (previousJobConfirmation === "Sim" && previousJobs[i].companyState === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`previousJobs.${i}.companyState`],
        });
      }

      if (previousJobConfirmation === "Sim" && previousJobs[i].jobDescription === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`previousJobs.${i}.jobDescription`],
        });
      }

      if (previousJobConfirmation === "Sim" && previousJobs[i].companyCountry === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`previousJobs.${i}.companyCountry`],
        });
      }

      if (previousJobConfirmation === "Sim" && previousJobs[i].office === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`previousJobs.${i}.office`],
        });
      }

      if (previousJobConfirmation === "Sim" && previousJobs[i].admissionDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`previousJobs.${i}.admissionDate`],
        });
      }

      if (previousJobConfirmation === "Sim" && previousJobs[i].resignationDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`previousJobs.${i}.resignationDate`],
        });
      }
    }

    for (let i = 0; i < courses.length; i++) {
      if (courses[i].institutionName === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`courses.${i}.institutionName`],
        });
      }

      if (courses[i].city === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`courses.${i}.city`],
        });
      }

      if (courses[i].state === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`courses.${i}.state`],
        });
      }

      if (courses[i].country === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`courses.${i}.country`],
        });
      }

      if (courses[i].courseName === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`courses.${i}.courseName`],
        });
      }

      if (courses[i].initialDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`courses.${i}.initialDate`],
        });
      }

      if (courses[i].finishDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo obrigatório",
          path: [`courses.${i}.finishDate`],
        });
      }
    }
  });

interface Props {
  workEducationForm: WorkEducationFormType;
  profileId: string;
  isEditing: boolean;
}

export function WorkEducationForm({ workEducationForm, profileId, isEditing }: Props) {
  const currentYear = getYear(new Date());
  const { redirectStep, setRedirectStep } = useFormStore();

  const previousJobsRef = useRef<HTMLDivElement>(null);
  const coursesRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      occupation: workEducationForm.occupation ? workEducationForm.occupation : "Aposentado",
      office: workEducationForm.office ? workEducationForm.office : "",
      companyOrBossName: workEducationForm.companyOrBossName ? workEducationForm.companyOrBossName : "",
      companyAddress: workEducationForm.companyAddress ? workEducationForm.companyAddress : "",
      companyCity: workEducationForm.companyCity ? workEducationForm.companyCity : "",
      companyState: workEducationForm.companyState ? workEducationForm.companyState : "",
      companyCountry: workEducationForm.companyCountry ? workEducationForm.companyCountry : "",
      companyCep: workEducationForm.companyCep ? workEducationForm.companyCep : "",
      companyTel: workEducationForm.companyTel ? workEducationForm.companyTel : "",
      admissionDate: workEducationForm.admissionDate ? workEducationForm.admissionDate : undefined,
      monthlySalary: workEducationForm.monthlySalary ? workEducationForm.monthlySalary : "",
      retireeDate: workEducationForm.retireeDate ? workEducationForm.retireeDate : undefined,
      jobDetails: workEducationForm.jobDetails ? workEducationForm.jobDetails : "",
      previousJobConfirmation: workEducationForm.previousJobConfirmation ? "Sim" : "Não",
      previousJobs:
        workEducationForm.previousJobs.length > 0
          ? [
              ...workEducationForm.previousJobs.map((item) => ({
                ...item,
                admissionDate: item.admissionDate ? new Date(item.admissionDate) : undefined,
                resignationDate: item.resignationDate ? new Date(item.resignationDate) : undefined,
              })),
            ]
          : [
              {
                companyName: "",
                companyAddress: "",
                companyCity: "",
                companyState: "",
                companyCountry: "",
                companyCep: "",
                companyTel: "",
                office: "",
                supervisorName: "",
                admissionDate: undefined,
                resignationDate: undefined,
                jobDescription: "",
              },
            ],
      courses:
        workEducationForm.courses.length > 0
          ? [
              ...workEducationForm.courses.map((item) => ({
                ...item,
                initialDate: item.initialDate ? new Date(item.initialDate) : undefined,
                finishDate: item.finishDate ? new Date(item.finishDate) : undefined,
              })),
            ]
          : [
              {
                institutionName: "",
                address: "",
                city: "",
                state: "",
                country: "",
                cep: "",
                courseName: "",
                initialDate: undefined,
                finishDate: undefined,
              },
            ],
    },
  });

  const occupation = form.watch("occupation");
  const previousJobConfirmation = form.watch("previousJobConfirmation");
  const previousJobs = form.watch("previousJobs");
  const courses = form.watch("courses");
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutate: submitWorkEducation, isPending } = trpc.formsRouter.submitWorkEducation.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.isEditing) {
        router.push(`/resumo-formulario/${profileId}`);
      } else {
        router.push(`/formulario/${profileId}?formStep=9`);
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
  const { mutate: saveWorkEducation, isPending: isSavePending } = trpc.formsRouter.saveWorkEducation.useMutation({
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
    console.log({ errors: form.formState.errors });
  }, [form.formState.errors]);

  useEffect(() => {
    if (redirectStep !== null) {
      const values = form.getValues();
      const previousJobsFormatted = previousJobs.map((prevJob) => ({
        ...prevJob,
        admissionDate: prevJob.admissionDate ?? null,
        resignationDate: prevJob.resignationDate ?? null,
      }));
      const coursesFormatted = courses.map((course) => ({
        ...course,
        initialDate: course.initialDate ?? null,
        finishDate: course.finishDate ?? null,
      }));

      saveWorkEducation({
        profileId,
        redirectStep,
        occupation:
          values.occupation !== ""
            ? values.occupation
            : !workEducationForm.occupation
            ? ""
            : workEducationForm.occupation,
        office: values.office !== "" ? values.office : !workEducationForm.office ? "" : workEducationForm.office,
        companyOrBossName:
          values.companyOrBossName !== ""
            ? values.companyOrBossName
            : !workEducationForm.companyOrBossName
            ? ""
            : workEducationForm.companyOrBossName,
        companyAddress:
          values.companyAddress !== ""
            ? values.companyAddress
            : !workEducationForm.companyAddress
            ? ""
            : workEducationForm.companyAddress,
        companyCity:
          values.companyCity !== ""
            ? values.companyCity
            : !workEducationForm.companyCity
            ? ""
            : workEducationForm.companyCity,
        companyState:
          values.companyState !== ""
            ? values.companyState
            : !workEducationForm.companyState
            ? ""
            : workEducationForm.companyState,
        companyCountry:
          values.companyCountry !== ""
            ? values.companyCountry
            : !workEducationForm.companyCountry
            ? ""
            : workEducationForm.companyCountry,
        companyCep:
          values.companyCep !== ""
            ? values.companyCep
            : !workEducationForm.companyCep
            ? ""
            : workEducationForm.companyCep,
        companyTel:
          values.companyTel !== ""
            ? values.companyTel
            : !workEducationForm.companyTel
            ? ""
            : workEducationForm.companyTel,
        admissionDate:
          values.admissionDate !== undefined
            ? values.admissionDate
            : !workEducationForm.admissionDate
            ? undefined
            : workEducationForm.admissionDate,
        monthlySalary:
          values.monthlySalary !== ""
            ? values.monthlySalary
            : !workEducationForm.monthlySalary
            ? ""
            : workEducationForm.monthlySalary,
        retireeDate:
          values.retireeDate !== undefined
            ? values.retireeDate
            : !workEducationForm.retireeDate
            ? undefined
            : workEducationForm.retireeDate,
        jobDetails:
          values.jobDetails !== ""
            ? values.jobDetails
            : !workEducationForm.jobDetails
            ? ""
            : workEducationForm.jobDetails,
        previousJobConfirmation:
          values.previousJobConfirmation ?? (workEducationForm.previousJobConfirmation ? "Sim" : "Não"),
        previousJobs: previousJobsFormatted,
        courses: coursesFormatted,
      });
      setRedirectStep(null);
    }
  }, [redirectStep, setRedirectStep, saveWorkEducation, profileId]);

  function handleCEPWorkEducationChange(event: ChangeEvent<HTMLInputElement>) {
    let value = event.target.value.replace(/[^\d]/g, "");

    value = value.replace(/(\d{5})(\d{3})/, "$1-$2");

    form.setValue("companyCep", value);
  }

  function handleCEPPreviousJobsChange(event: ChangeEvent<HTMLInputElement>, index: number) {
    let value = event.target.value.replace(/[^\d]/g, "");

    value = value.replace(/(\d{5})(\d{3})/, "$1-$2");

    form.setValue(`previousJobs.${index}.companyCep`, value);
  }

  function handleCEPCoursesChange(event: ChangeEvent<HTMLInputElement>, index: number) {
    let value = event.target.value.replace(/[^\d]/g, "");

    value = value.replace(/(\d{5})(\d{3})/, "$1-$2");

    form.setValue(`courses.${index}.cep`, value);
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    // TODO: Verificar se é preciso formatar dessa forma ou remover essas variáveis
    const previousJobsFormatted: {
      companyName: string;
      companyAddress: string;
      companyCity: string;
      companyState: string;
      companyCountry: string;
      companyCep: string;
      companyTel: string;
      office: string;
      supervisorName: string;
      admissionDate: Date;
      resignationDate: Date;
      jobDescription: string;
    }[] = values.previousJobs.filter(
      (
        prev
      ): prev is {
        companyName: string;
        companyAddress: string;
        companyCity: string;
        companyState: string;
        companyCountry: string;
        companyCep: string;
        companyTel: string;
        office: string;
        supervisorName: string;
        admissionDate: Date;
        resignationDate: Date;
        jobDescription: string;
      } =>
        (prev.companyCity !== "" ||
          prev.companyAddress !== "" ||
          prev.companyName !== "" ||
          prev.companyCountry !== "" ||
          prev.companyState !== "" ||
          prev.jobDescription !== "" ||
          prev.office !== "" ||
          prev.admissionDate !== undefined ||
          prev.resignationDate !== undefined) &&
        prev.admissionDate instanceof Date &&
        prev.resignationDate instanceof Date
    );
    const coursesFormatted: {
      institutionName: string;
      address: string;
      city: string;
      state: string;
      country: string;
      cep: string;
      courseName: string;
      initialDate: Date;
      finishDate: Date;
    }[] = values.courses.filter(
      (
        course
      ): course is {
        institutionName: string;
        address: string;
        city: string;
        state: string;
        country: string;
        cep: string;
        courseName: string;
        initialDate: Date;
        finishDate: Date;
      } =>
        (course.institutionName !== "" ||
          course.city !== "" ||
          course.state !== "" ||
          course.country !== "" ||
          course.courseName !== "" ||
          course.initialDate !== undefined ||
          course.finishDate !== undefined) &&
        course.initialDate instanceof Date &&
        course.finishDate instanceof Date
    );

    submitWorkEducation({
      ...values,
      previousJobs: previousJobsFormatted,
      courses: coursesFormatted,
      profileId,
      step: 9,
      isEditing,
    });
  }

  function onSave() {
    const values = form.getValues();
    const previousJobsFormatted = previousJobs.map((prevJob) => ({
      ...prevJob,
      admissionDate: prevJob.admissionDate ?? null,
      resignationDate: prevJob.resignationDate ?? null,
    }));
    const coursesFormatted = courses.map((course) => ({
      ...course,
      initialDate: course.initialDate ?? null,
      finishDate: course.finishDate ?? null,
    }));

    saveWorkEducation({
      profileId,
      occupation:
        values.occupation !== ""
          ? values.occupation
          : !workEducationForm.occupation
          ? ""
          : workEducationForm.occupation,
      office: values.office !== "" ? values.office : !workEducationForm.office ? "" : workEducationForm.office,
      companyOrBossName:
        values.companyOrBossName !== ""
          ? values.companyOrBossName
          : !workEducationForm.companyOrBossName
          ? ""
          : workEducationForm.companyOrBossName,
      companyAddress:
        values.companyAddress !== ""
          ? values.companyAddress
          : !workEducationForm.companyAddress
          ? ""
          : workEducationForm.companyAddress,
      companyCity:
        values.companyCity !== ""
          ? values.companyCity
          : !workEducationForm.companyCity
          ? ""
          : workEducationForm.companyCity,
      companyState:
        values.companyState !== ""
          ? values.companyState
          : !workEducationForm.companyState
          ? ""
          : workEducationForm.companyState,
      companyCountry:
        values.companyCountry !== ""
          ? values.companyCountry
          : !workEducationForm.companyCountry
          ? ""
          : workEducationForm.companyCountry,
      companyCep:
        values.companyCep !== ""
          ? values.companyCep
          : !workEducationForm.companyCep
          ? ""
          : workEducationForm.companyCep,
      companyTel:
        values.companyTel !== ""
          ? values.companyTel
          : !workEducationForm.companyTel
          ? ""
          : workEducationForm.companyTel,
      admissionDate:
        values.admissionDate !== undefined
          ? values.admissionDate
          : !workEducationForm.admissionDate
          ? undefined
          : workEducationForm.admissionDate,
      monthlySalary:
        values.monthlySalary !== ""
          ? values.monthlySalary
          : !workEducationForm.monthlySalary
          ? ""
          : workEducationForm.monthlySalary,
      retireeDate:
        values.retireeDate !== undefined
          ? values.retireeDate
          : !workEducationForm.retireeDate
          ? undefined
          : workEducationForm.retireeDate,
      jobDetails:
        values.jobDetails !== ""
          ? values.jobDetails
          : !workEducationForm.jobDetails
          ? ""
          : workEducationForm.jobDetails,
      previousJobConfirmation:
        values.previousJobConfirmation ?? (workEducationForm.previousJobConfirmation ? "Sim" : "Não"),
      previousJobs: previousJobsFormatted,
      courses: coursesFormatted,
    });
  }

  function addPreviousJobs() {
    form.setValue("previousJobs", [
      ...previousJobs,
      {
        companyName: "",
        companyAddress: "",
        companyCity: "",
        companyState: "",
        companyCountry: "",
        companyCep: "",
        companyTel: "",
        office: "",
        supervisorName: "",
        admissionDate: undefined,
        resignationDate: undefined,
        jobDescription: "",
      },
    ]);
  }

  function handleRemovePreviousJobs(index: number) {
    const updatedPreviousJobs = previousJobs.filter((_, i) => i !== index);

    form.setValue("previousJobs", updatedPreviousJobs);
  }

  function addCourses() {
    form.setValue("courses", [
      ...courses,
      {
        institutionName: "",
        address: "",
        city: "",
        state: "",
        country: "",
        cep: "",
        courseName: "",
        initialDate: undefined,
        finishDate: undefined,
      },
    ]);
  }

  function handleRemoveCourses(index: number) {
    const updatedCourses = courses.filter((_, i) => i !== index);

    form.setValue("courses", updatedCourses);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-6">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold mb-6">
          Trabalho e Educação
        </h2>

        <div className="w-full flex flex-col gap-12 justify-between flex-grow">
          <div className="w-full flex flex-col">
            <FormSectionHelp items={[...SECTION_HELP.workCurrent]} className="mb-6" />

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Selecione a sua ocupação atual?*</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="!mt-auto" disabled={isPending}>
                          <SelectValue placeholder="Selecione a opção" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="Empresário/Proprietário">Empresário/Proprietário</SelectItem>

                        <SelectItem value="Contratado (CLT/PJ)">Contratado (CLT/PJ)</SelectItem>

                        <SelectItem value="Autônomo">Autônomo</SelectItem>

                        <SelectItem value="Estudante">Estudante</SelectItem>

                        <SelectItem value="Não Trabalho">Não Trabalho</SelectItem>

                        <SelectItem value="Aposentado">Aposentado</SelectItem>

                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6 mb-6", {
                hidden: occupation === "Não Trabalho",
              })}
            >
              <FormField
                control={form.control}
                name="office"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2 row-start-1 md:col-start-1", {
                      hidden:
                        occupation === "Empresário/Proprietário" ||
                        occupation === "Não Trabalho" ||
                        occupation === "Estudante" ||
                        occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground">
                      {occupation === "Outro" ? (
                        <>Área de atuação</>
                      ) : occupation === "Autônomo" ? (
                        <>Ramo de Atuação</>
                      ) : (
                        <>Cargo</>
                      )}
                    </FormLabel>

                    <FormControl>
                      <Input
                        tabIndex={
                          occupation === "Empresário/Proprietário" ||
                          occupation === "Não Trabalho" ||
                          occupation === "Estudante" ||
                          occupation === "Aposentado"
                            ? -1
                            : occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro"
                            ? 1
                            : 0
                        }
                        disabled={
                          occupation === "Não Trabalho" ||
                          occupation === "Estudante" ||
                          occupation === "Aposentado" ||
                          occupation === "Empresário/Proprietário" ||
                          isPending
                        }
                        className="!mt-auto"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyOrBossName"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2 row-start-2 md:row-start-1 md:col-start-2", {
                      "row-start-1 md:col-span-1 md:col-start-1":
                        occupation === "Empresário/Proprietário" || occupation === "Estudante",
                      hidden: occupation === "Não Trabalho" || occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground" help={FIELD_HELP.employerName}>
                      {occupation === "Empresário/Proprietário"
                        ? "Nome fantasia ou razão social"
                        : occupation === "Autônomo"
                        ? "Nome da MEI (se houver)"
                        : occupation === "Estudante"
                        ? "Nome da instituição"
                        : "Nome do empregador atual ou empresa"}
                    </FormLabel>

                    <FormControl>
                      <Input
                        tabIndex={
                          occupation === "Empresário/Proprietário" || occupation === "Estudante"
                            ? 1
                            : occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro"
                            ? 2
                            : occupation === "Não Trabalho" || occupation === "Aposentado"
                            ? -1
                            : 0
                        }
                        disabled={occupation === "Aposentado" || occupation === "Não Trabalho" || isPending}
                        className="!mt-auto"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyAddress"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2", {
                      "row-start-2 md:row-start-1 md:col-start-2 md:col-span-2":
                        occupation === "Empresário/Proprietário" || occupation === "Estudante",
                      "row-start-3 md:col-span-2 md:row-start-2 md:col-start-1":
                        occupation === "Contratado (CLT/PJ)" || occupation === "Autônomo" || occupation === "Outro",
                      hidden: occupation === "Não Trabalho" || occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground">Logradouro</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        tabIndex={
                          occupation === "Empresário/Proprietário" || occupation === "Estudante"
                            ? 2
                            : occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro"
                            ? 3
                            : occupation === "Não Trabalho" || occupation === "Aposentado"
                            ? -1
                            : 0
                        }
                        disabled={occupation === "Não Trabalho" || occupation === "Aposentado" || isPending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyCity"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2 row-start-4 md:row-start-2 md:col-start-2", {
                      "row-start-6 md:row-start-3 md:col-start-2":
                        occupation === "Contratado (CLT/PJ)" || occupation === "Autônomo" || occupation === "Outro",
                      hidden: occupation === "Não Trabalho" || occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground">Cidade</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        tabIndex={
                          occupation === "Empresário/Proprietário" || occupation === "Estudante"
                            ? 4
                            : occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro"
                            ? 6
                            : occupation === "Não Trabalho" || occupation === "Aposentado"
                            ? -1
                            : 0
                        }
                        disabled={occupation === "Não Trabalho" || occupation === "Aposentado" || isPending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyState"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2 row-start-5 md:row-start-2 md:col-start-3", {
                      "row-start-7 md:row-start-3 md:col-start-3":
                        occupation === "Contratado (CLT/PJ)" || occupation === "Autônomo" || occupation === "Outro",
                      hidden: occupation === "Não Trabalho" || occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground">Estado</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        tabIndex={
                          occupation === "Empresário/Proprietário" || occupation === "Estudante"
                            ? 5
                            : occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro"
                            ? 7
                            : occupation === "Não Trabalho" || occupation === "Aposentado"
                            ? -1
                            : 0
                        }
                        disabled={occupation === "Não Trabalho" || occupation === "Aposentado" || isPending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyCountry"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2 row-start-6 md:row-start-3 md:col-start-1", {
                      "row-start-8 md:row-start-4 md:col-start-1":
                        occupation === "Contratado (CLT/PJ)" || occupation === "Autônomo" || occupation === "Outro",
                      hidden: occupation === "Não Trabalho" || occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground">País</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        tabIndex={
                          occupation === "Empresário/Proprietário" || occupation === "Estudante"
                            ? 6
                            : occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro"
                            ? 8
                            : occupation === "Não Trabalho" || occupation === "Aposentado"
                            ? -1
                            : 0
                        }
                        disabled={occupation === "Não Trabalho" || occupation === "Aposentado" || isPending}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyCep"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2 row-start-3 md:row-start-2 md:col-start-1", {
                      "row-start-4 md:row-start-2 md:col-start-3":
                        occupation === "Contratado (CLT/PJ)" || occupation === "Outro" || occupation === "Autônomo",
                      hidden: occupation === "Não Trabalho" || occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground">CEP</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        tabIndex={
                          occupation === "Empresário/Proprietário" || occupation === "Estudante"
                            ? 3
                            : occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro"
                            ? 4
                            : occupation === "Não Trabalho" || occupation === "Aposentado"
                            ? -1
                            : 0
                        }
                        disabled={occupation === "Não Trabalho" || occupation === "Aposentado" || isPending}
                        maxLength={9}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value}
                        onChange={handleCEPWorkEducationChange}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyTel"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2 row-start-7 md:row-start-3 md:col-start-2", {
                      "row-start-5 md:row-start-3 md:col-start-1":
                        occupation === "Contratado (CLT/PJ)" || occupation === "Outro" || occupation === "Autônomo",
                      hidden: occupation === "Não Trabalho" || occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground">Telefone</FormLabel>

                    <FormControl>
                      <Input
                        tabIndex={
                          occupation === "Empresário/Proprietário" || occupation === "Estudante"
                            ? 7
                            : occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro"
                            ? 5
                            : occupation === "Não Trabalho" || occupation === "Aposentado"
                            ? -1
                            : 0
                        }
                        disabled={occupation === "Não Trabalho" || occupation === "Aposentado" || isPending}
                        placeholder="Insira o telefone da empresa..."
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="admissionDate"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2", {
                      "row-start-8 md:row-start-3 md:col-start-3":
                        occupation === "Empresário/Proprietário" || occupation === "Estudante",
                      "row-start-9 md:row-start-4 md:col-start-2":
                        occupation === "Contratado (CLT/PJ)" || occupation === "Autônomo" || occupation === "Outro",
                      hidden: occupation === "Não Trabalho" || occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground" help={FIELD_HELP.jobStartDate}>
                      {occupation === "Empresário/Proprietário"
                        ? "Data de abertura*"
                        : occupation === "Estudante"
                        ? "Data de início*"
                        : "Data de admissão*"}
                    </FormLabel>

                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            tabIndex={
                              occupation === "Empresário/Proprietário" || occupation === "Estudante"
                                ? 8
                                : occupation === "Contratado (CLT/PJ)" ||
                                  occupation === "Autônomo" ||
                                  occupation === "Outro"
                                ? 9
                                : occupation === "Não Trabalho" || occupation === "Aposentado"
                                ? -1
                                : 0
                            }
                            disabled={occupation === "Não Trabalho" || occupation === "Aposentado" || isPending}
                            variant={"outline"}
                            className={cn(
                              "!mt-auto w-full h-12 pl-3 text-left border-secondary font-normal group",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span className="text-foreground opacity-80 group-hover:text-white group-hover:opacity-100">
                                Selecione a data
                              </span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                name="retireeDate"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2", {
                      hidden:
                        occupation === "Empresário/Proprietário" ||
                        occupation === "Estudante" ||
                        occupation === "Contratado (CLT/PJ)" ||
                        occupation === "Autônomo" ||
                        occupation === "Não Trabalho" ||
                        occupation === "Outro",
                    })}
                  >
                    <FormLabel className="text-foreground">Data de aposentadoria</FormLabel>

                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            tabIndex={
                              occupation === "Empresário/Proprietário" ||
                              occupation === "Estudante" ||
                              occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro" ||
                              occupation === "Não Trabalho"
                                ? -1
                                : occupation === "Aposentado"
                                ? 1
                                : 0
                            }
                            disabled={
                              occupation === "Não Trabalho" ||
                              occupation === "Empresário/Proprietário" ||
                              occupation === "Estudante" ||
                              occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro" ||
                              isPending
                            }
                            variant={"outline"}
                            className={cn(
                              "!mt-auto w-full h-12 pl-3 text-left border-secondary font-normal group",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value !== undefined ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span className="text-foreground opacity-80 group-hover:text-white group-hover:opacity-100">
                                Selecione a data
                              </span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                name="monthlySalary"
                render={({ field }) => (
                  <FormItem
                    className={cn("flex flex-col gap-2", {
                      "row-start-9 md:row-start-4 md:col-start-1": occupation === "Empresário/Proprietário",
                      "row-start-10 md:row-start-4 md:col-start-3":
                        occupation === "Autônomo" || occupation === "Contratado (CLT/PJ)" || occupation === "Outro",
                      hidden:
                        occupation === "Não Trabalho" || occupation === "Aposentado" || occupation === "Estudante",
                    })}
                  >
                    <FormLabel className="text-foreground" help={FIELD_HELP.monthlyIncome}>
                      Renda mensal (R$)
                    </FormLabel>

                    <FormControl>
                      <div className="h-12 flex items-center gap-2 border border-muted/70 rounded-xl transition duration-300 bg-background px-3 py-2 text-sm group focus-within:border-primary hover:border-border">
                        <CircleDollarSign className="size-5 text-border flex-shrink-0" strokeWidth={1.5} />

                        <div className="w-[2px] flex-shrink-0 h-full bg-muted rounded-full" />

                        <CurrencyInput
                          tabIndex={
                            occupation === "Empresário/Proprietário"
                              ? 9
                              : occupation === "Contratado (CLT/PJ)" ||
                                occupation === "Autônomo" ||
                                occupation === "Outro"
                              ? 10
                              : occupation === "Não Trabalho" ||
                                occupation === "Aposentado" ||
                                occupation === "Estudante"
                              ? -1
                              : 0
                          }
                          disabled={
                            occupation === "Não Trabalho" ||
                            occupation === "Aposentado" ||
                            occupation === "Estudante" ||
                            isPending
                          }
                          placeholder="Insira o valor do serviço"
                          onValueChange={(value, name) => form.setValue(name as "monthlySalary", value ?? "0")}
                          decimalsLimit={2}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          name={field.name}
                          value={field.value}
                          className="flex h-full w-full transition duration-300 bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0  disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDetails"
                render={({ field }) => (
                  <FormItem
                    className={cn({
                      "md:row-start-5 md:col-span-3":
                        occupation === "Empresário/Proprietário" ||
                        occupation === "Estudante" ||
                        occupation === "Contratado (CLT/PJ)" ||
                        occupation === "Autônomo" ||
                        occupation === "Outro",
                      hidden: occupation === "Não Trabalho" || occupation === "Aposentado",
                    })}
                  >
                    <FormLabel className="text-foreground" help={FIELD_HELP.jobDuties}>
                      {occupation == "Contratado (CLT/PJ)" ? (
                        <>Descreva quais as suas funções dentro da empresa</>
                      ) : occupation === "Estudante" ? (
                        <>
                          Indique o nome do curso e o ano letivo. Se estiver realizando estágio ou tiver outra atividade
                          secundária, mencione isso na descrição com detalhes
                        </>
                      ) : occupation === "Autônomo" ? (
                        <>Descreva as suas atividades</>
                      ) : occupation === "Outro" ? (
                        <>Descreva sobre a sua atual ocupação</>
                      ) : occupation === "Empresário/Proprietário" ? (
                        <>
                          Descreva quais são as suas funções dentro da sua empresa, se possui funcionários registrados e
                          outras informações relacionadas ao seu negócio
                        </>
                      ) : null}
                    </FormLabel>

                    <FormControl>
                      <Textarea
                        tabIndex={
                          occupation === "Empresário/Proprietário"
                            ? 10
                            : occupation === "Estudante"
                            ? 9
                            : occupation === "Contratado (CLT/PJ)" ||
                              occupation === "Autônomo" ||
                              occupation === "Outro"
                            ? 11
                            : occupation === "Não Trabalho" || occupation === "Aposentado"
                            ? -1
                            : 0
                        }
                        disabled={occupation === "Não Trabalho" || occupation === "Aposentado" || isPending}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <FormSectionHelp items={[...SECTION_HELP.workHistory]} className="mb-6" />

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="previousJobConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.previousJobs}>
                      Você já teve experiências profissionais anteriores? Caso sim, informe um histórico das suas
                      últimas ocupações ou, se for o caso, da sua aposentadoria
                    </FormLabel>

                    <FormControl>
                      <RadioGroup
                        disabled={isPending}
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
              ref={previousJobsRef}
              className={cn("w-full bg-secondary rounded-xl p-4 space-y-6 mb-10", {
                hidden: previousJobConfirmation === "Não",
              })}
            >
              {previousJobs.map((_, index) => (
                <div key={index} className="w-full flex flex-col gap-y-4">
                  <div className="w-full flex items-center justify-between gap-6">
                    <span className="w-fit bg-primary rounded-full px-3 py-1 text-white text-base font-medium mb-4">
                      Experiência de trabalho - {index + 1}
                    </span>

                    {index !== 0 && (
                      <Button type="button" onClick={() => handleRemovePreviousJobs(index)} variant="ghost" size="icon">
                        <X
                          strokeWidth={1.5}
                          className="size-8 text-foreground hover:text-foreground/70 transition-colors"
                        />
                      </Button>
                    )}
                  </div>

                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.companyName`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground" help={FIELD_HELP.previousJobs}>
                            Nome do empregador ou empresa anterior*
                          </FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.companyAddress`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Logradouro*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6">
                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.companyCity`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Cidade*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.companyState`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Estado*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.companyCountry`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">País*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6">
                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.companyCep`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">CEP</FormLabel>

                          <FormControl>
                            <Input
                              disabled={isPending}
                              maxLength={9}
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value}
                              onChange={(e) => handleCEPPreviousJobsChange(e, index)}
                              className="!mt-auto"
                            />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.companyTel`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Telefone</FormLabel>

                          <FormControl>
                            <Input disabled={isPending} placeholder="Insira seu telefone..." {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.office`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Cargo / Função*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.supervisorName`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Nome completo do supervisor</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <FormField
                      control={form.control}
                      name={`previousJobs.${index}.admissionDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Data de admissão*</FormLabel>

                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  disabled={isPending}
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
                      name={`previousJobs.${index}.resignationDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="text-foreground">Data de demissão*</FormLabel>

                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  disabled={isPending}
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
                  </div>

                  <FormField
                    control={form.control}
                    name={`previousJobs.${index}.jobDescription`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-foreground">
                          Descreva brevemente as tarefas exercidas do seu cargo*
                        </FormLabel>

                        <FormControl>
                          <Textarea disabled={isPending} className="resize-none !mt-auto" {...field} />
                        </FormControl>

                        <FormMessage className="text-sm text-destructive" />
                      </FormItem>
                    )}
                  />

                  {index !== previousJobs.length - 1 && <Separator className="bg-white my-6" />}
                </div>
              ))}

              {previousJobs.length < 2 && (
                <Button
                  type="button"
                  size="xl"
                  className="w-full flex items-center gap-2 md:w-fit"
                  disabled={isPending}
                  onClick={addPreviousJobs}
                >
                  Adicionar
                  <Plus />
                </Button>
              )}
            </div>

            <FormSectionHelp items={[...SECTION_HELP.education]} className="mb-6" />

            <span className="text-foreground text-base font-medium mb-6">
              Informe pelo menos os dois últimos cursos concluídos. Caso não tenha ensino superior ou médio completo,
              informe o ensino básico.
            </span>

            <div ref={coursesRef} className="w-full bg-secondary rounded-xl p-4 space-y-6">
              {courses.map((_, index) => (
                <div key={index} className="w-full flex flex-col gap-x-4 gap-y-6">
                  <div className="w-full flex items-center justify-between gap-6">
                    <span className="w-fit bg-primary rounded-full px-3 py-1 text-white text-base font-medium mb-4">
                      Ensino - {index + 1}
                    </span>

                    {index !== 0 && (
                      <Button type="button" onClick={() => handleRemoveCourses(index)} variant="ghost" size="icon">
                        <X
                          strokeWidth={1.5}
                          className="size-8 text-foreground hover:text-foreground/70 transition-colors"
                        />
                      </Button>
                    )}
                  </div>

                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6">
                    <FormField
                      control={form.control}
                      name={`courses.${index}.institutionName`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel help={FIELD_HELP.education}>Nome completo da instituição*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`courses.${index}.address`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>Endereço completo</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`courses.${index}.cep`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>CEP</FormLabel>

                          <FormControl>
                            <Input
                              className="!mt-auto"
                              maxLength={9}
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value}
                              disabled={isPending}
                              onChange={(e) => handleCEPCoursesChange(e, index)}
                            />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6">
                    <FormField
                      control={form.control}
                      name={`courses.${index}.city`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>Cidade*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`courses.${index}.state`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>Estado*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`courses.${index}.country`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>País*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6">
                    <FormField
                      control={form.control}
                      name={`courses.${index}.courseName`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>Nome do curso*</FormLabel>

                          <FormControl>
                            <Input className="!mt-auto" disabled={isPending} {...field} />
                          </FormControl>

                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`courses.${index}.initialDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>Data de início*</FormLabel>

                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  disabled={isPending}
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
                      name={`courses.${index}.finishDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>Data de término*</FormLabel>

                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  disabled={isPending}
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
                  </div>

                  {index !== courses.length - 1 && <Separator className="bg-white my-6" />}
                </div>
              ))}

              <Button
                type="button"
                size="xl"
                className="w-full flex items-center gap-2 md:w-fit"
                onClick={addCourses}
                disabled={isPending}
              >
                Adicionar
                <Plus />
              </Button>
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
