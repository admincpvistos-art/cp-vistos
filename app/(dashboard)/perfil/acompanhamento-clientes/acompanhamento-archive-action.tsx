"use client";

import { useState } from "react";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ARQUIVADOS_CATEGORY_LABEL, SERVICE_TO_ARQUIVADOS_CATEGORY } from "@/lib/arquivados-categories";
import {
  ACOMPANHAMENTO_SERVICE_LABEL,
  type AcompanhamentoService,
} from "@/lib/acompanhamento-types";
import { trpc } from "@/lib/trpc-client";

/**
 * Botão + diálogo de arquivar — isolado do formulário Salvar/Cancelar.
 * Só chama acompanhamentoRouter.archiveRow.
 */
export function AcompanhamentoArchiveAction({
  rowId,
  clientName,
  clientGroup,
  services,
  onArchived,
}: {
  rowId: string;
  clientName: string;
  clientGroup: string;
  services: AcompanhamentoService[];
  onArchived: () => void;
}) {
  const utils = trpc.useUtils();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { mutateAsync: archiveOnly, isPending } =
    trpc.acompanhamentoRouter.archiveRow.useMutation({
      // Sem onSuccess que feche painel via Salvar — só este fluxo.
    });

  const destinations = services.map((service) => ({
    service,
    serviceLabel: ACOMPANHAMENTO_SERVICE_LABEL[service],
    label: ARQUIVADOS_CATEGORY_LABEL[SERVICE_TO_ARQUIVADOS_CATEGORY[service]],
  }));

  function openConfirm() {
    if (!services.length) {
      toast.error("Marque ao menos um serviço antes de arquivar");
      return;
    }
    setConfirmOpen(true);
  }

  async function runArchive() {
    if (!services.length) {
      toast.error("Marque ao menos um serviço antes de arquivar");
      setConfirmOpen(false);
      return;
    }

    try {
      const result = await archiveOnly({
        id: rowId,
        services,
      });

      const tabs = result.labels.join(", ");
      toast.success(
        result.labels.length > 1
          ? `Cliente arquivado com sucesso — transferido para: ${tabs}`
          : `Cliente arquivado com sucesso — transferido para Arquivados (${tabs})`,
      );

      setConfirmOpen(false);

      utils.acompanhamentoRouter.getClientesSheet.setData(undefined, (current) => {
        if (!current?.rows) {
          return current;
        }
        const name = clientName.trim();
        const group = clientGroup.trim();
        return {
          ...current,
          rows: current.rows.filter((row) => {
            if (result.removedIds?.includes(row.id) || row.id === rowId) {
              return false;
            }
            if (
              name &&
              group &&
              row.name.trim().toLowerCase() === name.toLowerCase() &&
              row.group.trim().toLowerCase() === group.toLowerCase()
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

      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
      onArchived();
    } catch (error) {
      setConfirmOpen(false);
      document.body.style.pointerEvents = "";
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message || "")
          : "";
      toast.error(message || "Não foi possível arquivar o cliente");
    }
  }

  return (
    <>
      <div className="mt-4 pt-4 border-t border-muted sm:col-span-2">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto text-destructive border-destructive/40 hover:bg-destructive/10"
          disabled={isPending || services.length === 0}
          title={
            services.length === 0
              ? "Marque ao menos um serviço contratado para arquivar"
              : "Enviar cliente para Arquivados"
          }
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openConfirm();
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Archive className="h-4 w-4 mr-2" />
              Enviar para Arquivados
            </>
          )}
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Independente de Salvar — usa só os serviços marcados acima.
        </p>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isPending) {
            setConfirmOpen(open);
          }
        }}
      >
        <AlertDialogContent
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar para Arquivados?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  O cliente sai do Acompanhamento e vai para Arquivados conforme os
                  serviços. Permanece no Financeiro e em Serviços e Custos
                  {clientName.trim() ? (
                    <>
                      {" "}
                      —{" "}
                      <span className="font-medium text-foreground">
                        {clientName.trim()}
                      </span>
                    </>
                  ) : null}
                  :
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {destinations.map((item) => (
                    <li key={item.service}>
                      {item.serviceLabel} → Arquivados — {item.label}
                    </li>
                  ))}
                </ul>
                {destinations.length > 1 ? (
                  <p>Com vários serviços, o cliente é replicado em cada aba.</p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Voltar
            </AlertDialogCancel>
            {/* Button nativo type=button — NÃO AlertDialogAction (evita submit/salvar). */}
            <Button
              type="button"
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void runArchive();
              }}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar envio"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
