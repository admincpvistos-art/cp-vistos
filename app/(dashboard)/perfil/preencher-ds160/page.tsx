"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useEffect } from "react";

import { Ds160FormList } from "@/components/ds160/ds160-form-list";

export default function PreencherDs160ListPage() {
  const session = useSession();

  useEffect(() => {
    if (session.status === "unauthenticated") {
      toast.error("Usuário não autorizado");
      redirect("/");
    }
  }, [session.status]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1920px] mx-auto pb-16">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-2 mt-6 lg:mt-12">
        Preencher DS-160
      </h1>
      <p className="mb-8 text-sm text-muted-foreground max-w-3xl">
        Abre o formulário do cliente ao lado do site oficial do CEAC. Instale a extensão do
        escritório para o quadro da direita carregar o CEAC nesta página.
      </p>
      <Ds160FormList mode="fill" />
    </div>
  );
}
