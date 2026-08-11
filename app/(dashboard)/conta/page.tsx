"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Camera } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

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
import { useUploadThing } from "@/lib/uploadthing";

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Nome é obrigatório" })
    .min(2, { message: "Nome precisa ter no mínimo 2 caracteres" }),
  email: z.string().email(),
  cel: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export default function AccountPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.userRouter.getMe.useQuery();
  const { mutate: updateProfile, isPending } =
    trpc.userRouter.updateProfile.useMutation({
      onSuccess: (res) => {
        toast.success(res.message);
        utils.userRouter.getMe.invalidate();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Não foi possível atualizar o perfil");
      },
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      cel: "",
      cpf: "",
      address: "",
    },
  });

  const { startUpload, isUploading } = useUploadThing("profileImageUploader", {
    onClientUploadComplete: (res) => {
      const url = res[0]?.url;
      if (!url) return;

      setPreviewUrl(url);
      updateProfile({
        name: form.getValues("name"),
        cel: form.getValues("cel"),
        cpf: form.getValues("cpf"),
        address: form.getValues("address"),
        image: url,
      });
    },
    onUploadError: (error) => {
      console.error(error);
      toast.error("Erro ao enviar a foto. Tente novamente.");
    },
  });

  useEffect(() => {
    if (!data?.user) return;

    form.reset({
      name: data.user.name ?? "",
      email: data.user.email ?? "",
      cel: data.user.cel ?? "",
      cpf: data.user.cpf ?? "",
      address: data.user.address ?? "",
    });
    setPreviewUrl(data.user.image);
  }, [data, form]);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    await startUpload([file]);
    event.target.value = "";
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateProfile({
      name: values.name,
      cel: values.cel,
      cpf: values.cpf,
      address: values.address,
      image:
        previewUrl && previewUrl.startsWith("http") ? previewUrl : undefined,
    });
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const pending = isPending || isUploading;
  const initials = (data?.user.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="w-full px-6 sm:px-16 lg:px-40 lg:container lg:mx-auto pb-16">
      <div className="w-full flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 mt-6 lg:mt-12">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground mt-2">
            Atualize sua foto e dados pessoais.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/perfil/alterar-senha">Alterar Senha</Link>
        </Button>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-10">
        <div className="flex items-center gap-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <div className="relative h-24 w-24 rounded-full overflow-hidden border border-secondary bg-secondary/30 flex items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Foto de perfil"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-primary">
                {initials}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
              className="w-fit"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              Alterar foto
            </Button>
            <span className="text-xs text-muted-foreground">
              JPG ou PNG, até 2MB.
            </span>
          </div>
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
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={pending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="cel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={pending}
                        placeholder="(00) 00000-0000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={pending}
                        placeholder="000.000.000-00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      disabled={pending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={pending} className="w-fit">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
