"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Plus, Search } from "lucide-react";
import { DeleteChecklistRowButton } from "@/components/dashboard/delete-checklist-row-button";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetCommentBubble } from "@/components/dashboard/sheet-comment-bubble";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";
import { canAccessFinance } from "@/lib/staff-access";
import { ClientDetailsModal } from "@/components/dashboard/client-details-modal";
import { useOpenClientDetails } from "../use-open-client-details";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
}

function AmountCell({
  rowId,
  field,
  initialValue,
  onSaved,
}: {
  rowId: string;
  field:
    | "renovacao"
    | "primeiroVisto"
    | "reuniaoPaga"
    | "monitoramento"
    | "passaporte"
    | "outros";
  initialValue: number | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(
    initialValue !== null && initialValue !== undefined
      ? String(initialValue)
      : "",
  );

  useEffect(() => {
    setValue(
      initialValue !== null && initialValue !== undefined
        ? String(initialValue)
        : "",
    );
  }, [initialValue, rowId, field]);

  const { mutate, isPending } = trpc.serviceCostRouter.updateRow.useMutation({
    onSuccess: () => {
      onSaved();
      toast.success("Valor atualizado");
    },
    onError: () => {
      toast.error("Não foi possível salvar o valor");
    },
  });

  function save() {
    const trimmed = value.trim().replace(",", ".");
    if (!trimmed) {
      mutate({ id: rowId, [field]: null });
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Informe um valor válido");
      return;
    }
    mutate({ id: rowId, [field]: parsed });
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Input
        type="number"
        min={0}
        step="0.01"
        placeholder="0"
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-9 w-[100px] text-center"
      />
      {isPending && (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

function DateCell({
  rowId,
  field,
  initialValue,
  onSaved,
}: {
  rowId: string;
  field: "validadeDate";
  initialValue: Date | string | null;
  onSaved: () => void;
}) {
  const initial = toDateInputValue(initialValue);
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(toDateInputValue(initialValue));
  }, [initialValue, rowId, field]);

  const { mutate, isPending } = trpc.serviceCostRouter.updateRow.useMutation({
    onSuccess: () => {
      onSaved();
      toast.success("Data atualizada");
    },
    onError: () => {
      toast.error("Não foi possível salvar a data");
    },
  });

  function save() {
    const next = value.trim();
    const previous = toDateInputValue(initialValue);

    if (next === previous) return;

    // Só grava data completa (YYYY-MM-DD) ou limpeza do campo
    if (next && !/^\d{4}-\d{2}-\d{2}$/.test(next)) {
      setValue(previous);
      toast.error("Informe a data completa");
      return;
    }

    if (!next) {
      mutate({ id: rowId, [field]: null });
      return;
    }

    const parsed = new Date(`${next}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      setValue(previous);
      toast.error("Data inválida");
      return;
    }

    mutate({ id: rowId, [field]: parsed });
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Input
        type="date"
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-9 w-[150px]"
      />
      {isPending && (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

function OutrosCell({
  rowId,
  initialValue,
  initialComment,
  onSaved,
}: {
  rowId: string;
  initialValue: number | null;
  initialComment: string | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(
    initialValue !== null && initialValue !== undefined
      ? String(initialValue)
      : "",
  );

  useEffect(() => {
    setValue(
      initialValue !== null && initialValue !== undefined
        ? String(initialValue)
        : "",
    );
  }, [initialValue, rowId]);

  const { mutate, isPending } = trpc.serviceCostRouter.updateRow.useMutation({
    onSuccess: (_data, variables) => {
      onSaved();
      if (variables.outrosComment !== undefined) {
        toast.success("Comentário salvo");
      } else {
        toast.success("Valor atualizado");
      }
    },
    onError: () => {
      toast.error("Não foi possível salvar");
    },
  });

  function saveAmount() {
    const trimmed = value.trim().replace(",", ".");
    if (!trimmed) {
      mutate({ id: rowId, outros: null });
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Informe um valor válido");
      return;
    }
    mutate({ id: rowId, outros: parsed });
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Input
        type="number"
        min={0}
        step="0.01"
        placeholder="0"
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={saveAmount}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-9 w-[100px] text-center"
      />

      <SheetCommentBubble
        comment={initialComment ?? ""}
        isPending={isPending}
        title="Comentário (Outros)"
        ariaLabel="Comentário do serviço em Outros"
        placeholder="Ex.: tradução, envio expresso..."
        onSave={async (next) => {
          await new Promise<void>((resolve, reject) => {
            mutate(
              { id: rowId, outrosComment: next || null },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              },
            );
          });
        }}
      />

      {isPending && (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

export default function ServicosECustosPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const { openByUserId, isPending: isOpeningClient } = useOpenClientDetails();

  const { data: me, isLoading: loadingMe } = trpc.userRouter.getMe.useQuery(
    undefined,
    { retry: false },
  );

  const canAccess = useMemo(() => {
    return canAccessFinance(me?.user.role, me?.user.email);
  }, [me]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!loadingMe && me && !canAccess) {
      toast.error("Acesso não autorizado");
      router.push("/perfil/clientes");
    }
  }, [loadingMe, me, canAccess, router]);

  const utils = trpc.useUtils();

  const rowsQuery = trpc.serviceCostRouter.getRows.useQuery(
    { search: debouncedSearch || undefined },
    {
      enabled: canAccess,
      refetchInterval: (query) => {
        const data = query.state.data;
        const incomplete =
          Boolean(data?.pendingSync) ||
          Boolean(
            data?.totalImported &&
              data.linkedUsers != null &&
              data.linkedUsers < data.totalImported,
          );
        if (incomplete || query.state.error) return 1000;
        return false;
      },
      retry: 2,
    },
  );

  const { mutate: createExpense, isPending: creatingExpense } =
    trpc.serviceCostRouter.createExpense.useMutation({
      onSuccess: () => {
        setExpenseName("");
        setExpenseDescription("");
        setExpenseAmount("");
        utils.financeRouter.getExpenses.invalidate();
        utils.financeRouter.getSummary.invalidate();
        toast.success("Pagamento enviado ao financeiro");
      },
      onError: () => {
        toast.error("Não foi possível enviar o pagamento");
      },
    });

  const { mutate: deleteRow, isPending: deletingRow, variables: deletingRowVars } =
    trpc.serviceCostRouter.deleteRow.useMutation({
      onSuccess: (result) => {
        invalidateSynced();
        toast.success(result.message);
      },
      onError: (error) => {
        toast.error(error.message || "Não foi possível excluir a linha");
      },
    });

  function handleCreateExpense() {
    const amount = Number(expenseAmount.trim().replace(",", "."));
    if (!expenseName.trim() || !expenseDescription.trim()) {
      toast.error("Preencha nome e do que se trata");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    createExpense({
      name: expenseName.trim(),
      description: expenseDescription.trim(),
      amount,
    });
  }

  function invalidateSynced() {
    utils.serviceCostRouter.getRows.invalidate();
    utils.financeRouter.getChecklist.invalidate();
    utils.financeRouter.getSummary.invalidate();
  }

  if (loadingMe || !canAccess) {
    return (
      <div className="w-full min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1920px] mx-auto pb-16">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6 mt-6 lg:mt-12">
        Serviços e Custos
      </h1>

      <div className="rounded-2xl border border-muted bg-white p-4 sm:p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Cadastro de pagamentos</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Preencha e envie para alimentar o check-list de pagamentos no
            Financeiro. Os dados ficam salvos lá.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.4fr_0.8fr_auto] gap-3">
          <Input
            placeholder="Nome de quem recebe"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
          />
          <Input
            placeholder="Do que se trata (colaborador, motoboy, etc.)"
            value={expenseDescription}
            onChange={(e) => setExpenseDescription(e.target.value)}
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Valor"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
          />
          <Button
            type="button"
            onClick={handleCreateExpense}
            disabled={creatingExpense}
            className="w-full md:w-auto"
          >
            {creatingExpense ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Enviar para o financeiro
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-muted bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Planilha de serviços</h2>
            <p className="text-sm text-foreground/60 mt-1">
              A soma dos valores atualiza automaticamente o recebimento do
              cliente no Financeiro. No grupo, só o titular edita os valores;
              dependentes mostram hífen.
            </p>
            {rowsQuery.data?.pendingSync ||
            (rowsQuery.data?.totalImported &&
              rowsQuery.data.linkedUsers < rowsQuery.data.totalImported) ? (
              <p className="text-sm text-muted-foreground mt-2">
                Incluindo clientes do acompanhamento… {rowsQuery.data.linkedUsers ?? 0}/
                {rowsQuery.data.totalImported ?? "?"} na lista
                {rowsQuery.data.pendingSync
                  ? ` (${rowsQuery.data.pendingSync} restante${rowsQuery.data.pendingSync === 1 ? "" : "s"})`
                  : ""}
                . Mantenha esta página aberta até completar.
              </p>
            ) : rowsQuery.data?.totalImported ? (
              <p className="text-sm text-muted-foreground mt-2">
                {rowsQuery.data.rows.length} cliente
                {rowsQuery.data.rows.length === 1 ? "" : "s"} do acompanhamento
                {rowsQuery.data.totalImported !== rowsQuery.data.rows.length
                  ? ` (${rowsQuery.data.totalImported} na planilha)`
                  : ""}
                .
              </p>
            ) : null}
          </div>

          <div className="h-11 flex items-center gap-2 border border-muted/70 rounded-xl bg-background px-3 py-2 w-full sm:w-72">
            <Search
              className="w-5 h-5 text-border flex-shrink-0"
              strokeWidth={1.5}
            />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-auto max-h-[min(75vh,800px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
                <tr className="border-b">
                  <th className="h-12 px-3 text-left font-medium text-muted-foreground sticky left-0 top-0 z-30 bg-white min-w-[200px]">
                    Cliente
                  </th>
                  <th className="h-12 px-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Renovação
                  </th>
                  <th className="h-12 px-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Primeiro visto
                  </th>
                  <th className="h-12 px-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Reunião paga
                  </th>
                  <th className="h-12 px-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Monitoramento
                  </th>
                  <th className="h-12 px-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Passaporte
                  </th>
                  <th className="h-12 px-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Outros
                  </th>
                  <th className="h-12 px-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Data da viagem
                  </th>
                  <th className="h-12 px-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Situação
                  </th>
                  <th className="h-12 px-3 text-center font-medium text-muted-foreground sticky right-0 top-0 z-30 bg-white whitespace-nowrap shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {rowsQuery.isLoading ? (
                  <tr>
                    <td colSpan={10} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : rowsQuery.data?.rows.length ? (
                  rowsQuery.data.rows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b group hover:bg-muted/40",
                        isOpeningClient && "pointer-events-none opacity-70",
                      )}
                    >
                      <td className="p-3 font-medium sticky left-0 z-10 bg-white group-hover:bg-muted/40 min-w-[200px]">
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => openByUserId(row.userId)}
                        >
                          <div>{row.clientName}</div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {row.isDependent
                              ? `Grupo: ${row.groupName ?? "—"}`
                              : `Total: ${formatBRL(row.total)}`}
                          </div>
                        </button>
                      </td>
                      <td className="p-2 text-center">
                        {row.isDependent ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <AmountCell
                            rowId={row.id}
                            field="renovacao"
                            initialValue={row.renovacao}
                            onSaved={invalidateSynced}
                          />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {row.isDependent ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <AmountCell
                            rowId={row.id}
                            field="primeiroVisto"
                            initialValue={row.primeiroVisto}
                            onSaved={invalidateSynced}
                          />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {row.isDependent ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <AmountCell
                            rowId={row.id}
                            field="reuniaoPaga"
                            initialValue={row.reuniaoPaga}
                            onSaved={invalidateSynced}
                          />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {row.isDependent ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <AmountCell
                            rowId={row.id}
                            field="monitoramento"
                            initialValue={row.monitoramento}
                            onSaved={invalidateSynced}
                          />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {row.isDependent ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <AmountCell
                            rowId={row.id}
                            field="passaporte"
                            initialValue={row.passaporte}
                            onSaved={invalidateSynced}
                          />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {row.isDependent ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <OutrosCell
                            rowId={row.id}
                            initialValue={row.outros}
                            initialComment={row.outrosComment}
                            onSaved={invalidateSynced}
                          />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <DateCell
                          rowId={row.id}
                          field="validadeDate"
                          initialValue={row.validadeDate}
                          onSaved={invalidateSynced}
                        />
                      </td>
                      <td className="p-3 text-center">
                        {row.situacao ? (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                              row.situacao === "urgente" &&
                                "bg-red-100 text-red-700",
                              row.situacao === "media" &&
                                "bg-amber-100 text-amber-800",
                              row.situacao === "baixa" &&
                                "bg-emerald-100 text-emerald-700",
                            )}
                          >
                            {row.situacao === "urgente"
                              ? "URGENTE"
                              : row.situacao === "media"
                                ? "MÉDIA"
                                : "BAIXA"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center sticky right-0 z-10 bg-white group-hover:bg-muted/40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                        <DeleteChecklistRowButton
                          title={
                            row.isDependent
                              ? "Excluir linha do dependente?"
                              : "Cancelar a compra deste cliente?"
                          }
                          description={
                            row.isDependent
                              ? "A linha deste dependente sai de Serviços e Custos e do Financeiro. O cadastro do cliente permanece."
                              : "A linha do titular e dos dependentes do grupo sai de Serviços e Custos e do Financeiro. O cadastro do cliente permanece."
                          }
                          isPending={deletingRow && deletingRowVars?.id === row.id}
                          onConfirm={() => deleteRow({ id: row.id })}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <ClientDetailsModal />
    </>
  );
}
