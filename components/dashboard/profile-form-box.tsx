"use client";

import { toast } from "sonner";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

interface Props {
  variant: "visa" | "passport";
  profileId: string | null;
  memberUserId: string;
  statusForm: "awaiting" | "filling" | "filled";
  profileName: string;
  formStep: number;
}

export function ProfileFormBox({
  variant,
  profileId,
  memberUserId,
  statusForm,
  profileName,
  formStep,
}: Props) {
  const router = useRouter();
  const isPassport = variant === "passport";

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

  const statusLabel =
    statusForm === "filling" ? "Incompleto" : statusForm === "filled" ? "Enviado" : "Vazio";

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
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {isPassport ? "Passaporte ou Renovação" : "Visto Americano"}
        </span>
        <h6 className="text-2xl font-semibold text-white">{profileName}</h6>
        <span
          className={cn("w-fit px-2 py-1 text-sm font-semibold uppercase text-center rounded-lg", {
            "bg-destructive text-destructive-foreground": statusForm === "awaiting",
            "bg-caution text-caution-foreground": statusForm === "filling",
            "bg-confirm text-confirm-foreground": statusForm === "filled",
          })}
        >
          Formulário {statusLabel}
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
            {isStarting ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" strokeWidth={1.75} />}
            {actionLabel}
          </span>
          <ArrowRight className="size-5" strokeWidth={1.75} />
        </Button>
        <span className="text-xs text-white/70 text-center sm:text-left">
          Acompanhe o processo no checklist abaixo.
        </span>
      </div>
    </div>
  );
}
