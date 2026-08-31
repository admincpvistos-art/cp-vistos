"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Form as FormType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Save } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { FormSectionHelp } from "@/components/form/field-help";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import { FIELD_HELP, SECTION_HELP } from "@/lib/form-field-help";
import useFormStore from "@/constants/stores/useFormStore";
import { USAContactFormType } from "@/types";

const formSchema = z
  .object({
    hasUSAOrganizationOrResident: z.enum(["Sim", "Não"]),
    organizationOrUSAResidentName: z.string(),
    organizationOrUSAResidentRelation: z.string(),
    organizationOrUSAResidentAddress: z.string(),
    organizationOrUSAResidentZipCode: z.string(),
    organizationOrUSAResidentCity: z.string(),
    organizationOrUSAResidentState: z.string(),
    organizationOrUSAResidentTel: z
      .string()
      .trim()
      .refine((value) => value === "" || /^[^a-zA-Z]+$/.test(value), {
        message: "Celular inválido",
      }),
    organizationOrUSAResidentEmail: z.string().trim(),
  })
  .superRefine(
    (
      {
        hasUSAOrganizationOrResident,
        organizationOrUSAResidentName,
        organizationOrUSAResidentRelation,
        organizationOrUSAResidentAddress,
        organizationOrUSAResidentZipCode,
        organizationOrUSAResidentCity,
        organizationOrUSAResidentState,
        organizationOrUSAResidentTel,
      },
      ctx,
    ) => {
      if (hasUSAOrganizationOrResident === "Sim" && organizationOrUSAResidentName === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["organizationOrUSAResidentName"],
        });
      }

      if (hasUSAOrganizationOrResident === "Sim" && organizationOrUSAResidentRelation === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["organizationOrUSAResidentRelation"],
        });
      }

      if (hasUSAOrganizationOrResident === "Sim" && organizationOrUSAResidentAddress === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["organizationOrUSAResidentAddress"],
        });
      }

      if (hasUSAOrganizationOrResident === "Sim" && organizationOrUSAResidentZipCode === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["organizationOrUSAResidentZipCode"],
        });
      }

      if (hasUSAOrganizationOrResident === "Sim" && organizationOrUSAResidentCity === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["organizationOrUSAResidentCity"],
        });
      }

      if (hasUSAOrganizationOrResident === "Sim" && organizationOrUSAResidentState === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["organizationOrUSAResidentState"],
        });
      }

      if (hasUSAOrganizationOrResident === "Sim" && organizationOrUSAResidentTel === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["organizationOrUSAResidentTel"],
        });
      }
    },
  );

interface Props {
  profileId: string;
  usaContactForm: USAContactFormType;
  isEditing: boolean;
}

