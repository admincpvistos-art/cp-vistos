"use client";

import { AdminOnly } from "@/components/ds160/admin-only";
import { Ds160FormList } from "@/components/ds160/ds160-form-list";

export default function ConferirFormulariosPage() {
  return (
    <AdminOnly>
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
    </AdminOnly>
  );
}
