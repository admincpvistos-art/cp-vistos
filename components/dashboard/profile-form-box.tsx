"use client";

import { toast } from "sonner";
import { ArrowRight, FileText, Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

interface Props {
  variant: "visa" | "passport";
  profileId: string | null;
  memberUserId: string;
  statusForm: "awaiting" | "filling" | "filled";
  profileName: string;
  isTitular: boolean;
  formStep: number;
  mode?: "fill" | "add";
}

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function ProfileFormBox({
  variant,
  profileId,
  memberUserId,
  statusForm,
  profileName,
  isTitular,
  formStep,
  mode = "fill",
}: Props) {
  const router = useRouter();
  const isPassport = variant === "passport";
  const utils = trpc.useUtils();
  const [dependentName, setDependentName] = useState("");
  const [dependentCpf, setDependentCpf] = useState("");

  const formLink = profileId
    ? isPassport
      ? `/formulario-passaporte/${profileId}`
      : formStep > 10
        ? `/resumo-formulario/${profileId}`
        : `/formulario/${profileId}?formStep=${formStep}`
    : "";

  const { mutate: startMemberForm, isPending: isStarting } = trpc.clientRouter.startMemberForm.useMutation({
    onSuccess({ profileId: createdProfileId }) {
      router.push(
        isPassport
          ? `/formulario-passaporte/${createdProfileId}`
          : `/formulario/${createdProfileId}?formStep=0`,
      );
    },
    onError(error) {
      toast.error(error.message || "Não foi possível abrir o formulário");
    },
  });

  const { mutate: addDependent, isPending: isAdding } = trpc.clientRouter.addDependent.useMutation({
    onSuccess({ profileId: createdProfileId }) {
      toast.success("Dependente adicionado");
      utils.clientRouter.getAreaData.invalidate();
      router.push(
        isPassport
          ? `/formulario-passaporte/${createdProfileId}`
          : `/formulario/${createdProfileId}?formStep=0`,
      );
    },
    onError(error) {
      toast.error(error.message || "Não foi possível adicionar o dependente");
    },
  });

  function openForm() {
    if (!profileId) {
      startMemberForm({
        userId: memberUserId,
        category: isPassport ? "passport" : "american_visa",
      });
      return;
    }

    router.push(formLink);
  }

  function submitDependent() {
    addDependent({
      name: dependentName.trim(),
      cpf: dependentCpf,
      category: isPassport ? "passport" : "american_visa",
    });
  }

  const actionLabel =
    statusForm === "filling"
      ? "Continuar preenchimento"
      : statusForm === "filled"
        ? "Ver resumo"
        : "Preencher formulário";

  const description = isPassport
    ? "Dados para primeiro passaporte ou renovação. Datas, protocolo e andamento ficam no checklist depois do envio."
    : "Dados do visto americano. CASV, entrevista, número DS e status ficam no checklist depois que você e a equipe atualizarem.";

  return (
    <div
      className={cn(
        "w-full rounded-2xl p-8 flex flex-col gap-8 min-h-[280px]",
        isPassport ? "bg-primary" : "bg-foreground",
      )}
    >
      {mode === "add" ? (
        <>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
              {isPassport ? "Passaporte ou Renovação" : "Visto Americano"}
            </span>
            <h6 className="text-2xl font-semibold text-white">Adicionar dependente</h6>
            <span className="w-fit px-2 py-1 text-sm font-semibold uppercase text-center rounded-lg bg-white/15 text-white">
              Família ou amigos
            </span>
            <p className="text-sm text-white/80 leading-relaxed max-w-md">
              Inclua quem adquiriu o serviço com você. Depois do salvamento, a linha entra no checklist e a edição
              continua por lá.
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <Input
              value={dependentName}
              onChange={(event) => setDependentName(event.target.value)}
              placeholder="Nome completo"
              className="h-12 bg-white text-foreground"
            />
            <Input
              value={dependentCpf}
              onChange={(event) => setDependentCpf(maskCpf(event.target.value))}
              placeholder="CPF"
              className="h-12 bg-white text-foreground"
            />
            <Button
              variant="secondary"
              size="xl"
              className="w-full h-14 rounded-2xl text-base font-semibold justify-between px-6"
              disabled={isAdding}
              onClick={submitDependent}
            >
              <span className="flex items-center gap-2">
                {isAdding ? <Loader2 className="size-5 animate-spin" /> : <UserPlus className="size-5" strokeWidth={1.75} />}
                Adicionar e preencher
              </span>
              <ArrowRight className="size-5" strokeWidth={1.75} />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
              {isPassport ? "Passaporte ou Renovação" : "Visto Americano"}
            </span>
            <h6 className="text-2xl font-semibold text-white">{profileName}</h6>
            <span className="w-fit px-2 py-1 text-sm font-semibold uppercase text-center rounded-lg bg-white/15 text-white">
              {isTitular ? "Titular" : "Dependente"}
            </span>
            <p className="text-sm text-white/80 leading-relaxed max-w-md">{description}</p>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <Button
              variant="secondary"
              size="xl"
              className="w-full h-14 rounded-2xl text-base font-semibold justify-between px-6"
              disabled={isStarting}
              onClick={openForm}
            >
              <span className="flex items-center gap-2">
                {isStarting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <FileText className="size-5" strokeWidth={1.75} />
                )}
                {actionLabel}
              </span>
              <ArrowRight className="size-5" strokeWidth={1.75} />
            </Button>
            <span className="text-xs text-white/70 text-center sm:text-left">
              Acompanhe o processo no checklist abaixo.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
