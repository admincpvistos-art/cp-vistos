"use client";

import { useState } from "react";
import { ArchiveRestore, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SheetClientsTable, type SheetClientRow } from "@/components/dashboard/sheet-clients-table";
import { canArchiveAcompanhamento } from "@/lib/staff-access";
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
  const utils = trpc.useUtils();
  const [pendingRow, setPendingRow] = useState<SheetClientRow | null>(null);

  const { data: me } = trpc.userRouter.getMe.useQuery(undefined, { retry: false });
  const canUnarchive = canArchiveAcompanhamento(me?.user.role, me?.user.email);

  const { data, isLoading, isError, error, refetch } = trpc.arquivadosRouter.getSheet.useQuery(
    { category },
    { retry: false },
  );

  const { mutateAsync: unarchiveAsync, isPending: isUnarchiving } =
    trpc.arquivadosRouter.unarchiveRow.useMutation();

  async function confirmUnarchive() {
    if (!pendingRow) {
      return;
    }
    try {
      await unarchiveAsync({ id: pendingRow.id });
      toast.success(
        `${pendingRow.name || "Cliente"} voltou para Acompanhamento Clientes (ATIVO)`,
      );
      setPendingRow(null);
      await Promise.all([
        utils.arquivadosRouter.getSheet.invalidate(),
        utils.acompanhamentoRouter.getClientesSheet.invalidate(),
      ]);
      await refetch();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message || "")
          : "";
      toast.error(message || "Não foi possível desarquivar");
      setPendingRow(null);
    }
  }

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
    <>
      <SheetClientsTable
        rows={data?.rows ?? []}
        emptyMessage={LABELS[category].empty}
        footerLabel={LABELS[category].footer}
        footerSuffix="em Arquivados"
        canUnarchive={canUnarchive}
        unarchivePendingId={isUnarchiving ? pendingRow?.id ?? null : null}
        onUnarchive={(row) => {
          if (!row.id.startsWith("db:")) {
            toast.error(
              "Registro da planilha antiga — desarquivar só vale para clientes arquivados pelo sistema.",
            );
            return;
          }
          setPendingRow(row);
        }}
      />

      <AlertDialog
        open={Boolean(pendingRow)}
        onOpenChange={(open) => {
          if (!open && !isUnarchiving) {
            setPendingRow(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desarquivar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRow?.name ? (
                <>
                  <span className="font-medium text-foreground">{pendingRow.name}</span> sai de
                  Arquivados (todas as abas em que estiver) e volta para Acompanhamento Clientes
                  como ATIVO.
                </>
              ) : (
                "O cliente volta para Acompanhamento Clientes como ATIVO."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnarchiving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isUnarchiving}
              onClick={(event) => {
                event.preventDefault();
                void confirmUnarchive();
              }}
            >
              {isUnarchiving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Desarquivar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
