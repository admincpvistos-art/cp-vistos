"use client";

import { z } from "zod";
import { toast } from "sonner";
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

export default function ChangePasswordPage() {
  const router = useRouter();

  const { data: meData, isLoading } = trpc.userRouter.getMe.useQuery();
  const { mutate: changePassword, isPending } =
    trpc.userRouter.changePassword.useMutation({
      onSuccess: (res) => {
        if (res.error) {
          toast.error(res.message);
          return;
        }

        toast.success(res.message);

        const role = meData?.user.role;
        if (role === "CLIENT") {
          router.push("/area-do-cliente");
        } else {
          router.push("/perfil/clientes");
        }
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    changePassword(values);
  }

  return (
    <div className="w-full px-6 sm:px-16 lg:px-40 lg:container lg:mx-auto">
      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold mb-12 mt-6 lg:mt-12">
        Alterar Senha
      </h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex flex-col gap-12 max-w-3xl"
        >
          <div className="w-full flex flex-col gap-6 lg:flex-row">
            <FormField
              control={form.control}
              name="actualPassword"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Senha Atual*</FormLabel>
                  <FormControl>
                    <Input type="password" disabled={pending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="w-full flex flex-col gap-6 lg:flex-row">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Nova Senha*</FormLabel>
                  <FormControl>
                    <Input type="password" disabled={pending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Confirmar Nova Senha*</FormLabel>
                  <FormControl>
                    <Input type="password" disabled={pending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={pending} className="w-fit">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Nova Senha
          </Button>
        </form>
      </Form>
    </div>
  );
}
