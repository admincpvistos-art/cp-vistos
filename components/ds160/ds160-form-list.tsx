"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { reviewStatusLabel } from "@/lib/ds160-ceac";
import { trpc } from "@/lib/trpc-client";

interface Props {
  mode: "review" | "fill";
}

export function Ds160FormList({ mode }: Props) {
  const { data, isPending } = trpc.ds160Router.list.useQuery({ mode });

  if (isPending) {
    return <p className="py-10 text-sm text-muted-foreground">Carregando formulários…</p>;
  }

  if (!data?.length) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        {mode === "fill"
          ? "Nenhum formulário enviado para preencher no CEAC ainda."
          : "Nenhum formulário enviado para conferência ainda."}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-left">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Grupo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Conferência</th>
            <th className="px-4 py-3">Atualizado</th>
            <th className="px-4 py-3 text-right">Ação</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.profileId} className="border-t">
              <td className="px-4 py-3">
                <p className="font-semibold">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </td>
              <td className="px-4 py-3 text-sm">{row.group || "—"}</td>
              <td className="px-4 py-3 text-sm">
                {reviewStatusLabel(row.ds160ReviewStatus, row.statusForm)}
              </td>
              <td className="px-4 py-3 text-sm">
                {row.reviewedCount}/{row.totalPages}
              </td>
              <td className="px-4 py-3 text-sm">
                {row.updatedAt
                  ? format(new Date(row.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" asChild>
                  <Link
                    href={
                      mode === "fill"
                        ? `/perfil/preencher-ds160/${row.profileId}`
                        : `/perfil/conferir-formularios/${row.profileId}`
                    }
                  >
                    {mode === "fill" ? "Preencher" : "Conferir"}
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
