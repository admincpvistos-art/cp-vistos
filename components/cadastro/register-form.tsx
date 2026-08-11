"use client";

import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "As senhas não coincidem",
    path: ["passwordConfirm"],
  });

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
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
    },
  });

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
    registerClient(values);
  }

  return (
    <section className="w-full flex flex-col items-center px-6 pb-16">
      <div className="w-full max-w-lg rounded-3xl border border-muted bg-white p-6 sm:p-10 shadow-sm mt-4 sm:mt-6">
        <div className="w-full flex flex-col items-center gap-3 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center !leading-[110%]">
            Criar conta de cliente
          </h1>
          <p className="text-sm sm:text-base text-center text-foreground/70">
            Preencha seus dados para acessar a área do cliente. Este link é
            destinado a quem já contratou os serviços da CP Vistos.
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
                    Nome completo
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

            <Button
              size="xl"
              disabled={isPending}
              className="text-lg flex items-center gap-2 mt-2"
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

        <p className="text-sm text-center text-foreground/60 mt-6">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-primary font-medium underline underline-offset-2"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </section>
  );
}