export function USAContactForm({ usaContactForm, profileId, isEditing }: Props) {
  const { redirectStep, setRedirectStep } = useFormStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasUSAOrganizationOrResident: usaContactForm.hasUSAOrganizationOrResident ? "Sim" : "Não",
      organizationOrUSAResidentName: usaContactForm.organizationOrUSAResidentName
        ? usaContactForm.organizationOrUSAResidentName
        : "",
      organizationOrUSAResidentRelation: usaContactForm.organizationOrUSAResidentRelation
        ? usaContactForm.organizationOrUSAResidentRelation
        : "",
      organizationOrUSAResidentAddress: usaContactForm.organizationOrUSAResidentAddress
        ? usaContactForm.organizationOrUSAResidentAddress
        : "",
      organizationOrUSAResidentZipCode: usaContactForm.organizationOrUSAResidentZipCode
        ? usaContactForm.organizationOrUSAResidentZipCode
        : "",
      organizationOrUSAResidentCity: usaContactForm.organizationOrUSAResidentCity
        ? usaContactForm.organizationOrUSAResidentCity
        : "",
      organizationOrUSAResidentState: usaContactForm.organizationOrUSAResidentState
        ? usaContactForm.organizationOrUSAResidentState
        : "",
      organizationOrUSAResidentTel: usaContactForm.organizationOrUSAResidentTel
        ? usaContactForm.organizationOrUSAResidentTel
        : "",
      organizationOrUSAResidentEmail: usaContactForm.organizationOrUSAResidentEmail
        ? usaContactForm.organizationOrUSAResidentEmail
        : "",
    },
  });

  const hasUSAOrganizationOrResident = form.watch("hasUSAOrganizationOrResident");
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutate: submitUsaContact, isPending } = trpc.formsRouter.submitUsaContact.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.isEditing) {
        router.push(`/resumo-formulario/${profileId}`);
      } else {
        router.push(`/formulario/${profileId}?formStep=7`);
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
  const { mutate: saveUsaContact, isPending: isSavePending } = trpc.formsRouter.saveUsaContact.useMutation({
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

      saveUsaContact({
        profileId,
        redirectStep,
        hasUSAOrganizationOrResident:
          values.hasUSAOrganizationOrResident ?? (usaContactForm.hasUSAOrganizationOrResident ? "Sim" : "Não"),
        organizationOrUSAResidentName:
          values.organizationOrUSAResidentName !== ""
            ? values.organizationOrUSAResidentName
            : !usaContactForm.organizationOrUSAResidentName
              ? ""
              : usaContactForm.organizationOrUSAResidentName,
        organizationOrUSAResidentRelation:
          values.organizationOrUSAResidentRelation !== ""
            ? values.organizationOrUSAResidentRelation
            : !usaContactForm.organizationOrUSAResidentRelation
              ? ""
              : usaContactForm.organizationOrUSAResidentRelation,
        organizationOrUSAResidentAddress:
          values.organizationOrUSAResidentAddress !== ""
            ? values.organizationOrUSAResidentAddress
            : !usaContactForm.organizationOrUSAResidentAddress
              ? ""
              : usaContactForm.organizationOrUSAResidentAddress,
        organizationOrUSAResidentZipCode:
          values.organizationOrUSAResidentZipCode !== ""
            ? values.organizationOrUSAResidentZipCode
            : !usaContactForm.organizationOrUSAResidentZipCode
              ? ""
              : usaContactForm.organizationOrUSAResidentZipCode,
        organizationOrUSAResidentCity:
          values.organizationOrUSAResidentCity !== ""
            ? values.organizationOrUSAResidentCity
            : !usaContactForm.organizationOrUSAResidentCity
              ? ""
              : usaContactForm.organizationOrUSAResidentCity,
        organizationOrUSAResidentState:
          values.organizationOrUSAResidentState !== ""
            ? values.organizationOrUSAResidentState
            : !usaContactForm.organizationOrUSAResidentState
              ? ""
              : usaContactForm.organizationOrUSAResidentState,
        organizationOrUSAResidentTel:
          values.organizationOrUSAResidentTel !== ""
            ? values.organizationOrUSAResidentTel
            : !usaContactForm.organizationOrUSAResidentTel
              ? ""
              : usaContactForm.organizationOrUSAResidentTel,
        organizationOrUSAResidentEmail:
          values.organizationOrUSAResidentEmail !== ""
            ? values.organizationOrUSAResidentEmail
            : !usaContactForm.organizationOrUSAResidentEmail
              ? ""
              : usaContactForm.organizationOrUSAResidentEmail,
      });
      setRedirectStep(null);
    }
  }, [redirectStep, setRedirectStep, saveUsaContact, profileId]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitUsaContact({ ...values, profileId, step: 7, isEditing });
  }

  function onSave() {
    const values = form.getValues();

    saveUsaContact({
      profileId,
      hasUSAOrganizationOrResident:
        values.hasUSAOrganizationOrResident ?? (usaContactForm.hasUSAOrganizationOrResident ? "Sim" : "Não"),
      organizationOrUSAResidentName:
        values.organizationOrUSAResidentName !== ""
          ? values.organizationOrUSAResidentName
          : !usaContactForm.organizationOrUSAResidentName
            ? ""
            : usaContactForm.organizationOrUSAResidentName,
      organizationOrUSAResidentRelation:
        values.organizationOrUSAResidentRelation !== ""
          ? values.organizationOrUSAResidentRelation
          : !usaContactForm.organizationOrUSAResidentRelation
            ? ""
            : usaContactForm.organizationOrUSAResidentRelation,
      organizationOrUSAResidentAddress:
        values.organizationOrUSAResidentAddress !== ""
          ? values.organizationOrUSAResidentAddress
          : !usaContactForm.organizationOrUSAResidentAddress
            ? ""
            : usaContactForm.organizationOrUSAResidentAddress,
      organizationOrUSAResidentZipCode:
        values.organizationOrUSAResidentZipCode !== ""
          ? values.organizationOrUSAResidentZipCode
          : !usaContactForm.organizationOrUSAResidentZipCode
            ? ""
            : usaContactForm.organizationOrUSAResidentZipCode,
      organizationOrUSAResidentCity:
        values.organizationOrUSAResidentCity !== ""
          ? values.organizationOrUSAResidentCity
          : !usaContactForm.organizationOrUSAResidentCity
            ? ""
            : usaContactForm.organizationOrUSAResidentCity,
      organizationOrUSAResidentState:
        values.organizationOrUSAResidentState !== ""
          ? values.organizationOrUSAResidentState
          : !usaContactForm.organizationOrUSAResidentState
            ? ""
            : usaContactForm.organizationOrUSAResidentState,
      organizationOrUSAResidentTel:
        values.organizationOrUSAResidentTel !== ""
          ? values.organizationOrUSAResidentTel
          : !usaContactForm.organizationOrUSAResidentTel
            ? ""
            : usaContactForm.organizationOrUSAResidentTel,
      organizationOrUSAResidentEmail:
        values.organizationOrUSAResidentEmail !== ""
          ? values.organizationOrUSAResidentEmail
          : !usaContactForm.organizationOrUSAResidentEmail
            ? ""
            : usaContactForm.organizationOrUSAResidentEmail,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-6">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold mb-6">
          Contato nos Estados Unidos
        </h2>

        <FormSectionHelp items={[...SECTION_HELP.usaContact]} className="mb-6" />

        <div className="w-full flex flex-col gap-12 justify-between flex-grow">
          <div className="w-full flex flex-col">
            <FormField
              control={form.control}
              name="hasUSAOrganizationOrResident"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 mb-6">
                  <FormLabel className="text-foreground" help={FIELD_HELP.usaContactSection}>
                    Você possui contato com alguém dos EUA?
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

            <div
              className={cn(
                "w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6",
                hasUSAOrganizationOrResident === "Não" && "hidden",
              )}
            >
              <FormField
                control={form.control}
                name="organizationOrUSAResidentName"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Nome completo da pessoa ou Organização*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationOrUSAResidentRelation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Qual é a relação do contato com você?*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationOrUSAResidentAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Endereço do contato nos EUA*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={cn(
                "w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6",
                hasUSAOrganizationOrResident === "Não" && "hidden",
              )}
            >
              <FormField
                control={form.control}
                name="organizationOrUSAResidentZipCode"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Zip code*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} maxLength={5} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationOrUSAResidentCity"
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
                name="organizationOrUSAResidentState"
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

            <div
              className={cn(
                "w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6",
                hasUSAOrganizationOrResident === "Não" && "hidden",
              )}
            >
              <FormField
                control={form.control}
                name="organizationOrUSAResidentTel"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Telefone*</FormLabel>

                    <FormControl>
                      <Input disabled={isPending || isSavePending} placeholder="Insira seu telefone..." {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationOrUSAResidentEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">E-mail</FormLabel>

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
