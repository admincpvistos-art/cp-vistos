"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Edit, Eye, Lock } from "lucide-react";
import { StatusDS, StatusForm, VisaStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FormChecklistItem = {
  userId: string;
  name: string;
  isTitular: boolean;
  profileId: string | null;
  statusForm: StatusForm;
  statusDS: StatusDS | null;
  visaStatus: VisaStatus | null;
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

function formatDSStatus(status: StatusDS | null) {
  switch (status) {
    case "awaiting":
      return "Aguardando";
    case "filling":
      return "Preenchendo";
    case "filled":
      return "Preenchido";
    case "emitted":
      return "Emitido";
    default:
      return "—";
  }
}

function situationLabel(status: VisaStatus | null) {
  return status === "approved" ? "Aprovado" : "Pendente";
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
              <th className="sticky left-52 top-0 z-30 min-w-[7.5rem] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                Situação
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
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Status DS
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
                <td className="sticky left-52 z-10 min-w-[7.5rem] bg-white px-4 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] group-hover:bg-muted/50">
                  <span
                    className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", {
                      "bg-emerald-100 text-emerald-700": item.visaStatus === "approved",
                      "bg-amber-100 text-amber-800": item.visaStatus !== "approved",
                    })}
                  >
                    {situationLabel(item.visaStatus)}
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
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{formatDSStatus(item.statusDS)}</td>
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
                  <div className="flex items-center justify-end gap-2">
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
