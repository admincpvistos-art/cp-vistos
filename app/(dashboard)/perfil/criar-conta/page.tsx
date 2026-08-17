"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import useUserStore from "@/constants/stores/useUserStore";
import { useSubmitConfirmationStore } from "@/constants/stores/useSubmitConfirmationStore";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AccountForm } from "./components/account-form";
import { ProfileForm } from "./components/profile-form";
import { SubmitConfirmationModal } from "@/app/(dashboard)/perfil/criar-conta/components/submit-confirmation-modal";
import { canCreateClientAccounts } from "@/lib/staff-access";
import { trpc } from "@/lib/trpc-client";

const profileFormSchema = z
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
        { message: "Classe de visto inválida" },
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

const accountFormSchema = z
  .object({
    name: z
      .string({
        required_error: "Nome é obrigatório",
        invalid_type_error: "Nome inválido",
      })
      .min(1, { message: "Nome é obrigatório" })
      .min(4, { message: "Nome precisa ter no mínimo 4 caracteres" }),
    cpf: z
      .string({
        required_error: "CPF é obrigatório",
        invalid_type_error: "CPF inválido",
      })
      .refine((val) => val.length > 0 && val.length === 14, {
        message: "CPF inválido",
      }),
    group: z
      .string({
        required_error: "Grupo é obrigatório",
        invalid_type_error: "Grupo inválido",
      })
      .optional(),
    cel: z
      .string({
        required_error: "Celular é obrigatório",
        invalid_type_error: "Celular inválido",
      })
      .trim()
      .refine((value) => /^[^a-zA-Z]+$/.test(value), {
        message: "Celular inválido",
      })
      .optional(),
    address: z.string({
      required_error: "Endereço é obrigatório",
      invalid_type_error: "Endereço inválido",
    }),
    email: z
      .string({
        required_error: "E-mail é obrigatório",
        invalid_type_error: "E-mail inválido",
      })
      .trim()
      .email({ message: "E-mail inválido" })
      .min(1, { message: "E-mail é obrigatório" })
      .toLowerCase(),
    password: z
      .string({
        required_error: "Senha é obrigatório",
        invalid_type_error: "Senha inválida",
      })
      .min(1, { message: "Senha é obrigatória" })
      .min(6, { message: "Senha precisa ter no mínimo 6 caracteres" }),
    passwordConfirm: z
      .string({
        required_error: "Confirmação da senha é obrigatório",
        invalid_type_error: "Confirmação da senha inválida",
      })
      .min(1, { message: "Confirmação da senha é obrigatório" })
      .min(6, {
        message: "Confirmação da senha precisa ter no mínimo 6 caracteres",
      }),
    emailScheduleAccount: z
      .string({
        required_error: "E-mail é obrigatório",
        invalid_type_error: "E-mail inválida",
      })
      .email("E-mail inválido")
      .min(1, "E-mail é obrigatório")
      .toLowerCase(),
    passwordScheduleAccount: z
      .string({
        required_error: "Senha é obrigatória",
        invalid_type_error: "Senha inválida",
      })
      .min(1, { message: "Senha é obrigatória" })
      .min(6, { message: "Senha precisa ter no mínimo 6 caracteres" }),
    passwordConfirmScheduleAccount: z
      .string({
        required_error: "Confirmação da senha é obrigatório",
        invalid_type_error: "Confirmação da senha inválida",
      })
      .min(1, { message: "Confirmação da senha é obrigatório" })
      .min(6, {
        message: "Confirmação da senha precisa ter no mínimo 6 caracteres",
      }),
    budget: z
      .string({
        required_error: "Valor é obrigatório",
        invalid_type_error: "Valor inválido",
      })
      .refine((val) => Number(val) >= 0, {
        message: "Valor precisa ser maior que zero",
      }),
    budgetPaid: z.enum(["", "Pago", "Pendente"], {
      message: "Status do pagamento é obrigatório",
    }),
    scheduleAccount: z.enum(["Ativado", "Inativo", ""], {
      message: "Conta de Agendamento é obrigatório",
    }),
    profiles: z.array(profileFormSchema).min(1, {
      message: "Precisa ter pelo menos um perfil vinculado a conta",
    }),
  })
  .superRefine(({ password, passwordConfirm, passwordScheduleAccount, passwordConfirmScheduleAccount }, ctx) => {
    if (passwordConfirm !== password) {
      ctx.addIssue({
        path: ["passwordConfirm"],
        code: "custom",
        message: "As senhas não coincidem, verifique e tente novamente",
      });
    }

    if (passwordConfirmScheduleAccount !== passwordScheduleAccount) {
      ctx.addIssue({
        path: ["passwordConfirmScheduleAccount"],
        code: "custom",
        message: "As senhas não coincidem, verifique e tente novamente",
      });
    }
  });

