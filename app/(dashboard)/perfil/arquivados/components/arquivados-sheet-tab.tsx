"use client";

import { Loader2 } from "lucide-react";

import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";
import { trpc } from "@/lib/trpc-client";

type Category = "american_visa" | "renovacao" | "passport" | "e_ta";

const LABELS: Record<Category, { empty: string; footer: string }> = {
  american_visa: {
    empty: "Nenhum arquivado de 1º visto na planilha.",
    footer: "arquivado",
  },
  renovacao: {
    empty: "Nenhum arquivado de renovação na planilha.",
    footer: "arquivado",
  },
  passport: {
    empty: "Nenhum arquivado de passaporte na planilha.",
    footer: "arquivado",
  },
  e_ta: {
    empty: "Nenhum arquivado de ESTA / E-TA na planilha.",
    footer: "arquivado",
  },
};

export function ArquivadosSheetTab({ category }: { category: Category }) {
  const { data, isLoading, isError, error } = trpc.arquivadosRouter.getSheet.useQuery(
    { category },
    { retry: false },
  );

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-8">
        {error.message || "Não foi possível carregar os arquivados"}
      </p>
    );
  }

  return (
    <SheetClientsTable
      rows={data?.rows ?? []}
      emptyMessage={LABELS[category].empty}
      footerLabel={LABELS[category].footer}
      footerSuffix="em Arquivados"
    />
  );
}
