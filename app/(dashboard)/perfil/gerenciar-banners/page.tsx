"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileX, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BannerItem } from "./components/banner-item";

import { trpc } from "@/lib/trpc-client";
import { isFullAdmin } from "@/lib/staff-access";

export default function ManageBannersPage() {
  const router = useRouter();

  const { data, isPending } = trpc.websiteRouter.getBanners.useQuery();
  const { data: me } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (!me) {
      return;
    }

    if (!isFullAdmin(me.user.role, me.user.email)) {
      toast.error("Acesso não autorizado");
      router.push("/perfil/clientes");
    }
  }, [me, router]);

  return (
    <div className="w-full px-6 sm:px-16 lg:px-40 lg:container lg:mx-auto">
      <div className="w-full flex flex-col gap-4 items-center my-6 sm:flex-row sm:items-end sm:justify-between lg:my-12">
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold">
          Banners
        </h1>

        <Button
          size="xl"
          className="w-full sm:w-fit"
          disabled={isPending}
          asChild
        >
          <Link href="/perfil/gerenciar-banners/adicionar">
            Adicionar Banner
          </Link>
        </Button>
      </div>

      <div className="w-full flex flex-col gap-20 my-12">
        {isPending ? (
          <div className="w-full flex flex-col gap-2 items-center justify-center">
            <Loader2 className="animate-spin size-12" />
            <span className="text-lg font-medium">Carregando banners...</span>
          </div>
        ) : data !== undefined && data.banners.length > 0 ? (
          data.banners.map((banner) => (
            <BannerItem
              key={banner.id}
              id={banner.id}
              imageUrl={banner.imageUrl}
              title={banner.title}
              desc={banner.desc}
              btnText={banner.btnText}
              pending={isPending}
            />
          ))
        ) : (
          <div className="w-full flex flex-col gap-2 items-center justify-center">
            <FileX className="size-12 text-muted" />

            <span className="text-lg font-medium text-muted">
              Nenhum banner cadastrado
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
