"use client";

import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { trpc } from "@/lib/trpc-client";

const formSchema = z
  .object({
    name: z.string().min(1, { message: "Nome é obrigatório" }),
    email: z.string().trim().min(1, { message: "E-mail é obrigatório" }).email({ message: "E-mail inválido" }),
    password: z
      .string()
      .min(1, { message: "Senha é obrigatória" })
      .min(6, { message: "Senha precisa ter no mínimo 6 caracteres" }),
    passwordConfirm: z
      .string()
      .min(1, { message: "Confirmação de senha é obrigatório" })
      .min(6, { message: "Confirmação de senha precisa ter no mínimo 6 caracteres" }),
  })
  .superRefine(({ password, passwordConfirm }, ctx) => {
    if (passwordConfirm !== password) {
      ctx.addIssue({
        path: ["passwordConfirm"],
        code: "custom",
        message: "As senhas não coincidem, verifique e tente novamente",
      });
    }
  });

export default function CollaboratorRegisterPage() {
  const router = useRouter();
  const util = trpc.useUtils();

  const { mutate: registerCollaborator, isPending } = trpc.collaboratorRouter.registerCollaborator.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/perfil/gerenciar-colaboradores");
      util.collaboratorRouter.getCollaborators.invalidate();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Ocorreu um erro ao cadastrar o colaborador");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    registerCollaborator(values);
  }

  return (
    <div className="w-full lg:w-[calc(100%-var(--dashboard-sidebar-width,250px))] px-6 sm:px-16 lg:ml-[var(--dashboard-sidebar-width,250px)] lg:px-40 transition-[margin,width] duration-300">
      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold my-6 lg:my-12">Cadastro de Colaborador</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-12 mb-12">
          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>Nome</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={isPending}
                        placeholder="Insira o nome do colaborador"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>E-mail</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={isPending}
                        placeholder="Insira o e-mail do colaborador"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>Senha</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={isPending}
                        placeholder="Insira a senha do colaborador"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>Confirmar Senha</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={isPending}
                        placeholder="Confirme a senha do colaborador"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button
            disabled={isPending}
            type="submit"
            variant="confirm"
            size="xl"
            className="w-full sm:w-fit flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Criando
              </>
            ) : (
              <>Criar</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
