"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, UtensilsIcon } from "lucide-react";
import useCollaboratorStore from "@/constants/stores/useCollaboratorStore";

const formSchema = z
  .object({
    name: z.string().min(1, { message: "Nome é obrigatório" }),
    email: z.string().trim().min(1, { message: "E-mail é obrigatório" }).email({ message: "E-mail inválido" }),
    password: z.string(),
    passwordConfirm: z.string(),
  })
  .superRefine(({ password, passwordConfirm }, ctx) => {
    if (password.length > 0 && password.length < 6) {
      ctx.addIssue({
        path: ["password"],
        code: "custom",
        message: "Nova senha precisa ter no mínimo 6 caracteres",
      });
    }

    if (passwordConfirm.length > 0 && passwordConfirm.length < 6) {
      ctx.addIssue({
        path: ["passwordConfirm"],
        code: "custom",
        message: "Confirmação da nova senha precisa ter no mínimo 6 caracteres",
      });
    }

    if (passwordConfirm !== password) {
      ctx.addIssue({
        path: ["passwordConfirm"],
        code: "custom",
        message: "As senhas não coincidem, verifique e tente novamente",
      });
    }
  });

export default function EditCollaboratorPage({ params }: { params: { collaboratorId: string } }) {
  const { collaborator, setCollaborator } = useCollaboratorStore();
  const router = useRouter();
  const util = trpc.useUtils();
  const collaboratorId = params.collaboratorId;

  const { mutate: editCollaborator, isPending } = trpc.collaboratorRouter.editCollaborator.useMutation({
    onSuccess: (data) => {
      setCollaborator(null);
      toast.success(data.message);
      router.push("/perfil/gerenciar-colaboradores");
      util.collaboratorRouter.getCollaborators.invalidate();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Ocorreu um erro ao editar o colaborador");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collaborator?.name ?? "",
      email: collaborator?.email ?? "",
      password: "",
      passwordConfirm: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    editCollaborator({ ...values, collaboratorId });
  }

  return (
    <div className="w-full px-6 sm:px-16 lg:px-40 lg:container lg:mx-auto">
      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold my-6 lg:my-12">Editar Colaborador</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-12">
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
                    <FormLabel>Nova Senha</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={isPending}
                        placeholder="Insira a nova senha do colaborador"
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
                    <FormLabel>Confirmar Nova Senha</FormLabel>

                    <FormControl>
                      <Input
                        className="!mt-auto"
                        disabled={isPending}
                        placeholder="Confirme a nova senha do colaborador"
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
                Salvando
              </>
            ) : (
              <>Salvar</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
