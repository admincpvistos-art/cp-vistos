"use client";

import { Loader2 } from "lucide-react";

import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";
import { trpc } from "@/lib/trpc-client";

export function AmericanVisaProspects() {
  const { data, isLoading, isError, error } = trpc.prospectsRouter.getSheet.useQuery(undefined, {
    retry: false,
  });

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
        {error.message || "Não foi possível carregar os prospects"}
      </p>
    );
  }

  return (
    <SheetClientsTable
      rows={data?.rows ?? []}
      emptyMessage="Nenhum prospect na planilha Excel."
      footerLabel="prospect"
      footerSuffix="da planilha Excel (aba PROSPECT)"
    />
  );
}
