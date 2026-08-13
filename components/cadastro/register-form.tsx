"use client";

import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Trash2, UserPlus } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { trpc } from "@/lib/trpc-client";

const personSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(4, "Nome completo precisa ter no mínimo 4 caracteres"),
    cpf: z.string().refine((val) => val.length === 14, "CPF inválido"),
    wantsAmericanVisa: z.boolean(),
    wantsPassport: z.boolean(),
  })
  .refine((person) => person.wantsAmericanVisa || person.wantsPassport, {
    message: "Selecione pelo menos um serviço",
    path: ["wantsAmericanVisa"],
  });

type PersonInput = z.infer<typeof personSchema>;

const emptyPerson: PersonInput = {
  name: "",
  cpf: "",
  wantsAmericanVisa: false,
  wantsPassport: false,
};

function cpfDigits(value: string) {
  return value.replace(/\D/g, "");
}

const formSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(4, "Nome completo precisa ter no mínimo 4 caracteres"),
    cpf: z.string().refine((val) => val.length === 14, "CPF inválido"),
    email: z
      .string()
      .trim()
      .min(1, "E-mail obrigatório")
      .email("E-mail inválido")
      .toLowerCase(),
    password: z.string().min(6, "Senha precisa ter no mínimo 6 caracteres"),
    passwordConfirm: z
      .string()
      .min(6, "Confirmação precisa ter no mínimo 6 caracteres"),
    additionalPeople: z.array(personSchema).optional().default([]),
    wantsAmericanVisa: z.boolean(),
    wantsPassport: z.boolean(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "As senhas não coincidem",
    path: ["passwordConfirm"],
  })
  .refine((data) => data.wantsAmericanVisa || data.wantsPassport, {
    message: "Selecione pelo menos um serviço",
    path: ["wantsAmericanVisa"],
  });

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function ServiceChoice({
  visaChecked,
  passportChecked,
  onVisaChange,
  onPassportChange,
  disabled,
  error,
}: {
  visaChecked: boolean;
  passportChecked: boolean;
  onVisaChange: (checked: boolean) => void;
  onPassportChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FormLabel className="text-sm font-medium text-foreground/70">
        Serviço contratado
      </FormLabel>
      <p className="text-xs text-foreground/60">
        Obrigatório. Se contratou os dois serviços, marque os dois.
      </p>
      <div className="flex gap-2">
        <label className="flex flex-1 flex-row items-center space-x-2 space-y-0 rounded-lg border border-secondary/40 bg-white px-2.5 py-2">
          <Checkbox
            checked={visaChecked}
            disabled={disabled}
            onCheckedChange={(checked) => onVisaChange(checked === true)}
            className="rounded"
          />
          <span className="text-sm font-medium cursor-pointer leading-none">
            Visto Americano
          </span>
        </label>
        <label className="flex flex-1 flex-row items-center space-x-2 space-y-0 rounded-lg border border-secondary/40 bg-white px-2.5 py-2">
          <Checkbox
            checked={passportChecked}
            disabled={disabled}
            onCheckedChange={(checked) => onPassportChange(checked === true)}
            className="rounded"
          />
          <span className="text-sm font-medium cursor-pointer leading-none">
            Passaporte
          </span>
        </label>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}

function ServiceSelectionFields({
  visaName,
  passportName,
  disabled,
}: {
  visaName: "wantsAmericanVisa";
  passportName: "wantsPassport";
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FormField
        name={visaName}
        render={({ field: visaField }) => (
          <FormField
            name={passportName}
            render={({ field: passportField }) => (
              <ServiceChoice
                visaChecked={visaField.value}
                passportChecked={passportField.value}
                onVisaChange={visaField.onChange}
                onPassportChange={passportField.onChange}
                disabled={disabled}
              />
            )}
          />
        )}
      />
      <FormField
        name={visaName}
        render={() => <FormMessage className="text-sm text-red-500" />}
      />
    </div>
  );
}

function serviceLabels(person: PersonInput) {
  return [
    person.wantsAmericanVisa ? "Visto Americano" : null,
    person.wantsPassport ? "Passaporte" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function RegisterForm() {
  const [passwordType, setPasswordType] = useState<"text" | "password">(
    "password",
  );
  const [confirmType, setConfirmType] = useState<"text" | "password">(
    "password",
  );
  const [userSubmitted, setUserSubmitted] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draft, setDraft] = useState<PersonInput>(emptyPerson);
  const [draftErrors, setDraftErrors] = useState<{
    name?: string;
    cpf?: string;
    wantsAmericanVisa?: string;
  }>({});

  const router = useRouter();
  const session = useSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      password: "",
      passwordConfirm: "",
      additionalPeople: [],
      wantsAmericanVisa: false,
      wantsPassport: false,
    },
  });

  const additionalPeople = form.watch("additionalPeople") ?? [];

  const { mutate: registerClient, isPending } =
    trpc.userRouter.registerClient.useMutation({
      async onSuccess(data) {
        toast.success("Cadastro realizado com sucesso!");
        setUserSubmitted(true);

        const response = await signIn("credentials", {
          email: data.email,
          password: form.getValues("password"),
          redirect: false,
        });

        if (!response?.error) {
          router.push("/verificando-usuario");
          return;
        }

        toast.message("Conta criada. Faça login para continuar.");
        router.push("/login");
      },
      onError(error) {
        toast.error(error.message || "Não foi possível concluir o cadastro");
      },
    });

  useEffect(() => {
    if (!userSubmitted && session && session.status === "authenticated") {
      router.push("/verificando-usuario");
    }
  }, [session, router, userSubmitted]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (draftOpen) {
      const hasContent =
        draft.name.trim() ||
        draft.cpf.trim() ||
        draft.wantsAmericanVisa ||
        draft.wantsPassport;

      if (hasContent) {
        toast.error(
          "Salve o dependente em preenchimento antes de criar a conta.",
        );
        return;
      }
    }

    registerClient({
      ...values,
      additionalPeople: values.additionalPeople ?? [],
    });
  }

  function addPerson() {
    if (draftOpen) {
      toast.message("Salve o dependente atual antes de adicionar outro.");
      return;
    }

    setDraft(emptyPerson);
    setDraftErrors({});
    setDraftOpen(true);
  }

  function cancelDraft() {
    setDraft(emptyPerson);
    setDraftErrors({});
    setDraftOpen(false);
  }

  function savePerson() {
    const parsed = personSchema.safeParse(draft);

    if (!parsed.success) {
      const nextErrors: {
        name?: string;
        cpf?: string;
        wantsAmericanVisa?: string;
      } = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "name" || field === "cpf" || field === "wantsAmericanVisa") {
          nextErrors[field] = issue.message;
        }
      }

      setDraftErrors(nextErrors);
      return;
    }

    const titularCpf = cpfDigits(form.getValues("cpf"));
    const savedCpfs = additionalPeople.map((person) => cpfDigits(person.cpf));
    const draftCpf = cpfDigits(parsed.data.cpf);

    if ((titularCpf && titularCpf === draftCpf) || savedCpfs.includes(draftCpf)) {
      setDraftErrors({ cpf: "CPF repetido no cadastro" });
      return;
    }

    form.setValue("additionalPeople", [...additionalPeople, parsed.data]);
    setDraft(emptyPerson);
    setDraftErrors({});
    setDraftOpen(false);
    toast.success("Dependente salvo. Adicione outro ou crie a conta.");
  }

  function removePerson(index: number) {
    form.setValue(
      "additionalPeople",
      additionalPeople.filter((_, personIndex) => personIndex !== index),
    );
  }

  return (
    <section className="min-h-screen w-full bg-[linear-gradient(180deg,#f4f7fc_0%,#ffffff_45%,#eef3fb_100%)]">
      <header className="w-full flex items-center justify-center pt-10 sm:pt-14 pb-4">
        <Link href="/" className="relative w-40 h-20 sm:w-52 sm:h-24">
          <Image
            src="/assets/images/cp-vistos-logo-azul.png"
            alt="CP Vistos"
            fill
            priority
            className="object-contain object-center"
          />
        </Link>
      </header>

      <div className="w-full px-6 pb-16 flex flex-col items-center">
        <div className="w-full max-w-lg rounded-3xl border border-secondary/40 bg-white shadow-sm p-6 sm:p-10 flex flex-col gap-8">
          <div className="w-full flex flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-bold text-foreground !leading-[110%] sm:text-4xl">
              Criar conta de cliente
            </h1>
            <p className="text-base text-foreground/70 sm:text-lg">
              Preencha os dados do titular. Dependentes podem ter serviços
              diferentes — salve cada um antes de criar a conta.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full flex flex-col gap-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-foreground/70">
                      Nome completo do titular
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome completo"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-foreground/70">
                      CPF
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        disabled={isPending}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(formatCpf(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <ServiceSelectionFields
                visaName="wantsAmericanVisa"
                passportName="wantsPassport"
                disabled={isPending}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-foreground/70">
                      E-mail
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Insira seu e-mail"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-foreground/70">
                      Senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Crie sua senha"
                          disabled={isPending}
                          type={passwordType}
                          {...field}
                        />
                        <Button
                          disabled={isPending}
                          onClick={() =>
                            setPasswordType((prev) =>
                              prev === "password" ? "text" : "password",
                            )
                          }
                          variant="link"
                          size="icon"
                          type="button"
                          className="absolute top-1/2 -translate-y-1/2 right-1"
                          asChild
                        >
                          <span className="cursor-pointer">
                            {passwordType === "password" ? (
                              <EyeOff color="#C0D2EF" />
                            ) : (
                              <Eye color="#C0D2EF" />
                            )}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-foreground/70">
                      Confirmar senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Repita a senha"
                          disabled={isPending}
                          type={confirmType}
                          {...field}
                        />
                        <Button
                          disabled={isPending}
                          onClick={() =>
                            setConfirmType((prev) =>
                              prev === "password" ? "text" : "password",
                            )
                          }
                          variant="link"
                          size="icon"
                          type="button"
                          className="absolute top-1/2 -translate-y-1/2 right-1"
                          asChild
                        >
                          <span className="cursor-pointer">
                            {confirmType === "password" ? (
                              <EyeOff color="#C0D2EF" />
                            ) : (
                              <Eye color="#C0D2EF" />
                            )}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <div className="rounded-2xl border border-secondary/40 bg-[#f7f9fd] p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    Dependentes
                  </h2>
                  <p className="text-sm text-foreground/60">
                    Salve cada dependente com nome, CPF e serviços. Depois crie
                    a conta com todos de uma vez.
                  </p>
                </div>

                {additionalPeople.map((person, index) => (
                  <div
                    key={`${person.cpf}-${index}`}
                    className="rounded-xl border border-secondary/30 bg-white p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {person.name}
                      </p>
                      <p className="mt-1 text-sm text-foreground/60">
                        {person.cpf}
                        {serviceLabels(person) ? ` · ${serviceLabels(person)}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => removePerson(index)}
                      aria-label="Remover dependente"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                {draftOpen ? (
                  <div className="rounded-xl border border-secondary/30 bg-white p-4 flex flex-col gap-4">
                    <span className="text-sm font-medium text-foreground/70">
                      Novo dependente
                    </span>

                    <div className="flex flex-col gap-1.5">
                      <FormLabel className="text-sm font-medium text-foreground/70">
                        Nome completo
                      </FormLabel>
                      <Input
                        placeholder="Nome completo"
                        disabled={isPending}
                        value={draft.name}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                      {draftErrors.name ? (
                        <p className="text-sm text-red-500">{draftErrors.name}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <FormLabel className="text-sm font-medium text-foreground/70">
                        CPF
                      </FormLabel>
                      <Input
                        placeholder="000.000.000-00"
                        disabled={isPending}
                        value={draft.cpf}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            cpf: formatCpf(event.target.value),
                          }))
                        }
                      />
                      {draftErrors.cpf ? (
                        <p className="text-sm text-red-500">{draftErrors.cpf}</p>
                      ) : null}
                    </div>

                    <ServiceChoice
                      visaChecked={draft.wantsAmericanVisa}
                      passportChecked={draft.wantsPassport}
                      onVisaChange={(checked) =>
                        setDraft((current) => ({
                          ...current,
                          wantsAmericanVisa: checked,
                        }))
                      }
                      onPassportChange={(checked) =>
                        setDraft((current) => ({
                          ...current,
                          wantsPassport: checked,
                        }))
                      }
                      disabled={isPending}
                      error={draftErrors.wantsAmericanVisa}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        disabled={isPending}
                        onClick={savePerson}
                        className="sm:flex-1"
                      >
                        Salvar dependente
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={cancelDraft}
                        className="sm:flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={addPerson}
                    className="w-full"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar dependente
                  </Button>
                )}
              </div>

              <Button
                size="xl"
                disabled={isPending}
                className="text-xl flex items-center gap-2 mt-2"
              >
                {isPending ? (
                  <>
                    Criando conta
                    <Loader2 className="animate-spin" />
                  </>
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-center text-foreground/60">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="text-primary font-medium underline underline-offset-2"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
