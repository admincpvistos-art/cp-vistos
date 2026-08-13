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
    additionalPeople: z
      .array(
        z
          .object({
            name: z
              .string()
              .trim()
              .min(4, "Nome completo precisa ter no mínimo 4 caracteres"),
            cpf: z.string().refine((val) => val.length === 14, "CPF inválido"),
            wantsAmericanVisa: z.boolean(),
            wantsPassport: z.boolean(),
          })
          .refine(
            (person) => person.wantsAmericanVisa || person.wantsPassport,
            {
              message: "Selecione pelo menos um serviço",
              path: ["wantsAmericanVisa"],
            },
          ),
      )
      .optional()
      .default([]),
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

function ServiceSelectionFields({
  visaName,
  passportName,
  disabled,
}: {
  visaName: "wantsAmericanVisa" | `additionalPeople.${number}.wantsAmericanVisa`;
  passportName: "wantsPassport" | `additionalPeople.${number}.wantsPassport`;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <FormLabel className="text-base font-medium text-foreground/70">
        Serviço contratado
      </FormLabel>
      <p className="text-sm text-foreground/60 -mt-1">
        Obrigatório. Pode marcar os dois.
      </p>
      <FormField
        name={visaName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-secondary/40 bg-white p-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                disabled={disabled}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5 rounded"
              />
            </FormControl>
            <div className="space-y-0.5 leading-none">
              <FormLabel className="text-sm font-medium cursor-pointer">
                Visto Americano
              </FormLabel>
              <p className="text-xs text-foreground/55">
                Entra em Clientes Ativos após o formulário na área do cliente.
              </p>
            </div>
          </FormItem>
        )}
      />
      <FormField
        name={passportName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-secondary/40 bg-white p-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                disabled={disabled}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5 rounded"
              />
            </FormControl>
            <div className="space-y-0.5 leading-none">
              <FormLabel className="text-sm font-medium cursor-pointer">
                Passaporte
              </FormLabel>
              <p className="text-xs text-foreground/55">
                Abre a linha imediatamente na tabela de Passaporte.
              </p>
            </div>
          </FormItem>
        )}
      />
      <FormField
        name={visaName}
        render={() => <FormMessage className="text-sm text-red-500" />}
      />
    </div>
  );
}

export function RegisterForm() {
  const [passwordType, setPasswordType] = useState<"text" | "password">(
    "password",
  );
  const [confirmType, setConfirmType] = useState<"text" | "password">(
    "password",
  );
  const [userSubmitted, setUserSubmitted] = useState(false);

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
    registerClient({
      ...values,
      additionalPeople: (values.additionalPeople ?? []).filter(
        (person) => person.name.trim() || person.cpf.trim(),
      ),
    });
  }

  function addPerson() {
    form.setValue("additionalPeople", [
      ...additionalPeople,
      {
        name: "",
        cpf: "",
        wantsAmericanVisa: false,
        wantsPassport: false,
      },
    ]);
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
              Preencha os dados do titular do pedido. Se o serviço também for
              para familiares, adicione as outras pessoas abaixo.
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
                    Mais pessoas no grupo
                  </h2>
                  <p className="text-sm text-foreground/60">
                    O titular dá nome ao grupo e é quem paga. Cada pessoa
                    adicional informa nome, CPF e o serviço contratado.
                  </p>
                </div>

                {additionalPeople.map((_, index) => (
                  <div
                    key={`additional-${index}`}
                    className="rounded-xl border border-secondary/30 bg-white p-4 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground/70">
                        Pessoa {index + 2}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        onClick={() => removePerson(index)}
                        aria-label="Remover pessoa"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name={`additionalPeople.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/70">
                            Nome completo
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome completo"
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
                      name={`additionalPeople.${index}.cpf`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground/70">
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
                      visaName={`additionalPeople.${index}.wantsAmericanVisa`}
                      passportName={`additionalPeople.${index}.wantsPassport`}
                      disabled={isPending}
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={addPerson}
                  className="w-full"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar mais pessoas
                </Button>
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
