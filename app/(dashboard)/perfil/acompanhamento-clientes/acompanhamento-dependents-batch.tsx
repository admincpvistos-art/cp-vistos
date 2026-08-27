"use client";

import { ChangeEvent, useState } from "react";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc-client";

type DependentDraft = {
  key: string;
  name: string;
  cpf: string;
  wantsAmericanVisa: boolean;
  wantsPassport: boolean;
};

function emptyDraft(): DependentDraft {
  return {
    key: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    cpf: "",
    wantsAmericanVisa: true,
    wantsPassport: false,
  };
}

function formatCpf(value: string) {
  let digits = value.replace(/[^\d]/g, "").slice(0, 11);
  digits = digits.replace(/(\d{3})(\d)/, "$1.$2");
  digits = digits.replace(/(\d{3})(\d)/, "$1.$2");
  digits = digits.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return digits;
}

export function AcompanhamentoDependentsBatch({
  group,
  titularName,
  titularUserId,
}: {
  group: string;
  titularName: string;
  titularUserId?: string | null;
}) {
  const utils = trpc.useUtils();
  const [drafts, setDrafts] = useState<DependentDraft[]>([emptyDraft()]);

  const { mutateAsync, isPending } = trpc.userRouter.addDependentsBatch.useMutation();

  const resolvedGroup = group.trim() || titularName.trim();

  function updateDraft(key: string, patch: Partial<DependentDraft>) {
    setDrafts((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function onCpfChange(key: string, event: ChangeEvent<HTMLInputElement>) {
    updateDraft(key, { cpf: formatCpf(event.target.value) });
  }

  async function submitAll() {
    if (!resolvedGroup) {
      toast.error("Informe o GRUPO do titular antes de incluir dependentes");
      return;
    }

    for (const row of drafts) {
      if (!row.name.trim() || row.name.trim().length < 4) {
        toast.error("Preencha o nome completo de cada dependente");
        return;
      }
      if (row.cpf.length !== 14) {
        toast.error(`CPF inválido: ${row.name || "dependente"}`);
        return;
      }
      if (!row.wantsAmericanVisa && !row.wantsPassport) {
        toast.error(`Selecione ao menos um serviço para ${row.name}`);
        return;
      }
    }

    try {
      const result = await mutateAsync({
        group: resolvedGroup,
        titularUserId: titularUserId || undefined,
        dependents: drafts.map((row) => ({
          name: row.name.trim(),
          cpf: row.cpf,
          wantsAmericanVisa: row.wantsAmericanVisa,
          wantsPassport: row.wantsPassport,
        })),
      });

      toast.success(result.message);
      setDrafts([emptyDraft()]);
      utils.acompanhamentoRouter.getClientesSheet.invalidate();
      utils.userRouter.getClientGroups.invalidate();
      utils.serviceCostRouter.getRows.invalidate();
    } catch (error) {
      const message =
        typeof error === "object" &&
        error &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : "Não foi possível incluir dependentes";
      toast.error(message);
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-start gap-2">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold">Dependentes deste titular</p>
          <p className="text-xs text-muted-foreground">
            Inclua família/amigos de uma vez. Eles passam a aparecer na área do cliente do
            grupo <span className="font-medium">{resolvedGroup || "—"}</span>.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {drafts.map((row, index) => (
          <div
            key={row.key}
            className="grid gap-2 rounded border border-border/80 bg-background p-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2 flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Dependente {index + 1}</Label>
              {drafts.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive"
                  disabled={isPending}
                  onClick={() => setDrafts((current) => current.filter((item) => item.key !== row.key))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input
                value={row.name}
                disabled={isPending}
                onChange={(event) => updateDraft(row.key, { name: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input
                value={row.cpf}
                maxLength={14}
                placeholder="000.000.000-00"
                disabled={isPending}
                onChange={(event) => onCpfChange(row.key, event)}
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={row.wantsAmericanVisa}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    updateDraft(row.key, { wantsAmericanVisa: checked === true })
                  }
                />
                Visto americano
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={row.wantsPassport}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    updateDraft(row.key, { wantsPassport: checked === true })
                  }
                />
                Passaporte
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setDrafts((current) => [...current, emptyDraft()])}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Outro dependente
        </Button>
        <Button type="button" size="sm" disabled={isPending} onClick={() => void submitAll()}>
          {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Incluir todos
        </Button>
      </div>
    </div>
  );
}
