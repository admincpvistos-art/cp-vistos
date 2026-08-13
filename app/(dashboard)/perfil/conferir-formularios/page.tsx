"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useEffect } from "react";

import { Ds160FormList } from "@/components/ds160/ds160-form-list";

export default function ConferirFormulariosPage() {
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
        Conferir Formulários
      </h1>
      <p className="mb-8 text-sm text-muted-foreground max-w-3xl">
        Formulários de visto enviados pelo cliente. Confira página a página no recorte do CEAC,
        devolva se faltar dado ou siga para o preenchimento oficial.
      </p>
      <Ds160FormList mode="review" />
    </div>
  );
}
