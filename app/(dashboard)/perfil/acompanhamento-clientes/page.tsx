"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetClientsTable, type SheetClientRow } from "@/components/dashboard/sheet-clients-table";
import { trpc } from "@/lib/trpc-client";
import {
  ACOMPANHAMENTO_SERVICE_OPTIONS,
  type AcompanhamentoService,
} from "@/lib/acompanhamento-types";
import {
  canAccessAcompanhamento,
  canArchiveAcompanhamento,
  canAssignAcompanhamentoResponsible,
  isFinanceAdminEmail,
  isFullAdmin,
  isOfficeCollaboratorEmail,
  normalizeEmail,
} from "@/lib/staff-access";
import { cn } from "@/lib/utils";
import { AcompanhamentoEditSheet } from "./acompanhamento-edit-sheet";

type ResponsibleFilter = "all" | "unassigned" | "admins" | "collaborators" | "mine" | string;
type ServiceFilter = "all" | AcompanhamentoService;

function CollaboratorStatsCards({
  stats,
}: {
  stats: {
    totalClientes: number;
    primeiroVisto: number;
    passaporte: number;
    esta: number;
    totalPago: number;
    scope?: "collaborator" | "admin_shared";
  };
}) {
  const cards = [
    {
      label: "Clientes",
      value: String(stats.totalClientes),
      hint:
        stats.scope === "admin_shared"
          ? "admins / sem responsável"
          : "sob sua responsabilidade",
    },
    {
      label: "1º vistos",
      value: String(stats.primeiroVisto),
      hint: "serviços marcados",
    },
    {
      label: "Passaportes",
      value: String(stats.passaporte),
      hint: "serviços marcados",
    },
    {
      label: "ESTA / E-TA",
      value: String(stats.esta),
      hint: "serviços marcados",
    },
    {
      label: "Total pago",
      value: String(stats.totalPago),
      hint: "clientes que já pagaram",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border/70 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
          </div>
          <p className={cn("mt-2 text-2xl font-semibold text-foreground tabular-nums")}>
            {card.value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}

function CompactFilter({
  value,
  onValueChange,
  placeholder,
  children,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("h-12 w-[10.5rem] bg-white", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

export default function AcompanhamentoClientesPage() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [responsibleFilter, setResponsibleFilter] = useState<ResponsibleFilter>("all");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");

  const { data: me, isLoading: isMeLoading } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
  });
  const canAccess = canAccessAcompanhamento(me?.user.role, me?.user.email);
  const canArchive = canArchiveAcompanhamento(me?.user.role, me?.user.email);
  const canAssignResponsible = canAssignAcompanhamentoResponsible(me?.user.role, me?.user.email);
  const isAdmin = isFullAdmin(me?.user.role, me?.user.email);
  const myEmail = normalizeEmail(me?.user.email);
  const myName = me?.user.name?.trim() || myEmail;

  const { data, isLoading, isError, error, refetch } =
    trpc.acompanhamentoRouter.getClientesSheet.useQuery(undefined, {
      enabled: canAccess,
      retry: false,
    });
  const showStats = Boolean(data?.stats);

  const { data: assigneesData } = trpc.acompanhamentoRouter.listAssignees.useQuery(undefined, {
    enabled: canAccess && isAdmin,
    retry: false,
  });
  const assignees = assigneesData?.assignees ?? [];

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
      responsibleEmail: row.responsibleEmail ?? null,
      budgetPaid: row.accountFields?.budgetPaid ?? "",
    }));
  }, [data?.rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const responsible = normalizeEmail(row.responsibleEmail);

      if (responsibleFilter === "unassigned" && responsible) {
        return false;
      }
      if (responsibleFilter === "admins") {
        if (responsible && !isFinanceAdminEmail(responsible)) {
          return false;
        }
      }
      if (responsibleFilter === "collaborators") {
        if (!isOfficeCollaboratorEmail(responsible)) {
          return false;
        }
      }
      if (responsibleFilter === "mine") {
        if (responsible !== myEmail) {
          return false;
        }
      }
      if (
        responsibleFilter !== "all" &&
        responsibleFilter !== "unassigned" &&
        responsibleFilter !== "admins" &&
        responsibleFilter !== "collaborators" &&
        responsibleFilter !== "mine" &&
        responsible !== normalizeEmail(responsibleFilter)
      ) {
        return false;
      }

      if (serviceFilter !== "all" && !(row.services ?? []).includes(serviceFilter)) {
        return false;
      }

      return true;
    });
  }, [myEmail, responsibleFilter, rows, serviceFilter]);

  async function handleDeleteRow(row: SheetClientRow) {
    const result = await deleteRow({ id: row.id });
    toast.success("Cliente excluído do Acompanhamento");

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

    await utils.acompanhamentoRouter.getClientesSheet.invalidate();

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

        {showStats && data?.stats ? (
          <CollaboratorStatsCards stats={data.stats} />
        ) : null}

        <SheetClientsTable
          rows={filteredRows}
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
          toolbarMiddle={
            <div className="flex items-center gap-3 shrink-0">
              <CompactFilter
                value={responsibleFilter}
                onValueChange={setResponsibleFilter}
                placeholder="Responsável"
                className="w-[12rem]"
              >
                <SelectItem value="all">Responsável: todos</SelectItem>
                <SelectItem value="unassigned">Sem responsável</SelectItem>
                {isAdmin ? (
                  <>
                    <SelectItem value="admins">Admins (pool)</SelectItem>
                    <SelectItem value="collaborators">Colaboradores</SelectItem>
                    {assignees.map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.email}>
                        {assignee.name}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <SelectItem value="mine">{myName}</SelectItem>
                )}
              </CompactFilter>

              <CompactFilter
                value={serviceFilter}
                onValueChange={(value) => setServiceFilter(value as ServiceFilter)}
                placeholder="Serviço"
              >
                <SelectItem value="all">Serviço: todos</SelectItem>
                {ACOMPANHAMENTO_SERVICE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </CompactFilter>
            </div>
          }
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
        canAssignResponsible={canAssignResponsible}
        onCreated={(id) => {
          setCreating(false);
          setEditingId(id);
        }}
        onClose={() => {
          setEditingId(null);
          setCreating(false);
        }}
      />
    </>
  );
}
