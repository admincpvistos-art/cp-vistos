"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Loader2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteChecklistRowButton } from "@/components/dashboard/delete-checklist-row-button";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";
import { canAccessFinance } from "@/lib/staff-access";
import { ClientDetailsModal } from "@/components/dashboard/client-details-modal";
import { useOpenClientDetails } from "../use-open-client-details";
import { useAcompanhamentoOperationsSync } from "@/hooks/use-acompanhamento-operations-sync";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function SummaryCard({
  title,
  value,
  loading,
  emphasize,
  children,
}: {
  title: string;
  value: number;
  loading?: boolean;
  emphasize?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-muted bg-white p-5 shadow-sm flex flex-col gap-3 min-h-[140px]",
        emphasize && "border-primary/30 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
          {title}
        </h2>
        {children}
      </div>
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <p
          className={cn(
            "text-2xl sm:text-3xl font-semibold",
            value < 0 ? "text-red-600" : "text-foreground",
          )}
        >
          {formatBRL(value)}
        </p>
      )}
    </div>
  );
}

export default function FinanceiroPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
  const [checklistMonth, setChecklistMonth] = useState<string>("");
  const [expensesMonth, setExpensesMonth] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const { openByUserId, isPending: isOpeningClient } = useOpenClientDetails();

  const { data: me, isLoading: loadingMe } = trpc.userRouter.getMe.useQuery(
    undefined,
    { retry: false },
  );

  const canAccess = useMemo(() => {
    return canAccessFinance(me?.user.role, me?.user.email);
  }, [me]);

  useAcompanhamentoOperationsSync(canAccess);

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

  const summaryQuery = trpc.financeRouter.getSummary.useQuery(
    { yearMonth: selectedMonth },
    { enabled: canAccess },
  );

  const checklistQuery = trpc.financeRouter.getChecklist.useQuery(
    {
      search: debouncedSearch || undefined,
      yearMonth: checklistMonth || null,
      sort,
    },
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
        return incomplete ? 2000 : false;
      },
    },
  );

  const expensesQuery = trpc.financeRouter.getExpenses.useQuery(
    { yearMonth: expensesMonth || null },
    { enabled: canAccess },
  );

  const utils = trpc.useUtils();

  const {
    mutate: deleteExpense,
    isPending: deletingExpense,
    variables: deletingExpenseVars,
  } = trpc.financeRouter.deleteExpense.useMutation({
    onSuccess: (result) => {
      utils.financeRouter.getExpenses.invalidate();
      utils.financeRouter.getSummary.invalidate();
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível excluir o pagamento");
    },
  });

  const {
    mutate: deleteReceipt,
    isPending: deletingReceipt,
    variables: deletingReceiptVars,
  } = trpc.financeRouter.deleteReceipt.useMutation({
    onSuccess: (result) => {
      utils.financeRouter.getChecklist.invalidate();
      utils.financeRouter.getSummary.invalidate();
      utils.serviceCostRouter.getRows.invalidate();
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível excluir a linha");
    },
  });

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
        Financeiro
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        <SummaryCard
          title="Recebido no mês"
          value={summaryQuery.data?.monthTotal ?? 0}
          loading={summaryQuery.isLoading}
        >
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 w-[150px]"
          />
        </SummaryCard>

        <SummaryCard
          title="Últimos 6 meses"
          value={summaryQuery.data?.last6Months ?? 0}
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Último ano"
          value={summaryQuery.data?.lastYear ?? 0}
          loading={summaryQuery.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <SummaryCard
          title="Total desde o início"
          value={summaryQuery.data?.allTime ?? 0}
          loading={summaryQuery.isLoading}
        />
        <SummaryCard
          title="Total líquido mês"
          value={summaryQuery.data?.netMonth ?? 0}
          loading={summaryQuery.isLoading}
          emphasize
        >
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 w-[150px]"
          />
        </SummaryCard>
        <SummaryCard
          title="Total líquido desde o início"
          value={summaryQuery.data?.netAllTime ?? 0}
          loading={summaryQuery.isLoading}
          emphasize
        />
      </div>

      <div className="rounded-2xl border border-muted bg-white p-4 sm:p-6 shadow-sm mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Pagamentos</h2>
            <p className="text-sm text-foreground/60 mt-1">
              Registros somente leitura. Lance novos gastos em{" "}
              <Link
                href="/perfil/servicos-e-custos"
                className="text-primary underline underline-offset-2"
              >
                Serviços e Custos
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Input
              type="month"
              value={expensesMonth}
              onChange={(e) => setExpensesMonth(e.target.value)}
              className="h-11 w-full sm:w-[170px]"
              title="Filtrar por mês do pagamento"
            />
            {expensesMonth && (
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setExpensesMonth("")}
              >
                Limpar mês
              </Button>
            )}
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-auto max-h-[min(50vh,480px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
                <tr className="border-b">
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">
                    Nome
                  </th>
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">
                    Descrição do serviço
                  </th>
                  <th className="h-12 px-4 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Valor pago
                  </th>
                  <th className="h-12 px-4 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Data
                  </th>
                  <th className="h-12 px-4 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {expensesQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : expensesQuery.data?.expenses.length ? (
                  expensesQuery.data.expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-muted/40">
                      <td className="p-4 font-medium">{expense.name}</td>
                      <td className="p-4">{expense.description}</td>
                      <td className="p-4 text-center whitespace-nowrap font-semibold">
                        {formatBRL(expense.amount)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {format(new Date(expense.paidAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <DeleteChecklistRowButton
                          title="Excluir este pagamento?"
                          description="O gasto sai do check-list de pagamentos e deixa de contar no total do Financeiro."
                          isPending={
                            deletingExpense && deletingExpenseVars?.id === expense.id
                          }
                          onConfirm={() => deleteExpense({ id: expense.id })}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum pagamento lançado
                      {expensesMonth ? " neste mês" : ""}
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
            <h2 className="text-xl font-semibold">
              Check-list de recebimentos
            </h2>
            <p className="text-sm text-foreground/60 mt-1">
              Valores travados: a soma vem da planilha em{" "}
              <Link
                href="/perfil/servicos-e-custos"
                className="text-primary underline underline-offset-2"
              >
                Serviços e Custos
              </Link>
              .
            </p>
            {checklistQuery.data?.pendingSync ||
            (checklistQuery.data?.totalImported &&
              checklistQuery.data.linkedUsers < checklistQuery.data.totalImported) ? (
              <p className="text-sm text-muted-foreground mt-2">
                Incluindo clientes do acompanhamento…{" "}
                {checklistQuery.data.linkedUsers ?? 0}/
                {checklistQuery.data.totalImported ?? "?"} na lista
                {checklistQuery.data.pendingSync
                  ? ` (${checklistQuery.data.pendingSync} restante${checklistQuery.data.pendingSync === 1 ? "" : "s"})`
                  : ""}
                . Mantenha esta página aberta até completar.
              </p>
            ) : checklistQuery.data?.totalImported ? (
              <p className="text-sm text-muted-foreground mt-2">
                {checklistQuery.data.entries.length} cliente
                {checklistQuery.data.entries.length === 1 ? "" : "s"} do acompanhamento
                {checklistQuery.data.totalImported !== checklistQuery.data.entries.length
                  ? ` (${checklistQuery.data.totalImported} na planilha)`
                  : ""}
                .
              </p>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
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

            <Input
              type="month"
              value={checklistMonth}
              onChange={(e) => setChecklistMonth(e.target.value)}
              className="h-11 w-full sm:w-[170px]"
              title="Filtrar por mês de cadastro"
            />

            {checklistMonth && (
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setChecklistMonth("")}
              >
                Limpar mês
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setSort((prev) => (prev === "desc" ? "asc" : "desc"))}
            >
              {sort === "desc" ? (
                <>
                  <ArrowDownAZ className="mr-2 h-4 w-4" />
                  Mais recentes
                </>
              ) : (
                <>
                  <ArrowUpAZ className="mr-2 h-4 w-4" />
                  Mais antigos
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-auto max-h-[min(70vh,720px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
                <tr className="border-b">
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground sticky left-0 top-0 z-30 bg-white min-w-[220px]">
                    Nome
                  </th>
                  <th className="h-12 px-4 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Data de cadastro
                  </th>
                  <th className="h-12 px-4 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Valor pago
                  </th>
                  <th className="h-12 px-4 text-center font-medium text-muted-foreground whitespace-nowrap">
                    Situação
                  </th>
                  <th className="h-12 px-4 text-center font-medium text-muted-foreground sticky right-0 top-0 z-30 bg-white whitespace-nowrap shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {checklistQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : checklistQuery.data?.entries.length ? (
                  checklistQuery.data.entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={cn(
                        "border-b group hover:bg-muted/40",
                        isOpeningClient && "pointer-events-none opacity-70",
                      )}
                    >
                      <td className="p-4 font-medium sticky left-0 z-10 bg-white group-hover:bg-muted/40 min-w-[220px]">
                        <button
                          type="button"
                          className="text-left hover:underline"
                          onClick={() => openByUserId(entry.userId)}
                        >
                          <div>{entry.name}</div>
                          {entry.groupName && (
                            <div className="text-xs text-muted-foreground font-normal">
                              Grupo: {entry.groupName}
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {format(new Date(entry.registeredAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap font-semibold">
                        {entry.isDependent
                          ? "-"
                          : entry.amount !== null && entry.amount !== undefined
                            ? formatBRL(entry.amount)
                            : "—"}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            entry.status === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {entry.status === "paid" ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td className="p-4 text-center sticky right-0 z-10 bg-white group-hover:bg-muted/40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                        <DeleteChecklistRowButton
                          title={
                            entry.isDependent
                              ? "Excluir linha do dependente?"
                              : "Cancelar a compra deste cliente?"
                          }
                          description={
                            entry.isDependent
                              ? "A linha deste dependente sai do Financeiro e de Serviços e Custos. O cadastro do cliente permanece."
                              : "A linha do titular e dos dependentes do grupo sai do Financeiro e de Serviços e Custos. O cadastro do cliente permanece."
                          }
                          isPending={
                            deletingReceipt && deletingReceiptVars?.id === entry.id
                          }
                          onConfirm={() => deleteReceipt({ id: entry.id })}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
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
