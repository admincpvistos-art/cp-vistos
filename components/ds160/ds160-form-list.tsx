"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusForm } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewStatusLabel } from "@/lib/ds160-ceac";
import { trpc } from "@/lib/trpc-client";

interface Props {
  mode: "review" | "fill";
}

type ListRow = {
  profileId: string;
  name: string;
  email: string;
  group: string | null;
  ds160ReviewStatus: string | null;
  statusForm: StatusForm;
  reviewedCount: number;
  totalPages: number;
  updatedAt: Date | string | null;
};

function hrefFor(mode: Props["mode"], profileId: string) {
  return mode === "fill"
    ? `/perfil/preencher-ds160/${profileId}`
    : `/perfil/conferir-formularios/${profileId}`;
}

function actionLabel(mode: Props["mode"]) {
  return mode === "fill" ? "Preencher" : "Conferir";
}

function formatUpdatedAt(value: ListRow["updatedAt"]) {
  if (!value) {
    return "—";
  }

  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ActionButton({ mode, profileId }: { mode: Props["mode"]; profileId: string }) {
  return (
    <Button size="sm" asChild>
      <Link href={hrefFor(mode, profileId)}>
        {actionLabel(mode)}
        <ArrowRight className="ml-1 size-4" />
      </Link>
    </Button>
  );
}

function MobileCards({ mode, rows }: { mode: Props["mode"]; rows: ListRow[] }) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {rows.map((row) => (
        <article
          key={row.profileId}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-foreground">{row.name}</p>
              <p className="mt-0.5 break-all text-xs text-muted-foreground">{row.email}</p>
            </div>
            <ActionButton mode={mode} profileId={row.profileId} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Grupo
              </dt>
              <dd className="mt-1 font-medium">{row.group || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </dt>
              <dd className="mt-1 font-medium">
                {reviewStatusLabel(row.ds160ReviewStatus, row.statusForm)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Conferência
              </dt>
              <dd className="mt-1 font-medium">
                {row.reviewedCount}/{row.totalPages}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Atualizado
              </dt>
              <dd className="mt-1 font-medium">{formatUpdatedAt(row.updatedAt)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function DesktopTable({ mode, rows }: { mode: Props["mode"]; rows: ListRow[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
      <div className="max-h-[min(70vh,720px)] overflow-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-52 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                Cliente
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Grupo
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Conferência
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Atualizado
              </th>
              <th className="sticky right-0 top-0 z-30 min-w-[8.5rem] bg-white px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-foreground/60 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.profileId} className="group">
                <td className="sticky left-0 z-10 min-w-52 bg-white px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] group-hover:bg-muted/50">
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">{row.group || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {reviewStatusLabel(row.ds160ReviewStatus, row.statusForm)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {row.reviewedCount}/{row.totalPages}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {formatUpdatedAt(row.updatedAt)}
                </td>
                <td className="sticky right-0 z-10 min-w-[8.5rem] bg-white px-4 py-3 text-right shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)] group-hover:bg-muted/50">
                  <ActionButton mode={mode} profileId={row.profileId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Ds160FormList({ mode }: Props) {
  const [search, setSearch] = useState("");
  const { data, isPending, isFetching } = trpc.ds160Router.list.useQuery(
    { mode },
    {
      refetchInterval: (query) =>
        query.state.data?.pendingSync ? 1500 : false,
    },
  );

  const rows = data?.rows ?? [];
  const pendingSync = data?.pendingSync ?? 0;

  const filteredRows = useMemo(() => {
    const term = normalizeSearch(search.trim());
    if (!term) {
      return rows;
    }

    return rows.filter((row) => {
      const haystack = normalizeSearch(
        `${row.name} ${row.email} ${row.group ?? ""}`,
      );
      return haystack.includes(term);
    });
  }, [rows, search]);

  if (isPending) {
    return <p className="py-10 text-sm text-muted-foreground">Carregando formulários…</p>;
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-11 flex items-center gap-2 border border-muted/70 rounded-xl bg-background px-3 py-2 w-full sm:max-w-sm">
          <Search className="w-5 h-5 text-border flex-shrink-0" strokeWidth={1.5} />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        {search.trim() && rows.length ? (
          <p className="text-sm text-muted-foreground">
            {filteredRows.length} de {rows.length} cliente
            {rows.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      {pendingSync ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Incluindo clientes do acompanhamento… {pendingSync} restante
          {pendingSync === 1 ? "" : "s"}
          {isFetching ? " ·" : ""}
        </p>
      ) : null}
      {!rows.length ? (
        <p className="py-10 text-sm text-muted-foreground">
          {mode === "fill"
            ? "Nenhum cliente do acompanhamento para preencher no CEAC ainda."
            : "Nenhum cliente do acompanhamento para conferência ainda."}
        </p>
      ) : !filteredRows.length ? (
        <p className="py-10 text-sm text-muted-foreground">
          Nenhum cliente encontrado para “{search.trim()}”.
        </p>
      ) : (
        <>
          <MobileCards mode={mode} rows={filteredRows} />
          <DesktopTable mode={mode} rows={filteredRows} />
        </>
      )}
    </>
  );
}
