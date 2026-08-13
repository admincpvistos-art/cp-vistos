"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { format, getYear } from "date-fns";
import { useRouter } from "next/navigation";
import { Form as FormType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CalendarIcon, Loader2, Save } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { countries } from "@/constants";
import { trpc } from "@/lib/trpc-client";
import { PassportFormType } from "@/types";
import useFormStore from "@/constants/stores/useFormStore";

const formSchema = z
  .object({
    passportNumber: z.string().min(1, { message: "Campo obrigatório" }),
    passportCity: z.string().min(1, { message: "Campo obrigatório" }),
    passportState: z.string().min(1, { message: "Campo obrigatório" }),
    passportIssuingCountry: z.string().min(1, { message: "Campo obrigatório" }),
    passportIssuingDate: z.date({ message: "Selecione uma data" }),
    passportExpireDate: z.date({ message: "Selecione uma data" }).optional(),
    passportLostConfirmation: z.enum(["Sim", "Não"]),
    lostPassportNumber: z.string(),
    lostPassportCountry: z.string(),
    lostPassportDetails: z.string(),
  })
  .superRefine(({ passportLostConfirmation, lostPassportDetails }, ctx) => {
    if (passportLostConfirmation === "Sim" && (lostPassportDetails === undefined || lostPassportDetails.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Campo vazio, preencha para prosseguir",
        path: ["lostPassportDetails"],
      });
    }
  });

interface Props {
  profileId: string;
  passportForm: PassportFormType;
  isEditing: boolean;
}

export function PassportForm({ passportForm, profileId, isEditing }: Props) {
  const currentYear = getYear(new Date());

  const { redirectStep, setRedirectStep } = useFormStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passportNumber: passportForm.passportNumber ? passportForm.passportNumber : "",
      passportCity: passportForm.passportCity ? passportForm.passportCity : "",
      passportState: passportForm.passportState ? passportForm.passportState : "",
      passportIssuingCountry: passportForm.passportIssuingCountry ? passportForm.passportIssuingCountry : "",
      passportIssuingDate: passportForm.passportIssuingDate ? passportForm.passportIssuingDate : undefined,
      passportExpireDate: passportForm.passportExpireDate ? passportForm.passportExpireDate : undefined,
      passportLostConfirmation: passportForm.passportLostConfirmation ? "Sim" : "Não",
      lostPassportNumber: passportForm.lostPassportNumber ? passportForm.lostPassportNumber : "",
      lostPassportCountry: passportForm.lostPassportCountry ? passportForm.lostPassportCountry : "",
      lostPassportDetails: passportForm.lostPassportDetails ? passportForm.lostPassportDetails : "",
    },
  });

  const passportLostConfirmation: "Sim" | "Não" = form.watch("passportLostConfirmation");
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutate: submitPassport, isPending } = trpc.formsRouter.submitPassport.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.isEditing) {
        router.push(`/resumo-formulario/${profileId}`);
      } else {
        router.push(`/formulario/${profileId}?formStep=3`);
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
  const { mutate: savePassport, isPending: isSavePending } = trpc.formsRouter.savePassport.useMutation({
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

      savePassport({
        passportNumber: values.passportNumber !== "" ? values.passportNumber : passportForm.passportNumber,
        passportCity: values.passportCity !== "" ? values.passportCity : passportForm.passportCity,
        passportState: values.passportState !== "" ? values.passportState : passportForm.passportState,
        passportIssuingCountry:
          values.passportIssuingCountry !== "" ? values.passportIssuingCountry : passportForm.passportIssuingCountry,
        passportIssuingDate: values.passportIssuingDate ?? passportForm.passportIssuingDate,
        passportExpireDate: values.passportExpireDate ?? passportForm.passportExpireDate,
        passportLostConfirmation: values.passportLostConfirmation ?? passportForm.passportLostConfirmation,
        lostPassportNumber:
          values.lostPassportNumber !== "" ? values.lostPassportNumber : passportForm.lostPassportNumber,
        lostPassportCountry:
          values.lostPassportCountry !== "" ? values.lostPassportCountry : passportForm.lostPassportCountry,
        lostPassportDetails:
          values.lostPassportDetails !== "" ? values.lostPassportDetails : passportForm.lostPassportDetails,
        profileId,
        redirectStep,
      });
      setRedirectStep(null);
    }
  }, [redirectStep, setRedirectStep, savePassport, profileId]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitPassport({ ...values, profileId, step: 3, isEditing });
  }

  function onSave() {
    const values = form.getValues();

    savePassport({
      passportNumber: values.passportNumber !== "" ? values.passportNumber : passportForm.passportNumber,
      passportCity: values.passportCity !== "" ? values.passportCity : passportForm.passportCity,
      passportState: values.passportState !== "" ? values.passportState : passportForm.passportState,
      passportIssuingCountry:
        values.passportIssuingCountry !== "" ? values.passportIssuingCountry : passportForm.passportIssuingCountry,
      passportIssuingDate: values.passportIssuingDate ?? passportForm.passportIssuingDate,
      passportExpireDate: values.passportExpireDate ?? passportForm.passportExpireDate,
      passportLostConfirmation: values.passportLostConfirmation ?? passportForm.passportLostConfirmation,
      lostPassportNumber:
        values.lostPassportNumber !== "" ? values.lostPassportNumber : passportForm.lostPassportNumber,
      lostPassportCountry:
        values.lostPassportCountry !== "" ? values.lostPassportCountry : passportForm.lostPassportCountry,
      lostPassportDetails:
        values.lostPassportDetails !== "" ? values.lostPassportDetails : passportForm.lostPassportDetails,
      profileId,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-6">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold mb-6">Passaporte</h2>

        <div className="w-full flex flex-col gap-12 justify-between flex-grow">
          <div className="w-full flex flex-col">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="passportNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Número do passaporte*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passportCity"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Cidade*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passportState"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Estado*</FormLabel>

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
                name="passportIssuingCountry"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">País emissor*</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passportIssuingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Data de emissão*</FormLabel>

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
                control={form.control}
                name="passportExpireDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">Data de expiração (caso tenha)</FormLabel>

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
                          disabled={(date) => date < new Date("1900-01-01")}
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={2100}
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

            <div className="w-full grid grid-cols-1 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="passportLostConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Você já perdeu um passaporte ou teve ele roubado?*
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
                hidden: passportLostConfirmation === "Não",
              })}
            >
              <FormField
                control={form.control}
                name="lostPassportNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Informe o número do passaporte</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lostPassportCountry"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Informe o país do passaporte</FormLabel>

                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </Select>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn("w-full grid grid-cols-1 gap-x-4 gap-y-6", {
                hidden: passportLostConfirmation === "Não",
              })}
            >
              <FormField
                control={form.control}
                name="lostPassportDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Explique o ocorrido</FormLabel>

                    <FormControl>
                      <Textarea disabled={isPending || isSavePending} className="!mt-auto resize-none" {...field} />
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
