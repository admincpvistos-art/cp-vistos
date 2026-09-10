"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SheetClientsTable, type SheetClientRow } from "@/components/dashboard/sheet-clients-table";
import { trpc } from "@/lib/trpc-client";
import { canAccessAcompanhamento, canArchiveAcompanhamento } from "@/lib/staff-access";
import { AcompanhamentoEditSheet } from "./acompanhamento-edit-sheet";

export default function AcompanhamentoClientesPage() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: me, isLoading: isMeLoading } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
  });
  const canAccess = canAccessAcompanhamento(me?.user.role, me?.user.email);
  const canArchive = canArchiveAcompanhamento(me?.user.role, me?.user.email);

  const { data, isLoading, isError, error, refetch } =
    trpc.acompanhamentoRouter.getClientesSheet.useQuery(undefined, {
      enabled: canAccess,
      retry: false,
    });

  const { mutateAsync: updateComment, isPending: commentPending } =
    trpc.acompanhamentoRouter.updateComment.useMutation({
      onSuccess: () => {
        toast.success("Comentário salvo");
        refetch();
      },
      onError: (mutationError) => {
        toast.error(mutationError.message || "Não foi possível salvar o comentário");
      },
    });

  const utils = trpc.useUtils();
  const { mutateAsync: deleteRow, isPending: deletePending, variables: deleteVariables } =
    trpc.acompanhamentoRouter.deleteRow.useMutation();

  useEffect(() => {
    if (!me || isMeLoading) {
      return;
    }

    if (!canAccess) {
      toast.error("Acesso não autorizado");
      router.push("/perfil/prospects");
    }
  }, [canAccess, isMeLoading, me, router]);

  const rows = useMemo<SheetClientRow[]>(() => {
    if (!data?.rows) {
      return [];
    }

    return data.rows.map((row) => ({
      id: row.id,
      name: row.name,
      services: row.services ?? [],
      sheetComment: row.sheetComment ?? "",
      barcode: row.barcode,
      barcodeIssued: row.barcodeIssued,
      barcodeDone: row.barcodeDone,
      casv: row.casv,
      interview: row.interview,
      meeting: row.meeting,
      tax: row.tax,
      dob: row.dob,
      passport: row.passport,
      email: row.email,
      entryDate: row.entryDate,
      group: row.group,
      status: row.status,
      registeredAt: row.registeredAt ?? 0,
      estaProfileId: row.estaProfileId,
      estaFormStep: row.estaFormStep,
      estaStatusForm: row.estaStatusForm,
    }));
  }, [data?.rows]);

  async function handleDeleteRow(row: SheetClientRow) {
    const result = await deleteRow({ id: row.id });
    const tabs = result.labels.join(", ");
    toast.success(
      result.labels.length > 1
        ? `Cliente excluído — transferido para: ${tabs}`
        : `Cliente excluído — transferido para Arquivados (${tabs})`,
    );

    utils.acompanhamentoRouter.getClientesSheet.setData(undefined, (current) => {
      if (!current?.rows) {
        return current;
      }
      const name = row.name.trim();
      const group = row.group.trim();
      return {
        ...current,
        rows: current.rows.filter((item) => {
          if (result.removedIds?.includes(item.id) || item.id === row.id) {
            return false;
          }
          if (
            name &&
            group &&
            item.name.trim().toLowerCase() === name.toLowerCase() &&
            item.group.trim().toLowerCase() === group.toLowerCase()
          ) {
            return false;
          }
          return true;
        }),
      };
    });

    await Promise.all([
      utils.acompanhamentoRouter.getClientesSheet.invalidate(),
      utils.arquivadosRouter.getSheet.invalidate(),
    ]);

    if (editingId === row.id) {
      setEditingId(null);
    }
  }

  if (!me || isMeLoading || !canAccess) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1920px] mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6 mt-6 lg:mt-12">
          Acompanhamento Clientes
        </h1>

        <SheetClientsTable
          rows={rows}
          footerLabel="cliente"
          footerSuffix="da planilha"
          isLoading={isLoading}
          errorMessage={isError ? error.message || "Não foi possível carregar a planilha" : null}
          commentPending={commentPending}
          onSaveComment={async (rowId, sheetComment) => {
            await updateComment({ id: rowId, sheetComment });
          }}
          onRowClick={(row) => {
            setCreating(false);
            setEditingId(row.id);
          }}
          canDelete={canArchive}
          deletePendingId={deletePending ? deleteVariables?.id ?? null : null}
          onDelete={async (row) => {
            try {
              await handleDeleteRow(row);
            } catch (error) {
              const message =
                error && typeof error === "object" && "message" in error
                  ? String((error as { message?: unknown }).message || "")
                  : "";
              toast.error(message || "Não foi possível excluir o cliente");
              throw error;
            }
          }}
          toolbarActions={
            <Button
              type="button"
              className="h-12"
              onClick={() => {
                setEditingId(null);
                setCreating(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar cliente
            </Button>
          }
        />
      </div>
      <AcompanhamentoEditSheet
        rowId={editingId}
        creating={creating}
        canArchive={canArchive}
        onClose={() => {
          setEditingId(null);
          setCreating(false);
        }}
      />
    </>
  );
}