export type formValue = z.infer<typeof accountFormSchema>;
export type profileFormSchemaType = z.infer<typeof profileFormSchema>;
export type formType = UseFormReturn<formValue, any, undefined>;

export default function CreateAccountPage() {
  const [isProfileSameAsAccount, setIsProfileSameAsAccount] = useState<string>("true");
  const [currentProfile, setCurrentProfile] = useState<number>(0);
  const router = useRouter();

  const { openModal, setFormValues } = useSubmitConfirmationStore();
  const { role } = useUserStore();
  const { data: me, isLoading: loadingMe } = trpc.userRouter.getMe.useQuery(
    undefined,
    { retry: false },
  );

  useEffect(() => {
    if (loadingMe || !me) {
      return;
    }

    if (!canCreateClientAccounts(me.user.role, me.user.email)) {
      toast.error("Acesso não autorizado");
      router.push("/perfil/clientes");
    }
  }, [loadingMe, me, router]);

  const form = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      cpf: "",
      cel: "",
      group: "",
      address: "",
      email: "",
      password: "",
      passwordConfirm: "",
      emailScheduleAccount: "",
      passwordScheduleAccount: "",
      passwordConfirmScheduleAccount: "",
      budget: "0",
      budgetPaid: "",
      scheduleAccount: "",
      profiles: [
        {
          birthDate: "",
          DSNumber: "",
          passport: "",
          profileAddress: "",
          profileCpf: "",
          profileName: "",
          visaClass: "",
          visaType: "",
          category: "",
          issuanceDate: "",
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
      ],
    },
  });

  const name = form.watch("name");
  const cpf = form.watch("cpf");
  const address = form.watch("address");
  const profiles = form.watch("profiles");
  const category = form.watch(`profiles.${currentProfile}.category`);
  const profilesFields: {
    name: keyof profileFormSchemaType;
    value: string | undefined;
  }[] = [
    { name: "birthDate", value: "" },
    { name: "passport", value: "" },
    { name: "visaType", value: "" },
    { name: "visaClass", value: "" },
    { name: "category", value: "" },
    { name: "issuanceDate", value: "" },
    { name: "expireDate", value: "" },
    { name: "DSNumber", value: "" },
    { name: "responsibleCpf", value: "" },
    { name: "protocol", value: "" },
    { name: "paymentStatus", value: "" },
    { name: "scheduleDate", value: "" },
    { name: "scheduleTime", value: "" },
    { name: "scheduleLocation", value: "" },
    { name: "entryDate", value: "" },
    { name: "process", value: "" },
    { name: "ETAStatus", value: "" },
  ];
  // const { fields } = useFieldArray({ name: "profiles", control: form.control }); NOTE: exemplos para os formulário, adiciona fields dinamicamente

  // atualiza o index do profile quando é adicionar ou removido
  useEffect(() => {
    setCurrentProfile(profiles.length - 1);
  }, [profiles]);

  // atualiza os valores dos inputs quando o valor dos radios informando se o perfil é o mesmo da conta
  useEffect(() => {
    if (JSON.parse(isProfileSameAsAccount)) {
      form.setValue(`profiles.${currentProfile}.profileName`, name);
      form.setValue(`profiles.${currentProfile}.profileAddress`, address);
      form.setValue(`profiles.${currentProfile}.profileCpf`, cpf);
    }
  }, [isProfileSameAsAccount]);

  // atualiza o default value dos inputs dos perfis quando o index o perfil é atualizado
  useEffect(() => {
    if (JSON.parse(isProfileSameAsAccount) && currentProfile === 0) {
      form.setValue(`profiles.${currentProfile}.profileName`, name);
      form.setValue(`profiles.${currentProfile}.profileCpf`, cpf);
      form.setValue(`profiles.${currentProfile}.profileAddress`, address);
    } else {
      form.setValue(`profiles.${currentProfile}.profileName`, "");
      form.setValue(`profiles.${currentProfile}.profileCpf`, "");
      form.setValue(`profiles.${currentProfile}.profileAddress`, "");
    }

    profilesFields.map((profile) => {
      form.setValue(`profiles.${currentProfile}.${profile.name}`, profile.value);

      form.clearErrors(`profiles.${currentProfile}.${profile.name}`);
    });

    form.clearErrors(`profiles.${currentProfile}.profileName`);
    form.clearErrors(`profiles.${currentProfile}.profileCpf`);
    form.clearErrors(`profiles.${currentProfile}.profileAddress`);
  }, [currentProfile]);

  useEffect(() => {
    if (JSON.parse(isProfileSameAsAccount) && currentProfile === 0) {
      form.setValue(`profiles.${currentProfile}.profileName`, name);
      form.setValue(`profiles.${currentProfile}.profileCpf`, cpf);
      form.setValue(`profiles.${currentProfile}.profileAddress`, address);
    }

    profilesFields.map((profile) => {
      if (profile.name !== "category") {
        form.setValue(`profiles.${currentProfile}.${profile.name}`, profile.value);

        form.clearErrors(`profiles.${currentProfile}.${profile.name}`);
      }
    });
  }, [category]);

  function handleCPF(event: ChangeEvent<HTMLInputElement>) {
    let value = event.target.value.replace(/[^\d]/g, "");

    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    return value;
  }

  function addProfile() {
    form
      .trigger(
        [
          `profiles.${currentProfile}.profileName`,
          `profiles.${currentProfile}.profileCpf`,
          `profiles.${currentProfile}.birthDate`,
          `profiles.${currentProfile}.profileAddress`,
          `profiles.${currentProfile}.passport`,
          `profiles.${currentProfile}.visaType`,
          `profiles.${currentProfile}.visaClass`,
          `profiles.${currentProfile}.category`,
          `profiles.${currentProfile}.issuanceDate`,
          `profiles.${currentProfile}.expireDate`,
          `profiles.${currentProfile}.DSNumber`,
          `profiles.${currentProfile}.responsibleCpf`,
          `profiles.${currentProfile}.protocol`,
          `profiles.${currentProfile}.paymentStatus`,
          `profiles.${currentProfile}.scheduleDate`,
          `profiles.${currentProfile}.scheduleTime`,
          `profiles.${currentProfile}.scheduleLocation`,
          `profiles.${currentProfile}.entryDate`,
          `profiles.${currentProfile}.process`,
          `profiles.${currentProfile}.ETAStatus`,
        ],
        { shouldFocus: true },
      )
      .then(() => {
        console.log(form.formState.errors);
        if (Object.keys(form.formState.errors).length === 0) {
          form.setValue("profiles", [
            ...profiles,
            {
              profileName: "",
              profileCpf: "",
              birthDate: "",
              profileAddress: "",
              visaType: "",
              visaClass: "",
              category: "",
              issuanceDate: "",
              expireDate: "",
              DSNumber: "",
              passport: "",
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
          ]);

          setCurrentProfile((prev: number) => prev + 1);
        }
      });
  }

  function onSubmit() {
    if (profiles.length > 0) {
      form
        .trigger(
          [
            "name",
            "cpf",
            "group",
            "cel",
            "address",
            "email",
            "password",
            "passwordConfirm",
            "emailScheduleAccount",
            "passwordScheduleAccount",
            "passwordConfirmScheduleAccount",
            "budget",
            "budgetPaid",
            "scheduleAccount",
          ],
          {
            shouldFocus: true,
          },
        )
        .then(() => {
          if (Object.keys(form.formState.errors).length === 0) {
            const values = form.getValues();

            values.profiles = values.profiles.filter((_, index) => index !== values.profiles.length - 1);

            setFormValues(values);

            setTimeout(() => {
              openModal();
            }, 300);
          }
        });
    }
  }

  if (
    loadingMe ||
    !me ||
    !canCreateClientAccounts(me.user.role, me.user.email)
  ) {
    return (
      <div className="w-full min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-6 sm:px-16 lg:px-40 lg:container lg:mx-auto">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6 mt-6 lg:mt-12">Cadastro da Conta</h1>

      <Form {...form}>
        <form className="flex flex-col gap-y-12">
          <AccountForm
            isProfileSameAsAccount={isProfileSameAsAccount}
            currentProfile={currentProfile}
            nameFormValue={name}
            cpfFormValue={cpf}
            addressFormValue={address}
            role={role}
            form={form}
            handleCPF={handleCPF}
          />

          <div className="w-full h-px bg-muted" />

          <ProfileForm
            currentProfile={currentProfile}
            setCurrentProfile={setCurrentProfile}
            isProfileSameAsAccount={isProfileSameAsAccount}
            setIsProfileSameAsAccount={setIsProfileSameAsAccount}
            profiles={profiles}
            category={category}
            form={form}
            handleCPF={handleCPF}
          />

          <div className="flex flex-col sm:flex-row gap-6 mb-12">
            <Button
              onClick={addProfile}
              disabled={category === ""}
              type="button"
              variant="outline"
              size="xl"
              className="w-full order-2 sm:order-1 sm:w-fit"
            >
              Adicionar Perfil
            </Button>

            <Button
              onClick={onSubmit}
              disabled={profiles.length === 1}
              type="button"
              variant="confirm"
              size="xl"
              className="w-full order-1 sm:order-2 sm:w-fit"
            >
              Enviar
            </Button>
          </div>
        </form>
      </Form>

      <SubmitConfirmationModal isCollaborator={role === "COLLABORATOR"} />
    </div>
  );
}
