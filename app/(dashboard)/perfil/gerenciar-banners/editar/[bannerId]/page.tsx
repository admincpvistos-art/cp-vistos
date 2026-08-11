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
import { useEffect, useState } from "react";
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
  imageUrl: z.string().url("A URL da imagem é inválida").optional(),
});

export default function EditBanner({
  params,
}: {
  params: { bannerId: string };
}) {
  const { bannerId } = params;
  const [image, setImage] = useState<null | File[]>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageKey, setImageKey] = useState<string>("");

  const route = useRouter();

  const { data, isPending: isBannerDataPending } =
    trpc.websiteRouter.getSelectedBanner.useQuery({ bannerId });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: data?.banner.title ?? "",
      desc: data?.banner.desc ?? "",
      btnText: data?.banner.btnText ?? "",
      btnLink: data?.banner.btnLink ?? "",
      imageUrl: data?.banner.imageUrl ?? "",
    },
  });

  const { mutate: editBanner, isPending } =
    trpc.websiteRouter.editBanner.useMutation({
      onSuccess: (res) => {
        if (res.error) {
          toast.error(res.message);

          return;
        }

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

        editBanner({ ...values, imageKey: res[0].key, bannerId });
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
    onDrop: (acceptedFiles) => {
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

  useEffect(() => {
    if (data && data.banner) {
      form.setValue("btnLink", data.banner.btnLink);
      form.setValue("title", data.banner.title);
      form.setValue("desc", data.banner.desc);
      form.setValue("btnText", data.banner.btnText);
      form.setValue("imageUrl", data.banner.imageUrl);
      setImageUrl(data.banner.imageUrl);
    }
  }, [data]);

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
        if (Object.keys(form.formState.errors).length === 0) {
          if (image) {
            startUpload(image!);
          } else {
            const values = form.getValues();

            editBanner({ ...values, bannerId });
          }
        }
      });
  }

  return (
    <div className="w-full lg:w-[calc(100%-var(--dashboard-sidebar-width,250px))] px-6 sm:px-16 lg:ml-[var(--dashboard-sidebar-width,250px)] lg:px-40 transition-[margin,width] duration-300">
      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold my-6 lg:my-12">
        Edite o banner
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
                        disabled={
                          isPending || isUploading || isBannerDataPending
                        }
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
                        disabled={
                          isPending || isUploading || isBannerDataPending
                        }
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
                        disabled={
                          isPending || isUploading || isBannerDataPending
                        }
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
                      disabled={isPending || isUploading || isBannerDataPending}
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
              asChild
            >
              <Link href="/perfil/gerenciar-banners">Cancelar</Link>
            </Button>

            <Button
              onClick={onSubmit}
              disabled={isPending || isUploading || isBannerDataPending}
              type="button"
              variant="confirm"
              size="xl"
              className="w-full flex items-center gap-2 order-1 sm:order-2 sm:w-fit"
            >
              Salvar
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
