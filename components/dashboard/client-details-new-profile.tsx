import { z } from "zod";
import Image from "next/image";
import { toast } from "sonner";
import { ChangeEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { format, getYear, isValid, parse } from "date-fns";
import { expireDateFromIssued } from "@/lib/barcode-validity";
import { CalendarIcon, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import { FormAnimation } from "@/constants/animations/modal";
import useClientDetailsModalStore from "@/constants/stores/useClientDetailsModalStore";

interface Props {
  handleClose: () => void;
}

const formSchema = z
  .object({
    profileName: z
      .string({
        required_error: "Nome do perfil é obrigatório",
        invalid_type_error: "Nome do perfil inválido",
      })
      .min(1, { message: "Nome do perfil é obrigatório" })
      .min(6, { message: "Nome do perfil precisa ter no mínimo 6 caracteres" }),
    profileCpf: z
      .string({
        required_error: "CPF do perfil é obrigatório",
        invalid_type_error: "CPF do perfil inválido",
      })
      .refine((val) => val.length > 0 && val.length === 14, {
        message: "CPF inválido",
      }),
    profileAddress: z.string({
      required_error: "Endereço do perfil é obrigatório",
      invalid_type_error: "Endereço do perfil inválido",
    }),
    birthDate: z.string({ required_error: "Data de nascimento é obrigatório" }).length(10, "Data inválida").optional(),
    passport: z
      .string({
        invalid_type_error: "Passaporte inválido",
      })
      .optional(),
    visaType: z
      .enum(["Renovação", "Primeiro Visto", ""], {
        message: "Tipo de Visto inválido",
      })
      .optional(),
    visaClass: z
      .enum(
        [
          "B1 Babá",
          "B1/B2 Turismo",
          "O1 Capacidade Extraordinária",
          "O2 Estrangeiro Acompanhante/Assistente",
          "O3 Cônjuge ou Filho de um O1 ou O2",
          "",
        ],
        { message: "Classe de visto inválida" }
      )
      .optional(),
    category: z.enum(["Visto Americano", "Passaporte", "E-TA", ""]).refine((val) => val.length !== 0, {
      message: "Categoria é obrigatória",
    }),
    issuanceDate: z.string({ required_error: "Data de emissão é obrigatório" }).optional(),
    expireDate: z.string({ required_error: "Data de expiração é obrigatório" }).optional(),
    DSNumber: z
      .string({
        invalid_type_error: "Barcode inválido",
      })
      .optional(),
    responsibleCpf: z.string({ invalid_type_error: "CPF do responsável inválido" }).optional(),
    protocol: z
      .string({
        invalid_type_error: "Barcode inválido",
      })
      .optional(),
    paymentStatus: z
      .enum(["Pendente", "Pago", ""], {
        message: "Status de pagamento inválido",
      })
      .optional(),
    scheduleDate: z.string({ required_error: "Data de agendamento é obrigatório" }).optional(),
    scheduleTime: z
      .string({
        invalid_type_error: "Horário do agendamento inválido",
      })
      .optional(),
    scheduleLocation: z
      .string({
        invalid_type_error: "Local do agendamento inválido",
      })
      .optional(),
    entryDate: z.string({ required_error: "Data de entrada é obrigatório" }).optional(),
    process: z
      .enum(["ESTA", "E-TA", ""], {
        message: "Classificação inválida",
      })
      .optional(),
    ETAStatus: z
      .enum(["Em Análise", "Aprovado", "Reprovado", ""], {
        message: "Status inválido",
      })
      .optional(),
  })
  .superRefine(({ category, visaType, visaClass, scheduleTime }, ctx) => {
    if (category === "Visto Americano" && (visaType === "" || visaType === undefined)) {
      ctx.addIssue({
        path: ["visaType"],
        code: "custom",
        message: "Tipo do visto é obrigatório",
      });
    }

    if (category === "Visto Americano" && (visaClass === "" || visaClass === undefined)) {
      ctx.addIssue({
        path: ["visaClass"],
        code: "custom",
        message: "Classe do visto é obrigatória",
      });
    }

    if (
      category === "Passaporte" &&
      scheduleTime !== undefined &&
      /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/.test(scheduleTime) === false
    ) {
      ctx.addIssue({
        path: ["scheduleTime"],
        code: "custom",
        message: "Horário do agendamento inválido",
      });
    }
  });

export function ClientDetailsNewProfile({ handleClose }: Props) {
  const [birthDateCalendar, setBirthDateCalendar] = useState<Date | undefined>(undefined);
  const [issuanceDateCalendar, setIssuanceDateCalendar] = useState<Date | undefined>(undefined);
  const [expireDateCalendar, setExpireDateCalendar] = useState<Date | undefined>(undefined);
  const [scheduleDateCalendar, setScheduleDateCalendar] = useState<Date | undefined>(undefined);
  const [entryDateCalendar, setEntryDateCalendar] = useState<Date | undefined>(undefined);

  const { unsetToNewProfile, setToResume, client, setClient } = useClientDetailsModalStore();

  const utils = trpc.useUtils();

  const { mutate: addProfile, isPending } = trpc.userRouter.addProfile.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);

      utils.userRouter.getActiveClients.invalidate();
      utils.userRouter.getProspectsClients.invalidate();
      utils.userRouter.getArchivedClients.invalidate();

      setClient(data.clientUpdated);
      handleClose();
    },
    onError: (error) => {
      console.log(error);

      toast.error("Ocorreu um erro ao editar o perfil");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileName: "",
      profileCpf: "",
      profileAddress: "",
      birthDate: "",
      passport: "",
      visaType: "",
      visaClass: "",
      category: "",
      issuanceDate: "",
      expireDate: "",
      DSNumber: "",
      responsibleCpf: "",
      protocol: "",
      paymentStatus: "",
      scheduleDate: "",
      scheduleTime: "",
      scheduleLocation: "",
      entryDate: "",
      process: "",
      ETAStatus: "",
    },
  });
  const currentYear = getYear(new Date());
  const visaType = form.watch("visaType");
  const category = form.watch("category");
  const { setValue } = form;

  useEffect(() => {
    if (birthDateCalendar !== undefined) {
      const dateFormatted = format(birthDateCalendar, "dd/MM/yyyy");

      setValue("birthDate", dateFormatted);
    }
  }, [birthDateCalendar, setValue]);

  useEffect(() => {
    if (issuanceDateCalendar !== undefined) {
      const dateFormatted = format(issuanceDateCalendar, "dd/MM/yyyy");

      setValue("issuanceDate", dateFormatted);
      setExpireDateCalendar(expireDateFromIssued(issuanceDateCalendar));
    }
  }, [issuanceDateCalendar, setValue]);

  useEffect(() => {
    if (expireDateCalendar !== undefined) {
      const dateFormatted = format(expireDateCalendar, "dd/MM/yyyy");

      setValue("expireDate", dateFormatted);
    }
  }, [expireDateCalendar, setValue]);

  useEffect(() => {
    if (scheduleDateCalendar !== undefined) {
      const dateFormatted = format(scheduleDateCalendar, "dd/MM/yyyy");

      setValue("scheduleDate", dateFormatted);
    }
  }, [scheduleDateCalendar, setValue]);

  useEffect(() => {
    if (entryDateCalendar !== undefined) {
      const dateFormatted = format(entryDateCalendar, "dd/MM/yyyy");

      setValue("entryDate", dateFormatted);
    }
  }, [entryDateCalendar, setValue]);

  function handleTime(event: ChangeEvent<HTMLInputElement>) {
    let value = event.target.value.replace(/[^0-9:]/g, "");

    return value;
  }

  function handleBack() {
    unsetToNewProfile();
    setToResume();
  }

  function handleCPF(event: ChangeEvent<HTMLInputElement>) {
    let value = event.target.value.replace(/[^\d]/g, "");

    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    return value;
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

  function handleDateBlur(field: "birthDate" | "issuanceDate" | "expireDate" | "scheduleDate" | "entryDate") {
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

        if (field === "birthDate") {
          setBirthDateCalendar(dateFormatted);
        }

        if (field === "issuanceDate") {
          setIssuanceDateCalendar(dateFormatted);
        }

        if (field === "expireDate") {
          setExpireDateCalendar(dateFormatted);
        }

        if (field === "scheduleDate") {
          setScheduleDateCalendar(dateFormatted);
        }

        if (field === "entryDate") {
          setEntryDateCalendar(dateFormatted);
        }
      }
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!client) {
      return;
    }

    addProfile({ userId: client.userId, ...values });
  }

  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={FormAnimation}>
      <div className="w-full grid grid-cols-2 grid-rows-2 gap-4 mb-9 sm:flex sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={handleBack} disabled={isPending} variant="link" size="icon" className="row-start-1 row-end-2">
          <Image src="/assets/icons/arrow-left-dark.svg" alt="Voltar" width={24} height={24} />
        </Button>

        <h1 className="text-2xl font-semibold text-foreground text-center sm:text-3xl row-end-3 row-start-2 col-span-2">
          Novo Perfil
        </h1>

        <Button
          onClick={handleClose}
          disabled={isPending}
          variant="link"
          size="icon"
          className="row-start-1 row-end-2 justify-self-end"
        >
          <Image src="/assets/icons/cross-blue.svg" alt="Fechar" width={24} height={24} />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-9">
          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Categoria*</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                          <SelectValue placeholder="Selecione a categoria do perfil" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent className="z-[99999]">
                        <SelectItem value="Visto Americano">Visto Americano</SelectItem>
                        <SelectItem value="Passaporte">Passaporte</SelectItem>
                        <SelectItem value="E-TA">ESTA / E-TA</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="profileName"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Nome*</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Insira o nome do perfil"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                        value={field.value}
                        disabled={isPending}
                      />
                    </FormControl>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileCpf"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">CPF*</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Insira o CPF do perfil"
                        maxLength={14}
                        ref={field.ref}
                        name={field.name}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          const newValue = handleCPF(event);

                          form.setValue("profileCpf", newValue);
                        }}
                        disabled={isPending}
                      />
                    </FormControl>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Data de Nascimento</FormLabel>

                    <FormControl>
                      <div className="w-full relative">
                        <Input
                          {...field}
                          className="pl-14"
                          maxLength={10}
                          placeholder="Insira a data de nascimento"
                          onChange={(e) => {
                            let valueFormatted = formatDate(e);

                            form.setValue("birthDate", valueFormatted);
                          }}
                          onBlur={() => handleDateBlur("birthDate")}
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
                              selected={birthDateCalendar}
                              onSelect={setBirthDateCalendar}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              captionLayout="dropdown"
                              fromYear={1900}
                              toYear={currentYear}
                              month={birthDateCalendar}
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

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            {/* NOTE: Apresenta somente em Visto Americano e E-TA */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-[calc(70%-12px)_calc(30%-12px)] gap-6">
              <FormField
                control={form.control}
                name="profileAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Endereço</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Insira o endereço do perfil"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                        value={field.value}
                        disabled={isPending}
                      />
                    </FormControl>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passport"
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      "flex flex-col gap-1",
                      category !== "Visto Americano" && category !== "E-TA" && "hidden"
                    )}
                  >
                    <FormLabel className="truncate">Passaporte</FormLabel>

                    <FormControl>
                      <Input placeholder="Insira o passaporte" {...field} />
                    </FormControl>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-col gap-1", category !== "Passaporte" && "hidden")}>
                    <FormLabel className="truncate">Data de entrada</FormLabel>

                    <FormControl>
                      <div className="w-full relative">
                        <Input
                          {...field}
                          className="pl-14"
                          maxLength={10}
                          placeholder="Insira a data de entrada"
                          onChange={(e) => {
                            let valueFormatted = formatDate(e);

                            form.setValue("entryDate", valueFormatted);
                          }}
                          onBlur={() => handleDateBlur("entryDate")}
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
                              selected={entryDateCalendar}
                              onSelect={setEntryDateCalendar}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              captionLayout="dropdown"
                              fromYear={1900}
                              toYear={currentYear}
                              month={entryDateCalendar}
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

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            {/* NOTE: Apresenta somente em Visto Americano */}
            <div
              className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", category !== "Visto Americano" && "hidden")}
            >
              <FormField
                control={form.control}
                name="visaType"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Tipo de Visto*</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                          <SelectValue placeholder="Selecione o tipo de visto" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent className="z-[99999]">
                        <SelectItem value="Renovação">Renovação</SelectItem>
                        <SelectItem value="Primeiro Visto">Primeiro Visto</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visaClass"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Classe do Visto*</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          className={cn("text-left", field.value === "" && "[&>span]:text-muted-foreground")}
                        >
                          <SelectValue placeholder="Selecione a classe do visto" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent className="z-[99999]">
                        <SelectItem value="B1 Babá">B1 Babá</SelectItem>

                        <SelectItem value="B1/B2 Turismo">B1/B2 Turismo</SelectItem>

                        <SelectItem value="O1 Capacidade Extraordinária">O1 Capacidade Extraordinária</SelectItem>

                        <SelectItem value="O2 Estrangeiro Acompanhante/Assistente">
                          O2 Estrangeiro Acompanhante/Assistente
                        </SelectItem>

                        <SelectItem value="O3 Cônjuge ou Filho de um O1 ou O2">
                          O3 Cônjuge ou Filho de um O1 ou O2
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="DSNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 sm:order-3 xl:order-1">
                    <FormLabel className="truncate">Barcode</FormLabel>

                    <FormControl>
                      <Input placeholder="Insira o número da DS" {...field} />
                    </FormControl>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            {/* NOTE: Apresenta somente em Visto Americano */}
            <div
              className={cn("w-full grid grid-cols-1 sm:grid-cols-2 gap-6", {
                hidden: visaType !== "Renovação" || category !== "Visto Americano",
              })}
            >
              <FormField
                control={form.control}
                name="issuanceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 sm:order-1 xl:order-2">
                    <FormLabel className="truncate">Data de geração do barcode</FormLabel>

                    <FormControl>
                      <div className="w-full relative">
                        <Input
                          {...field}
                          className="pl-14"
                          maxLength={10}
                          placeholder="Insira a data de emissão"
                          onChange={(e) => {
                            let valueFormatted = formatDate(e);

                            form.setValue("issuanceDate", valueFormatted);
                          }}
                          onBlur={() => handleDateBlur("issuanceDate")}
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
                              selected={issuanceDateCalendar}
                              onSelect={setIssuanceDateCalendar}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              captionLayout="dropdown"
                              fromYear={1900}
                              toYear={currentYear}
                              month={issuanceDateCalendar}
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

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expireDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 sm:order-2 xl:order-3">
                    <FormLabel className="truncate">Validade do barcode</FormLabel>

                    <FormControl>
                      <div className="w-full relative">
                        <Input
                          {...field}
                          className="pl-14"
                          maxLength={10}
                          placeholder="Insira a data de expiração"
                          onChange={(e) => {
                            let valueFormatted = formatDate(e);

                            form.setValue("expireDate", valueFormatted);
                          }}
                          onBlur={() => handleDateBlur("expireDate")}
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
                              selected={expireDateCalendar}
                              onSelect={setExpireDateCalendar}
                              disabled={(date) => date > new Date("2200-01-01") || date < new Date("1900-01-01")}
                              captionLayout="dropdown"
                              fromYear={1900}
                              toYear={2200}
                              month={expireDateCalendar}
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

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            {/* NOTE: Apresenta somente em Passaporte */}
            <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", category !== "Passaporte" && "hidden")}>
              <FormField
                control={form.control}
                name="responsibleCpf"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">CPF do responsável</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Insira o CPF do responsável"
                        maxLength={14}
                        ref={field.ref}
                        name={field.name}
                        value={field.value}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                        onChange={(event) => {
                          const newValue = handleCPF(event);

                          form.setValue("responsibleCpf", newValue);
                        }}
                      />
                    </FormControl>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Protocolo</FormLabel>

                    <FormControl>
                      <Input placeholder="Insira o protocolo" {...field} />
                    </FormControl>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Status do pagamento</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                          <SelectValue placeholder="Selecione o status do pagamento" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent className="z-[99999]">
                        <SelectItem value="Pendente">Pendente</SelectItem>

                        <SelectItem value="Pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            {/* NOTE: Apresenta somente em Passaporte */}
            <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", category !== "Passaporte" && "hidden")}>
              <FormField
                control={form.control}
                name="scheduleDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Data do agendamento</FormLabel>

                    <FormControl>
                      <div className="w-full relative">
                        <Input
                          {...field}
                          className="pl-14"
                          maxLength={10}
                          placeholder="Insira a data do agendamento"
                          onChange={(e) => {
                            let valueFormatted = formatDate(e);

                            form.setValue("scheduleDate", valueFormatted);
                          }}
                          onBlur={() => handleDateBlur("scheduleDate")}
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
                              selected={scheduleDateCalendar}
                              onSelect={setScheduleDateCalendar}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              captionLayout="dropdown"
                              fromYear={1900}
                              toYear={currentYear}
                              month={scheduleDateCalendar}
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

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduleTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Horário do agendamento</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Insira o horário do agendamento"
                        maxLength={5}
                        ref={field.ref}
                        name={field.name}
                        value={field.value}
                        onBlur={field.onBlur}
                        disabled={isPending}
                        onChange={(event) => {
                          const newValue = handleTime(event);

                          form.setValue("scheduleTime", newValue);
                        }}
                      />
                    </FormControl>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduleLocation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Local do agendamento</FormLabel>

                    <FormControl>
                      <Input placeholder="Insira o local do agendamento" {...field} />
                    </FormControl>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            {/* NOTE: Apresenta somente em E-TA */}
            <div
              className={cn(
                "w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
                category !== "E-TA" && "hidden"
              )}
            >
              <FormField
                control={form.control}
                name="ETAStatus"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Status</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent className="z-[99999]">
                        <SelectItem value="Em Análise">Em Análise</SelectItem>

                        <SelectItem value="Aprovado">Aprovado</SelectItem>

                        <SelectItem value="Reprovado">Reprovado</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="process"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1">
                    <FormLabel className="truncate">Classificação</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                          <SelectValue placeholder="Selecione a classificação" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="ESTA">ESTA</SelectItem>
                        <SelectItem value="E-TA">E-TA</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage className="font-normal text-destructive" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="w-full flex flex-col-reverse gap-6 sm:flex-row">
            <Button
              onClick={handleBack}
              disabled={isPending}
              type="button"
              variant="outline"
              size="xl"
              className="w-full sm:w-fit"
            >
              Cancelar
            </Button>

            <Button disabled={isPending} type="submit" size="xl" className="w-full sm:w-fit flex items-center gap-2">
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Enviando
                </>
              ) : (
                <>Enviar</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
