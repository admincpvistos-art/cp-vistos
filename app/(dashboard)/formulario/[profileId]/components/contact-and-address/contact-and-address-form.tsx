"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { Form as FormType } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Plus, Save, X } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import { FIELD_HELP } from "@/lib/form-field-help";
import useFormStore from "@/constants/stores/useFormStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/constants";
import { ContactAndAddressFormType } from "@/types";

const formSchema = z
  .object({
    address: z.string().min(1, { message: "Campo obrigatório" }),
    addressNumber: z.string().min(1, { message: "Campo obrigatório" }),
    complement: z.string(),
    district: z.string().min(1, { message: "Campo obrigatório" }),
    city: z.string().min(1, { message: "Campo obrigatório" }),
    state: z.string().min(1, { message: "Campo obrigatório" }),
    cep: z.string().min(1, { message: "Campo obrigatório" }).min(9, { message: "CEP inválido" }),
    country: z.string().min(1, { message: "Campo obrigatório" }),
    postalAddressConfirmation: z.enum(["Sim", "Não"]),
    otherPostalAddress: z.string(),
    postalStreet: z.string(),
    postalAddressNumber: z.string(),
    postalComplement: z.string(),
    postalDistrict: z.string(),
    postalCity: z.string(),
    postalState: z.string(),
    postalCep: z.string(),
    postalCountry: z.string(),
    cel: z
      .string()
      .min(1, { message: "Campo obrigatório" })
      .trim()
      .refine((value) => /^[^a-zA-Z]+$/.test(value), {
        message: "Celular inválido",
      }),
    tel: z
      .string()
      .trim()
      .refine((value) => value === "" || /^[^a-zA-Z]+$/.test(value), {
        message: "Celular inválido",
      }),
    workPhone: z
      .string()
      .trim()
      .refine((value) => value === "" || /^[^a-zA-Z]+$/.test(value), {
        message: "Telefone inválido",
      }),
    fiveYearsOtherTelConfirmation: z.enum(["Sim", "Não"]),
    otherTel: z.array(z.string().min(1)).optional(),
    email: z.string().trim().min(1, { message: "Campo obrigatório" }).email({ message: "E-mail inválido" }),
    fiveYearsOtherEmailConfirmation: z.enum(["Sim", "Não"]),
    otherEmail: z.union([z.literal(""), z.string().trim().email({ message: "E-mail inválido" })]),
    facebook: z.string(),
    linkedin: z.string(),
    instagram: z.string(),
    othersSocialMedia: z.string(),
  })
  .superRefine(
    (
      {
        tel,
        postalAddressConfirmation,
        otherPostalAddress,
        postalStreet,
        postalAddressNumber,
        postalDistrict,
        postalCity,
        postalState,
        postalCep,
        postalCountry,
        fiveYearsOtherTelConfirmation,
        otherTel,
        fiveYearsOtherEmailConfirmation,
        otherEmail,
      },
      ctx,
    ) => {
      if (postalAddressConfirmation === "Sim" && postalStreet.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["postalStreet"],
        });
      }

      if (postalAddressConfirmation === "Sim" && postalAddressNumber.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["postalAddressNumber"],
        });
      }

      if (postalAddressConfirmation === "Sim" && postalDistrict.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["postalDistrict"],
        });
      }

      if (postalAddressConfirmation === "Sim" && postalCity.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["postalCity"],
        });
      }

      if (postalAddressConfirmation === "Sim" && postalState.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["postalState"],
        });
      }

      if (postalAddressConfirmation === "Sim" && postalCep.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["postalCep"],
        });
      }

      if (postalAddressConfirmation === "Sim" && postalCountry.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["postalCountry"],
        });
      }

      if (fiveYearsOtherTelConfirmation === "Sim" && (otherTel === undefined || otherTel.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Preencha e clique no botão "+" para adicionar o telefone',
          path: ["otherTel"],
        });
      }

      if (fiveYearsOtherEmailConfirmation === "Sim" && (otherEmail === undefined || otherEmail.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo vazio, preencha para prosseguir",
          path: ["otherEmail"],
        });
      }
    },
  );

interface Props {
  profileId: string;
  contactAndAddressForm: ContactAndAddressFormType;
  isEditing: boolean;
}

