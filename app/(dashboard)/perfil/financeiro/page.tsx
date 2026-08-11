"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownAZ, ArrowUpAZ, Loader2, Search } from "lucide-react";

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

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function SummaryCard({
  title,
  value,
  loading,
  children,
}: {
  title: string;
  value: number;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-muted bg-white p-5 shadow-sm flex flex-col gap-3 min-h-[140px]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
          {title}
        </h2>
        {children}
      </div>
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <p className="text-2xl sm:text-3xl font-semibold text-foreground">
          {formatBRL(value)}
        </p>
      )}
    </div>
  );
}

function AmountInput({
  entryId,
  initialAmount,
  onSaved,
}: {
  entryId: string;
  initialAmount: number | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(
    initialAmount !== null && initialAmount !== undefined
      ? String(initialAmount)
      : "",
  );

  useEffect(() => {
    setValue(
      initialAmount !== null && initialAmount !== undefined
        ? String(initialAmount)
        : "",
    );
  }, [initialAmount, entryId]);

  const { mutate, isPending } = trpc.financeRouter.updateAmount.useMutation({
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
      mutate({ id: entryId, amount: null });
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Informe um valor válido");
      return;
    }
    mutate({ id: entryId, amount: parsed });
  }

  return (
    <div className="flex items-center gap-2 justify-center">
      <Input
        type="number"
        min={0}
        step="0.01"
        placeholder="R$ 0,00"
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="h-10 w-32 text-center"
      />
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}

export default function FinanceiroPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
  const [checklistMonth, setChecklistMonth] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");

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
    { enabled: canAccess },
  );

  const utils = trpc.useUtils();

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
        Financeiro
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-10">
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
          title="Últimos 30 dias"
          value={summaryQuery.data?.last30Days ?? 0}
          loading={summaryQuery.isLoading}
        />
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
        <SummaryCard
          title="Total desde o início"
          value={summaryQuery.data?.allTime ?? 0}
          loading={summaryQuery.isLoading}
        />
      </div>

      <div className="rounded-2xl border border-muted bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Checklist de pagamentos</h2>
            <p className="text-sm text-foreground/60 mt-1">
              Novos clientes entram automaticamente. Ao preencher o valor, a
              situação muda para pago e os totais são atualizados.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="h-11 flex items-center gap-2 border border-muted/70 rounded-xl bg-background px-3 py-2 w-full sm:w-72">
              <Search className="w-5 h-5 text-border flex-shrink-0" strokeWidth={1.5} />
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
                </tr>
              </thead>
              <tbody>
                {checklistQuery.isLoading ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : checklistQuery.data?.entries.length ? (
                  checklistQuery.data.entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b group hover:bg-muted/40"
                    >
                      <td className="p-4 font-medium sticky left-0 z-10 bg-white group-hover:bg-muted/40 min-w-[220px]">
                        {entry.name}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {format(new Date(entry.registeredAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <AmountInput
                          entryId={entry.id}
                          initialAmount={entry.amount}
                          onSaved={() => {
                            utils.financeRouter.getChecklist.invalidate();
                            utils.financeRouter.getSummary.invalidate();
                          }}
                        />
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
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
