"use client";

import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "@uploadthing/react";
import NextImage from "next/image";
import { Export } from "iconsax-react";
import { useState } from "react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import axios from "axios";
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
import { Textarea } from "@/components/ui/textarea";

import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

const formSchema = z.object({
  title: z.string().min(1, "Este campo é obrigatório"),
  desc: z.string().min(1, "Este campo é obrigatório"),
  btnText: z.string().min(1, "Este campo é obrigatório"),
  btnLink: z.string().min(1, "Este campo é obrigatório").url("Url inválida"),
  imageUrl: z.string().url("A URL da imagem é inválida"),
});

export default function AddBannerPage() {
  const [image, setImage] = useState<null | File[]>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageKey, setImageKey] = useState<string>("");

  const route = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      desc: "",
      btnText: "",
      btnLink: "",
      imageUrl: "",
    },
  });

  const { mutate: createBanner, isPending } =
    trpc.websiteRouter.createBanner.useMutation({
      onSuccess: (res) => {
        toast.success(res.message);

        route.replace("/perfil/gerenciar-banners");
      },
      onError: (error) => {
        console.error(error);

        axios.post("/api/uploadthing-error", { fileKey: imageKey });
      },
    });

  const { startUpload, isUploading, routeConfig } = useUploadThing(
    "imageUploader",
    {
      onClientUploadComplete: (res) => {
        form.setValue("imageUrl", res[0].url);
        setImageKey(res[0].key);

        const values = form.getValues();

        createBanner({ ...values, imageKey: res[0].key });
      },
      onUploadError: (error) => {
        console.error(error.data);

        toast.error(
          "Ocorreu um erro ao enviar a image, tente novamente mais tarde",
        );
      },
    },
  );

  const fileTypes = routeConfig ? Object.keys(routeConfig) : [];

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const img = new Image();

      img.onload = () => {
        if (img.width < 1000) {
          toast.error("Resolução da imagem não é recomendado");

          setImage(null);
          setImageUrl("");
        } else {
          setImage(acceptedFiles);
          setImageUrl(URL.createObjectURL(acceptedFiles[0]));
        }
      };

      img.src = URL.createObjectURL(acceptedFiles[0]);
    },
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
  });

  function handleCancelImage() {
    setImage(null);
    setImageUrl("");
  }

  function onSubmit() {
    form
      .trigger(["title", "desc", "btnText", "btnLink"], {
        shouldFocus: true,
      })
      .then(() => {
        if (Object.keys(form.formState.errors).length === 0 && image) {
          startUpload(image!);
        }
      });
  }

  return (
    <div className="w-full px-6 sm:px-16 lg:px-40 lg:container lg:mx-auto">
      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold my-6 lg:my-12">
        Cadastro de Banner
      </h1>

      <Form {...form}>
        <form className="w-full flex flex-col gap-12">
          <div className="w-full flex flex-col gap-6">
            <div
              {...getRootProps()}
              className={cn(
                "relative w-full border border-dashed border-muted/70 rounded-xl overflow-hidden h-[250px] flex items-center justify-center p-6 cursor-pointer",
                {
                  "border-none": imageUrl !== "",
                },
              )}
            >
              {imageUrl ? (
                <>
                  <NextImage
                    src={imageUrl}
                    alt="Imagem selecionada"
                    fill
                    className="object-center object-cover"
                  />

                  <Button
                    onClick={handleCancelImage}
                    variant="destructive"
                    className="absolute bottom-5 left-5 w-fit z-10 flex items-center gap-2"
                  >
                    Excluir
                    <Trash2 />
                  </Button>
                </>
              ) : (
                <>
                  <input {...getInputProps()} />

                  <div className="flex flex-col items-center gap-4">
                    <Export className="size-12 text-muted" />
                    <p className="text-base text-center text-muted">
                      Arraste ou clique aqui para enviar a imagem
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                name="title"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Insira o título do banner"
                        disabled={isPending || isUploading}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="btnText"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto do botão</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Insira o texto do botão do banner"
                        disabled={isPending || isUploading}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="btnLink"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Link do botão</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Insira o link que o botão irá redirecionar"
                        disabled={isPending || isUploading}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="desc"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>

                  <FormControl>
                    <Textarea
                      placeholder="Insira a descrição do banner"
                      disabled={isPending || isUploading}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 mb-12">
            <Button
              variant="outline"
              size="xl"
              className="w-full order-1 sm:order-2 sm:w-fit"
              disabled={isPending || isUploading}
              asChild
            >
              <Link href="/perfil/gerenciar-banners">Cancelar</Link>
            </Button>

            <Button
              onClick={onSubmit}
              disabled={isPending || isUploading}
              type="button"
              variant="confirm"
              size="xl"
              className="w-full flex items-center gap-2 order-1 sm:order-2 sm:w-fit"
            >
              Criar
              {(isPending || isUploading) && (
                <Loader2 className="animate-spin" />
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
