"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
    actualPassword: z
      .string()
      .min(1, { message: "Senha Atual é obrigatória" })
      .min(6, { message: "Senha Atual precisa ter no mínimo 6 caracteres" }),
    newPassword: z
      .string()
      .min(1, { message: "Nova Senha é obrigatória" })
      .min(6, { message: "Nova Senha precisa ter no mínimo 6 caracteres" }),
    confirmNewPassword: z
      .string()
      .min(1, { message: "Confirmar Nova Senha é obrigatória" })
      .min(6, {
        message: "Confirmar Nova Senha precisa ter no mínimo 6 caracteres",
      }),
  })
  .superRefine(({ actualPassword, newPassword, confirmNewPassword }, ctx) => {
    if (newPassword === actualPassword) {
      ctx.addIssue({
        path: ["newPassword"],
        code: "custom",
        message: "A Nova Senha precisa ser diferente da senha atual",
      });
    }

    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        path: ["confirmNewPassword"],
        code: "custom",
        message: "As senhas não coincidem",
      });
    }
  });

export default function AdminChangePassword() {
  const router = useRouter();

  const { data, isLoading } = trpc.userRouter.getRole.useQuery();
  const { mutate: changePassword, isPending } =
    trpc.userRouter.changePassword.useMutation({
      onSuccess: (res) => {
        if (res.error) {
          toast.error(res.message);

          return;
        }

        toast.success(res.message);

        router.push("/perfil/clientes");
      },
      onError: (error) => {
        console.log(error);

        toast.error("Ocorreu um erro ao alterar a senha");
      },
    });

  const pending = isPending || isLoading;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (data !== undefined && data.role !== "ADMIN") {
      toast.error("Acesso não autorizado");

      router.push("/perfil/clientes");
    }
  }, [data, router]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    changePassword(values);
  }

  return (
    <div className="w-full lg:w-[calc(100%-var(--dashboard-sidebar-width,250px))] px-6 sm:px-16 lg:ml-[var(--dashboard-sidebar-width,250px)] lg:px-40 transition-[margin,width] duration-300">
      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold mb-12">
        Alterar Senha
      </h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex flex-col gap-12"
        >
          <div className="w-full flex flex-col gap-6 lg:flex-row">
            <FormField
              control={form.control}
              name="actualPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="line-clamp-1">Senha Atual</FormLabel>

                  <FormControl>
                    <Input
                      type="password"
                      disabled={pending}
                      placeholder="Insira a sua senha atual"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="line-clamp-1">Nova Senha</FormLabel>

                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Insira a sua nova senha"
                      disabled={pending}
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="line-clamp-1">
                    Confirmar Nova Senha
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="password"
                      disabled={pending}
                      placeholder="Confirme a sua nova senha"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            disabled={pending}
            type="submit"
            size="xl"
            className="w-full sm:w-fit"
          >
            {pending ? (
              <>
                Enviando
                <Loader2 className="ml-2 size-4 animate-spin" />
              </>
            ) : (
              <>Enviar</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
