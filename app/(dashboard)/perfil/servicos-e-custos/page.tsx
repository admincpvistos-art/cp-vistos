"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";

const FINANCE_ADMIN_EMAILS = [
  "cpassessoriavistos@gmail.com",
  "admin@cpvistos.com",
];

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
    | "passaporte";
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
  field: "validadeDate" | "limiteDate";
  initialValue: Date | string | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(toDateInputValue(initialValue));

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

  function save(next: string) {
    if (!next) {
      mutate({ id: rowId, [field]: null });
      return;
    }
    const parsed = new Date(`${next}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
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
        onChange={(e) => {
          setValue(e.target.value);
          save(e.target.value);
        }}
        className="h-9 w-[150px]"
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

  const { data: me, isLoading: loadingMe } = trpc.userRouter.getMe.useQuery(
    undefined,
    { retry: false },
  );

  const canAccess = useMemo(() => {
    const email = me?.user.email?.toLowerCase();
    return (
      me?.user.role === "ADMIN" &&
      !!email &&
      FINANCE_ADMIN_EMAILS.includes(email)
    );
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
    { enabled: canAccess },
  );

  const expensesQuery = trpc.financeRouter.getExpenses.useQuery(undefined, {
    enabled: canAccess,
  });

  const { mutate: createExpense, isPending: creatingExpense } =
    trpc.serviceCostRouter.createExpense.useMutation({
      onSuccess: () => {
        setExpenseName("");
        setExpenseDescription("");
        setExpenseAmount("");
        utils.financeRouter.getExpenses.invalidate();
        utils.financeRouter.getSummary.invalidate();
        toast.success("Pagamento inserido no financeiro");
      },
      onError: () => {
        toast.error("Não foi possível inserir o pagamento");
      },
    });

  const { mutate: deleteExpense, isPending: deletingExpense } =
    trpc.serviceCostRouter.deleteExpense.useMutation({
      onSuccess: () => {
        utils.financeRouter.getExpenses.invalidate();
        utils.financeRouter.getSummary.invalidate();
        toast.success("Pagamento removido");
      },
      onError: () => {
        toast.error("Não foi possível remover o pagamento");
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
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1920px] mx-auto pb-16">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6 mt-6 lg:mt-12">
        Serviços e Custos
      </h1>

      <div className="rounded-2xl border border-muted bg-white p-4 sm:p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Gastos pontuais</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Preencha e clique em inserir para alimentar os pagamentos da
            dashboard Financeiro.
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
                Inserir no financeiro
              </>
            )}
          </Button>
        </div>

        <div className="border rounded-xl overflow-hidden mt-6">
          <div className="overflow-auto max-h-[min(40vh,360px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
                <tr className="border-b">
                  <th className="h-11 px-4 text-left font-medium text-muted-foreground">
                    Nome
                  </th>
                  <th className="h-11 px-4 text-left font-medium text-muted-foreground">
                    Do que se trata
                  </th>
                  <th className="h-11 px-4 text-center font-medium text-muted-foreground">
                    Valor
                  </th>
                  <th className="h-11 px-4 text-center font-medium text-muted-foreground w-14" />
                </tr>
              </thead>
              <tbody>
                {expensesQuery.isLoading ? (
                  <tr>
                    <td colSpan={4} className="h-20 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : expensesQuery.data?.expenses.length ? (
                  expensesQuery.data.expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-muted/40">
                      <td className="p-3 font-medium">{expense.name}</td>
                      <td className="p-3">{expense.description}</td>
                      <td className="p-3 text-center whitespace-nowrap font-semibold">
                        {formatBRL(expense.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={deletingExpense}
                          onClick={() => deleteExpense({ id: expense.id })}
                          aria-label="Remover pagamento"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="h-20 text-center text-muted-foreground"
                    >
                      Nenhum gasto pontual lançado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-muted bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Planilha de serviços</h2>
            <p className="text-sm text-foreground/60 mt-1">
              A soma dos valores atualiza automaticamente o recebimento do
              cliente no Financeiro.
            </p>
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
                    Data da viagem
                  </th>
                  <th className="h-12 px-2 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Data limite
                  </th>
                  <th className="h-12 px-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {rowsQuery.isLoading ? (
                  <tr>
                    <td colSpan={9} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : rowsQuery.data?.rows.length ? (
                  rowsQuery.data.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b group hover:bg-muted/40"
                    >
                      <td className="p-3 font-medium sticky left-0 z-10 bg-white group-hover:bg-muted/40 min-w-[200px]">
                        <div>{row.clientName}</div>
                        <div className="text-xs text-muted-foreground font-normal">
                          Total: {formatBRL(row.total)}
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <AmountCell
                          rowId={row.id}
                          field="renovacao"
                          initialValue={row.renovacao}
                          onSaved={invalidateSynced}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <AmountCell
                          rowId={row.id}
                          field="primeiroVisto"
                          initialValue={row.primeiroVisto}
                          onSaved={invalidateSynced}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <AmountCell
                          rowId={row.id}
                          field="reuniaoPaga"
                          initialValue={row.reuniaoPaga}
                          onSaved={invalidateSynced}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <AmountCell
                          rowId={row.id}
                          field="monitoramento"
                          initialValue={row.monitoramento}
                          onSaved={invalidateSynced}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <AmountCell
                          rowId={row.id}
                          field="passaporte"
                          initialValue={row.passaporte}
                          onSaved={invalidateSynced}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <DateCell
                          rowId={row.id}
                          field="validadeDate"
                          initialValue={row.validadeDate}
                          onSaved={invalidateSynced}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <DateCell
                          rowId={row.id}
                          field="limiteDate"
                          initialValue={row.limiteDate}
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
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
  );
}
