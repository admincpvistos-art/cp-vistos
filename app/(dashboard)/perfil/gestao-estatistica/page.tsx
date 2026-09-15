"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc-client";
import { canAccessAcompanhamento, isFullAdmin } from "@/lib/staff-access";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "danger" | "warn" | "info" | "ok";
  hint?: string;
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-900"
          : tone === "ok"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={cn("rounded-2xl border px-4 py-3 shadow-sm", toneClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs opacity-70">{hint}</p> : null}
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function BarList({
  items,
  colorClass = "bg-sky-500",
}: {
  items: { label: string; count: number; extra?: string }[];
  colorClass?: string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  if (!items.length) {
    return <p className="text-sm text-slate-500">Sem dados neste recorte.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-800 truncate">{item.label}</span>
            <span className="tabular-nums text-slate-600 shrink-0">
              {item.count}
              {item.extra ? ` · ${item.extra}` : ""}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", colorClass)}
              style={{ width: `${Math.max((item.count / max) * 100, item.count > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GestaoEstatisticaPage() {
  const router = useRouter();
  const { data: me, isLoading: isMeLoading } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
  });
  const canAccess = canAccessAcompanhamento(me?.user.role, me?.user.email);
  const isAdmin = isFullAdmin(me?.user.role, me?.user.email);

  const { data, isLoading, isError, error, refetch, isFetching } =
    trpc.gestaoEstatisticaRouter.getDashboard.useQuery(undefined, {
      enabled: canAccess,
      retry: false,
    });

  useEffect(() => {
    if (!me || isMeLoading) {
      return;
    }
    if (!canAccess) {
      toast.error("Acesso não autorizado");
      router.push("/perfil/prospects");
    }
  }, [canAccess, isMeLoading, me, router]);

  const generatedLabel = useMemo(() => {
    if (!data?.generatedAt) {
      return "";
    }
    return new Date(data.generatedAt).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  }, [data?.generatedAt]);

  if (!me || isMeLoading || !canAccess) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1920px] mx-auto pb-12">
      <div className="mt-6 lg:mt-12 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900">
            Gestão Estatística
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "Visão completa da operação — substitui a dashboard do Excel."
              : "Sua carteira: clientes sob sua responsabilidade e sem responsável."}
            {generatedLabel ? ` · Atualizado em ${generatedLabel}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
          <Button type="button" asChild>
            <Link href="/perfil/acompanhamento-clientes">Abrir Acompanhamento</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{error.message || "Não foi possível carregar"}</p>
      ) : data ? (
        <div className="space-y-6">
          <Section title="Clientes ativos">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <KpiCard label="Total em processo" value={data.ativos.total} />
              <KpiCard label="1º visto" value={data.ativos.primeiroVisto} tone="info" />
              <KpiCard label="Renovação" value={data.ativos.renovacao} />
              <KpiCard label="Passaporte" value={data.ativos.passaporte} />
              <KpiCard label="ESTA / E-TA" value={data.ativos.esta} />
              <KpiCard label="Finalizados" value={data.ativos.finalizados} tone="ok" />
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiCard label="Sem responsável" value={data.ativos.semResponsavel} tone="warn" />
              {isAdmin && data.ativos.poolAdmins != null ? (
                <KpiCard
                  label="Pool admins"
                  value={data.ativos.poolAdmins}
                  hint="Sem responsável ou designados aos admins"
                />
              ) : null}
            </div>
          </Section>

          <Section title="Alertas & prazos">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              Acompanhamento geral
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <KpiCard label="CASV em 7 dias" value={data.alertas.casv7} tone="danger" />
              <KpiCard label="CASV em 30 dias" value={data.alertas.casv30} tone="warn" />
              <KpiCard label="Sem CASV agendado" value={data.alertas.semCasv} tone="info" />
              <KpiCard label="Taxa não paga" value={data.alertas.taxaNaoPaga} tone="warn" />
              <KpiCard label="Form pendente" value={data.alertas.formPendente} />
            </div>

            <p className="mt-5 mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              1º visto — janelas curtas
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <KpiCard label="CASV em 2 dias" value={data.alertas.casv2Primeiro} tone="danger" />
              <KpiCard label="Entrevista em 2 dias" value={data.alertas.entrevista2} tone="warn" />
              <KpiCard label="Entrevista em 3 dias" value={data.alertas.entrevista3} tone="warn" />
              <KpiCard label="Entrevista em 7 dias" value={data.alertas.entrevista7} tone="warn" />
              <KpiCard label="Entrevista em 14 dias" value={data.alertas.entrevista14} tone="warn" />
            </div>

            <p className="mt-5 mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              Renovação — CASV
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiCard label="CASV em 2 dias" value={data.alertas.casv2Renovacao} tone="danger" />
              <KpiCard label="CASV em 7 dias" value={data.alertas.casv7Renovacao} tone="warn" />
              <KpiCard label="CASV em 14 dias" value={data.alertas.casv14Renovacao} tone="warn" />
            </div>
          </Section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Section title="Por responsável (ativos)">
              <BarList
                colorClass="bg-indigo-500"
                items={data.byResponsible.map((item) => ({
                  label: item.label,
                  count: item.total,
                  extra: `1º ${item.primeiroVisto} · Ren ${item.renovacao}`,
                }))}
              />
            </Section>

            <Section title="Status DS-160 (ativos)">
              <BarList colorClass="bg-violet-500" items={data.ds160} />
            </Section>
          </div>

          {isAdmin ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Section title="Passaportes (perfis)">
                <BarList colorClass="bg-teal-500" items={data.passaportes} />
              </Section>

              <Section title="Histórico de aprovação">
                <div className="grid grid-cols-2 gap-3">
                  <KpiCard label="Aprovados" value={data.historico.aprovados} tone="ok" />
                  <KpiCard label="Negados" value={data.historico.negados} tone="danger" />
                  <KpiCard
                    label="Taxa de aprovação"
                    value={`${(data.historico.taxaAprovacao * 100).toFixed(1)}%`}
                    tone="info"
                  />
                  <KpiCard
                    label="Processo administrativo"
                    value={data.historico.processoAdministrativo}
                  />
                </div>
              </Section>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