export function ContactAndAddressForm({ contactAndAddressForm, profileId, isEditing }: Props) {
  const [otherTelValue, setOtherTelValue] = useState("");

  const { redirectStep, setRedirectStep } = useFormStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: contactAndAddressForm.address ? contactAndAddressForm.address : "",
      addressNumber: contactAndAddressForm.addressNumber ? contactAndAddressForm.addressNumber : "",
      complement: contactAndAddressForm.complement ? contactAndAddressForm.complement : "",
      district: contactAndAddressForm.district ? contactAndAddressForm.district : "",
      city: contactAndAddressForm.city ? contactAndAddressForm.city : "",
      state: contactAndAddressForm.state ? contactAndAddressForm.state : "",
      cep: contactAndAddressForm.cep ? contactAndAddressForm.cep : "",
      country: contactAndAddressForm.country ? contactAndAddressForm.country : "",
      postalAddressConfirmation: contactAndAddressForm.postalAddressConfirmation ? "Sim" : "Não",
      otherPostalAddress: contactAndAddressForm.otherPostalAddress ? contactAndAddressForm.otherPostalAddress : "",
      postalStreet: contactAndAddressForm.postalStreet ? contactAndAddressForm.postalStreet : "",
      postalAddressNumber: contactAndAddressForm.postalAddressNumber ? contactAndAddressForm.postalAddressNumber : "",
      postalComplement: contactAndAddressForm.postalComplement ? contactAndAddressForm.postalComplement : "",
      postalDistrict: contactAndAddressForm.postalDistrict ? contactAndAddressForm.postalDistrict : "",
      postalCity: contactAndAddressForm.postalCity ? contactAndAddressForm.postalCity : "",
      postalState: contactAndAddressForm.postalState ? contactAndAddressForm.postalState : "",
      postalCep: contactAndAddressForm.postalCep ? contactAndAddressForm.postalCep : "",
      postalCountry: contactAndAddressForm.postalCountry ? contactAndAddressForm.postalCountry : "",
      cel: contactAndAddressForm.cel ? contactAndAddressForm.cel : "",
      tel: contactAndAddressForm.tel ? contactAndAddressForm.tel : "",
      workPhone: contactAndAddressForm.workPhone ? contactAndAddressForm.workPhone : "",
      fiveYearsOtherTelConfirmation: contactAndAddressForm.fiveYearsOtherTelConfirmation ? "Sim" : "Não",
      otherTel: contactAndAddressForm.otherTel ? contactAndAddressForm.otherTel : [],
      email: contactAndAddressForm.email ? contactAndAddressForm.email : "",
      fiveYearsOtherEmailConfirmation: contactAndAddressForm.fiveYearsOtherEmailConfirmation ? "Sim" : "Não",
      otherEmail: contactAndAddressForm.otherEmail ? contactAndAddressForm.otherEmail : "",
      facebook: contactAndAddressForm.facebook ? contactAndAddressForm.facebook : "",
      linkedin: contactAndAddressForm.linkedin ? contactAndAddressForm.linkedin : "",
      instagram: contactAndAddressForm.instagram ? contactAndAddressForm.instagram : "",
      othersSocialMedia: contactAndAddressForm.othersSocialMedia ? contactAndAddressForm.othersSocialMedia : "",
    },
  });

  const postalAddressConfirmation: "Sim" | "Não" = form.watch("postalAddressConfirmation");
  const fiveYearsOtherTelConfirmation: "Sim" | "Não" = form.watch("fiveYearsOtherTelConfirmation");
  const fiveYearsOtherEmailConfirmation: "Sim" | "Não" = form.watch("fiveYearsOtherEmailConfirmation");
  const otherTel = form.watch("otherTel");
  const utils = trpc.useUtils();
  const router = useRouter();

  const { mutate: submitContactAndAddress, isPending } = trpc.formsRouter.submitContactAndAddress.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.formsRouter.getForm.invalidate();

      if (data.isEditing) {
        router.push(`/resumo-formulario/${profileId}`);
      } else {
        router.push(`/formulario/${profileId}?formStep=2`);
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
  const { mutate: saveContactAndAddress, isPending: isSavePending } =
    trpc.formsRouter.saveContactAndAddress.useMutation({
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

      saveContactAndAddress({
        profileId,
        redirectStep,
        address: values.address !== "" ? values.address : contactAndAddressForm.address,
        addressNumber: values.addressNumber !== "" ? values.addressNumber : contactAndAddressForm.addressNumber,
        complement: values.complement !== "" ? values.complement : contactAndAddressForm.complement,
        district: values.district !== "" ? values.district : contactAndAddressForm.district,
        city: values.city !== "" ? values.city : contactAndAddressForm.city,
        state: values.state !== "" ? values.state : contactAndAddressForm.state,
        cep: values.cep !== "" ? values.cep : contactAndAddressForm.cep,
        country: values.country !== "" ? values.country : contactAndAddressForm.country,
        postalAddressConfirmation:
          values.postalAddressConfirmation ?? (contactAndAddressForm.postalAddressConfirmation ? "Sim" : "Não"),
        otherPostalAddress:
          values.otherPostalAddress !== "" ? values.otherPostalAddress : contactAndAddressForm.otherPostalAddress,
        postalStreet: values.postalStreet !== "" ? values.postalStreet : contactAndAddressForm.postalStreet,
        postalAddressNumber:
          values.postalAddressNumber !== "" ? values.postalAddressNumber : contactAndAddressForm.postalAddressNumber,
        postalComplement:
          values.postalComplement !== "" ? values.postalComplement : contactAndAddressForm.postalComplement,
        postalDistrict: values.postalDistrict !== "" ? values.postalDistrict : contactAndAddressForm.postalDistrict,
        postalCity: values.postalCity !== "" ? values.postalCity : contactAndAddressForm.postalCity,
        postalState: values.postalState !== "" ? values.postalState : contactAndAddressForm.postalState,
        postalCep: values.postalCep !== "" ? values.postalCep : contactAndAddressForm.postalCep,
        postalCountry: values.postalCountry !== "" ? values.postalCountry : contactAndAddressForm.postalCountry,
        cel: values.cel !== "" ? values.cel : contactAndAddressForm.cel,
        tel: values.tel !== "" ? values.tel : contactAndAddressForm.tel,
        workPhone: values.workPhone !== "" ? values.workPhone : contactAndAddressForm.workPhone,
        fiveYearsOtherTelConfirmation:
          values.fiveYearsOtherTelConfirmation ?? (contactAndAddressForm.fiveYearsOtherTelConfirmation ? "Sim" : "Não"),
        otherTel: values.otherTel && values.otherTel !== undefined ? values.otherTel : contactAndAddressForm.otherTel,
        email: values.email !== "" ? values.email : contactAndAddressForm.email,
        fiveYearsOtherEmailConfirmation:
          values.fiveYearsOtherEmailConfirmation ??
          (contactAndAddressForm.fiveYearsOtherEmailConfirmation ? "Sim" : "Não"),
        otherEmail: values.otherEmail !== "" ? values.otherEmail : contactAndAddressForm.otherEmail,
        facebook: values.facebook !== "" ? values.facebook : contactAndAddressForm.facebook,
        linkedin: values.linkedin !== "" ? values.linkedin : contactAndAddressForm.linkedin,
        instagram: values.instagram !== "" ? values.instagram : contactAndAddressForm.instagram,
        othersSocialMedia:
          values.othersSocialMedia !== "" ? values.othersSocialMedia : contactAndAddressForm.othersSocialMedia,
      });
      setRedirectStep(null);
    }
  }, [redirectStep, setRedirectStep, saveContactAndAddress, profileId]);

  function handleAddOtherTelInput() {
    if (otherTelValue === "") {
      return;
    }

    const currentNames = otherTel ?? [];

    if (currentNames.includes(otherTelValue)) {
      toast.error("Número já foi adicionado");

      return;
    }

    currentNames.push(otherTelValue);

    form.setValue("otherTel", currentNames);
    setOtherTelValue("");
  }

  function handleRemoveOtherTel(index: number) {
    const currentNames = otherTel ?? [];

    if (currentNames.length === 0) {
      return;
    }

    const namesUpdated = currentNames.filter((_, nameIndex) => nameIndex !== index);

    form.setValue("otherTel", namesUpdated);
  }

  function handleCEPContactAndAddressChange(event: ChangeEvent<HTMLInputElement>) {
    let value = event.target.value.replace(/[^\d]/g, "");

    value = value.replace(/(\d{5})(\d{3})/, "$1-$2");

    form.setValue("cep", value);
  }

  function handleCEPPostalChange(event: ChangeEvent<HTMLInputElement>) {
    let value = event.target.value.replace(/[^\d]/g, "");
    value = value.replace(/(\d{5})(\d{3})/, "$1-$2");
    form.setValue("postalCep", value);
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitContactAndAddress({ ...values, profileId, step: 2, isEditing });
  }

  function onSave() {
    const values = form.getValues();

    saveContactAndAddress({
      profileId,
      address: values.address !== "" ? values.address : contactAndAddressForm.address,
      addressNumber: values.addressNumber !== "" ? values.addressNumber : contactAndAddressForm.addressNumber,
      complement: values.complement !== "" ? values.complement : contactAndAddressForm.complement,
      district: values.district !== "" ? values.district : contactAndAddressForm.district,
      city: values.city !== "" ? values.city : contactAndAddressForm.city,
      state: values.state !== "" ? values.state : contactAndAddressForm.state,
      cep: values.cep !== "" ? values.cep : contactAndAddressForm.cep,
      country: values.country !== "" ? values.country : contactAndAddressForm.country,
      postalAddressConfirmation:
        values.postalAddressConfirmation ?? (contactAndAddressForm.postalAddressConfirmation ? "Sim" : "Não"),
      otherPostalAddress:
        values.otherPostalAddress !== "" ? values.otherPostalAddress : contactAndAddressForm.otherPostalAddress,
      postalStreet: values.postalStreet !== "" ? values.postalStreet : contactAndAddressForm.postalStreet,
      postalAddressNumber:
        values.postalAddressNumber !== "" ? values.postalAddressNumber : contactAndAddressForm.postalAddressNumber,
      postalComplement:
        values.postalComplement !== "" ? values.postalComplement : contactAndAddressForm.postalComplement,
      postalDistrict: values.postalDistrict !== "" ? values.postalDistrict : contactAndAddressForm.postalDistrict,
      postalCity: values.postalCity !== "" ? values.postalCity : contactAndAddressForm.postalCity,
      postalState: values.postalState !== "" ? values.postalState : contactAndAddressForm.postalState,
      postalCep: values.postalCep !== "" ? values.postalCep : contactAndAddressForm.postalCep,
      postalCountry: values.postalCountry !== "" ? values.postalCountry : contactAndAddressForm.postalCountry,
      cel: values.cel !== "" ? values.cel : contactAndAddressForm.cel,
      tel: values.tel !== "" ? values.tel : contactAndAddressForm.tel,
      workPhone: values.workPhone !== "" ? values.workPhone : contactAndAddressForm.workPhone,
      fiveYearsOtherTelConfirmation:
        values.fiveYearsOtherTelConfirmation ?? (contactAndAddressForm.fiveYearsOtherTelConfirmation ? "Sim" : "Não"),
      otherTel: values.otherTel && values.otherTel !== undefined ? values.otherTel : contactAndAddressForm.otherTel,
      email: values.email !== "" ? values.email : contactAndAddressForm.email,
      fiveYearsOtherEmailConfirmation:
        values.fiveYearsOtherEmailConfirmation ??
        (contactAndAddressForm.fiveYearsOtherEmailConfirmation ? "Sim" : "Não"),
      otherEmail: values.otherEmail !== "" ? values.otherEmail : contactAndAddressForm.otherEmail,
      facebook: values.facebook !== "" ? values.facebook : contactAndAddressForm.facebook,
      linkedin: values.linkedin !== "" ? values.linkedin : contactAndAddressForm.linkedin,
      instagram: values.instagram !== "" ? values.instagram : contactAndAddressForm.instagram,
      othersSocialMedia:
        values.othersSocialMedia !== "" ? values.othersSocialMedia : contactAndAddressForm.othersSocialMedia,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col flex-grow gap-6">
        <h2 className="w-full text-center text-2xl sm:text-3xl text-foreground font-semibold mb-6">
          Endereço e Contatos
        </h2>

        <span className="text-foreground text-base font-medium">Endereço de sua residencia</span>

        <div className="w-full flex flex-col gap-12 justify-between flex-grow">
          <div className="w-full flex flex-col">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm" help={FIELD_HELP.residenceAddress}>
                      Endereço Residencial*
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
                name="addressNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm" help={FIELD_HELP.residenceAddress}>
                      Número do Endereço*
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
                name="district"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Bairro*</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Complemento</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">CEP*</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={isPending || isSavePending}
                        maxLength={9}
                        value={field.value}
                        ref={field.ref}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={handleCEPContactAndAddressChange}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
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
                name="state"
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

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">País*</FormLabel>

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

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-10">
              <FormField
                control={form.control}
                name="postalAddressConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground">
                      Seu endereço de correio é diferente do endereço de sua residência?*
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

            {postalAddressConfirmation === "Sim" && (
              <div className="w-full bg-secondary rounded-xl p-4 mb-10 flex flex-col gap-6">
                <span className="text-foreground text-base font-medium">Endereço de correspondência</span>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
                  <FormField
                    control={form.control}
                    name="postalStreet"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-foreground text-sm">Endereço*</FormLabel>
                        <FormControl>
                          <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalAddressNumber"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-foreground text-sm">Número*</FormLabel>
                        <FormControl>
                          <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalDistrict"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-foreground text-sm">Bairro*</FormLabel>
                        <FormControl>
                          <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalComplement"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-foreground text-sm">Complemento</FormLabel>
                        <FormControl>
                          <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-6">
                  <FormField
                    control={form.control}
                    name="postalCep"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-foreground text-sm">CEP*</FormLabel>
                        <FormControl>
                          <Input
                            className="!mt-auto"
                            disabled={isPending || isSavePending}
                            maxLength={9}
                            value={field.value}
                            ref={field.ref}
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={handleCEPPostalChange}
                          />
                        </FormControl>
                        <FormMessage className="text-sm text-destructive" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCity"
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
                    name="postalState"
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
                  <FormField
                    control={form.control}
                    name="postalCountry"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-foreground text-sm">País*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="!mt-auto" disabled={isPending || isSavePending}>
                              <SelectValue placeholder="Selecione o país" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem value={country} key={`postal-${country}`}>
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
              </div>
            )}

            <span className="text-foreground text-base font-medium mb-6">Telefone</span>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <FormField
                control={form.control}
                name="cel"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm" help={FIELD_HELP.cellPhone}>
                      Celular*
                    </FormLabel>

                    <FormControl>
                      <Input disabled={isPending || isSavePending} placeholder="Insira seu celular..." {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tel"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">Fixo</FormLabel>

                    <FormControl>
                      <Input
                        disabled={isPending || isSavePending}
                        placeholder="Insira seu telefone fixo..."
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workPhone"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm" help={FIELD_HELP.workPhone}>
                      Telefone comercial
                    </FormLabel>

                    <FormControl>
                      <Input
                        disabled={isPending || isSavePending}
                        placeholder="Insira seu telefone comercial..."
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm">E-mail*</FormLabel>

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
                name="fiveYearsOtherTelConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.phonesLast5Years}>
                      Nos últimos 5 anos você usou outros números de telefone?*
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

              {/* TODO: adicionar mais de um telefone (Array) */}
              <FormField
                control={form.control}
                name="otherTel"
                render={({ field }) => (
                  <FormItem
                    className={cn("w-full bg-secondary p-4 flex flex-col gap-2", {
                      hidden: fiveYearsOtherTelConfirmation === "Não",
                    })}
                  >
                    <FormLabel className="text-foreground text-sm">Informe seu outro telefone</FormLabel>

                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 justify-between">
                          <Input
                            disabled={isPending || isSavePending}
                            placeholder="Insira seu outro telefone"
                            {...field}
                            value={otherTelValue}
                            onChange={(e) => setOtherTelValue(e.target.value)}
                          />

                          <Button
                            type="button"
                            size="xl"
                            className="px-3"
                            disabled={isPending}
                            onClick={handleAddOtherTelInput}
                          >
                            <Plus />
                          </Button>
                        </div>

                        {otherTel && (
                          <div className="w-full flex flex-wrap gap-2">
                            {otherTel.map((tel, index) => (
                              <div
                                key={`otherName-${index}`}
                                className="py-2 px-4 bg-primary/40 rounded-full flex items-center gap-2 group"
                              >
                                <span className="text-sm font-medium text-white">{tel}</span>

                                <Button
                                  type="button"
                                  variant="link"
                                  size="icon"
                                  className="size-5 hidden opacity-0 transition-all group-hover:block group-hover:opacity-100"
                                  disabled={isPending || isSavePending}
                                  onClick={() => handleRemoveOtherTel(index)}
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

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-10">
              <FormField
                control={form.control}
                name="fiveYearsOtherEmailConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground" help={FIELD_HELP.emailsLast5Years}>
                      Nos últimos 5 anos você teve outros e-mails?*
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
                name="otherEmail"
                render={({ field }) => (
                  <FormItem
                    className={cn("w-full bg-secondary p-4 flex flex-col gap-2", {
                      hidden: fiveYearsOtherEmailConfirmation === "Não",
                    })}
                  >
                    <FormLabel className="text-foreground text-sm">Informe seu outro e-mail</FormLabel>

                    <FormControl>
                      <Input className="!mt-auto" disabled={isPending || isSavePending} {...field} />
                    </FormControl>

                    <FormMessage className="text-sm text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            <span className="text-foreground text-base font-medium mb-6">Redes sociais (Somente @ ou nome)</span>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm" help={FIELD_HELP.socialMedia}>
                      Facebook
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
                name="linkedin"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm" help={FIELD_HELP.socialMedia}>
                      Linkedin
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
                name="instagram"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm" help={FIELD_HELP.socialMedia}>
                      Instagram
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
                name="othersSocialMedia"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel className="text-foreground text-sm" help={FIELD_HELP.socialMedia}>
                      Outras Redes
                    </FormLabel>

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
