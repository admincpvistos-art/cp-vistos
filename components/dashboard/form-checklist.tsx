"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Edit, Eye, Download, Loader2, Lock, Trash2 } from "lucide-react";
import { StatusDS, StatusForm } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

export type FormChecklistItem = {
  userId: string;
  name: string;
  isTitular: boolean;
  profileId: string | null;
  statusForm: StatusForm;
  statusDS: StatusDS | null;
  CASVDate: Date | null;
  interviewDate: Date | null;
  DSNumber: string | null;
  protocol?: string | null;
  expireDate?: Date | null;
  passportType?: string | null;
  formStep: number;
  formLocked: boolean;
  updatedAt: Date | null;
  canEdit: boolean;
  interviewDocs?: {
    id: string;
    fileName: string;
    fileUrl: string;
  }[];
};

interface Props {
  variant: "visa" | "passport";
  items: FormChecklistItem[];
}

function formatFormStatus(status: StatusForm) {
  switch (status) {
    case "awaiting":
      return "Vazio";
    case "filling":
      return "Incompleto";
    case "filled":
      return "Enviado";
    default:
      return "Sem status";
  }
}

function statusDSLabel(status: StatusDS | null) {
  return status === "filled" || status === "emitted" ? "Aprovado" : "Aguardando";
}

function DeleteChecklistRowButton({
  item,
  variant,
}: {
  item: FormChecklistItem;
  variant: "visa" | "passport";
}) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { mutate: deleteRow, isPending } = trpc.clientRouter.deleteChecklistRow.useMutation({
    onSuccess(result) {
      toast.success(result.message);
      setOpen(false);
      utils.clientRouter.getAreaData.invalidate();
    },
    onError(error) {
      toast.error(error.message || "Não foi possível excluir a linha");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <Trash2 className="mr-1 size-4" strokeWidth={1.5} />
          )}
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {item.isTitular ? "Excluir preenchimento do titular?" : "Excluir dependente do checklist?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground/70">
            {item.isTitular
              ? "A linha sai do checklist e o card de visto ou passaporte volta para Titular, para um novo preenchimento. Só depois disso o card passa a Família ou amigos."
              : "A linha deste dependente sai do checklist. O card de Família ou amigos permanece e a ordem das demais linhas é atualizada."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !item.profileId}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();
              if (!item.profileId) {
                return;
              }

              deleteRow({
                profileId: item.profileId,
                category: variant === "passport" ? "passport" : "american_visa",
              });
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                Excluindo
              </>
            ) : (
              "Excluir"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function formHref(item: FormChecklistItem, variant: "visa" | "passport") {
  if (!item.profileId) {
    return "/area-do-cliente";
  }

  if (variant === "passport") {
    return `/formulario-passaporte/${item.profileId}`;
  }

  if (item.statusForm === "filled") {
    return `/resumo-formulario/${item.profileId}`;
  }

  return `/formulario/${item.profileId}?formStep=${item.formStep}`;
}

export function FormChecklist({ variant, items }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Nenhuma linha neste checklist ainda. Assim que o formulário for salvo ou enviado, ela aparece aqui.
      </p>
    );
  }

  return (
    <div className="w-full border rounded-xl overflow-hidden bg-white">
      <div className="max-h-[min(70vh,720px)] overflow-auto">
        <table className="w-full min-w-[980px] text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-52 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                Cliente
              </th>
              <th className="sticky left-52 top-0 z-30 min-w-[9rem] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                Status DS
              </th>
              {variant === "visa" ? (
                <>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">CASV</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Entrevista
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">Nº DS</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Formulário
                  </th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">Tipo</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Protocolo
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Validade
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Formulário
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60 text-right">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.userId} className="group border-b border-muted/40">
                <td className="sticky left-0 z-10 min-w-52 bg-white px-4 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] group-hover:bg-muted/50">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.isTitular ? "Titular" : "Dependente"}
                    </span>
                  </div>
                </td>
                <td className="sticky left-52 z-10 min-w-[9rem] bg-white px-4 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] group-hover:bg-muted/50">
                  <span
                    className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", {
                      "bg-emerald-100 text-emerald-700":
                        item.statusDS === "filled" || item.statusDS === "emitted",
                      "bg-amber-100 text-amber-800":
                        item.statusDS !== "filled" && item.statusDS !== "emitted",
                    })}
                  >
                    {statusDSLabel(item.statusDS)}
                  </span>
                </td>
                {variant === "visa" ? (
                  <>
                    <td className="px-4 py-4 text-sm font-medium text-foreground">
                      {item.CASVDate ? format(new Date(item.CASVDate), "dd/MM/yyyy") : "--/--/----"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-foreground">
                      {item.interviewDate ? format(new Date(item.interviewDate), "dd/MM/yyyy") : "--/--/----"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{item.DSNumber || "---"}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn("inline-flex rounded-lg px-2 py-1 text-xs font-semibold uppercase", {
                          "bg-caution text-caution-foreground": item.statusForm === "filling",
                          "bg-confirm text-confirm-foreground": item.statusForm === "filled",
                          "bg-destructive text-destructive-foreground": item.statusForm === "awaiting",
                        })}
                      >
                        {formatFormStatus(item.statusForm)}
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-4 text-sm font-medium text-foreground">
                      {item.passportType === "renovacao"
                        ? "Renovação"
                        : item.passportType === "primeiro"
                          ? "Primeiro"
                          : "—"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{item.protocol || "---"}</td>
                    <td className="px-4 py-4 text-sm font-medium text-foreground">
                      {item.expireDate ? format(new Date(item.expireDate), "dd/MM/yyyy") : "--/--/----"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn("inline-flex rounded-lg px-2 py-1 text-xs font-semibold uppercase", {
                          "bg-caution text-caution-foreground": item.statusForm === "filling",
                          "bg-confirm text-confirm-foreground": item.statusForm === "filled",
                          "bg-destructive text-destructive-foreground": item.statusForm === "awaiting",
                        })}
                      >
                        {formatFormStatus(item.statusForm)}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {item.interviewDocs?.length
                      ? item.interviewDocs.map((doc) => (
                          <Button key={doc.id} variant="secondary" size="sm" asChild>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={doc.fileName}
                              title={doc.fileName}
                            >
                              <Download className="mr-1 size-4" strokeWidth={1.5} />
                              Baixar documento
                            </a>
                          </Button>
                        ))
                      : null}

                    {variant === "visa" && item.statusForm === "filled" && item.profileId ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/resumo-formulario/${item.profileId}`}>
                          <Eye className="mr-1 size-4" strokeWidth={1.5} />
                          Ver
                        </Link>
                      </Button>
                    ) : null}

                    {item.canEdit && item.profileId ? (
                      <Button size="sm" asChild>
                        <Link href={formHref(item, variant)}>
                          <Edit className="mr-1 size-4" strokeWidth={1.5} />
                          Editar
                        </Link>
                      </Button>
                    ) : item.formLocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Lock className="size-3.5" strokeWidth={1.5} />
                        Bloqueado
                      </span>
                    ) : null}

                    {item.profileId ? (
                      <DeleteChecklistRowButton item={item} variant={variant} />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
