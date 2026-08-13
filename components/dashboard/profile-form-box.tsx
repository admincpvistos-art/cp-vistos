"use client";

import { toast } from "sonner";
import { StatusDS } from "@prisma/client";
import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

interface Props {
  variant: "visa" | "passport";
  profileId: string | null;
  memberUserId: string;
  statusForm: "awaiting" | "filling" | "filled";
  statusDS: StatusDS | null;
  profileName: string;
  CASVDate: Date | null;
  interviewDate: Date | null;
  DSNumber: string | null;
  protocol?: string | null;
  expireDate?: Date | null;
  passportType?: string | null;
  updatedAt: Date | null;
  formStep: number;
}

export function ProfileFormBox({
  variant,
  profileId,
  memberUserId,
  statusForm,
  statusDS,
  profileName,
  CASVDate,
  interviewDate,
  DSNumber,
  protocol,
  expireDate,
  passportType,
  updatedAt,
  formStep,
}: Props) {
  const [statusDSFormatted, setStatusDSFormatted] = useState<string>("");
  const [statusFormFormatted, setStatusFormFormatted] = useState<string>("");
  const router = useRouter();

  const formLink = profileId
    ? variant === "passport"
      ? `/formulario-passaporte/${profileId}`
      : formStep > 10
        ? `/resumo-formulario/${profileId}`
        : `/formulario/${profileId}?formStep=${formStep}`
    : "";

  const { mutate: startMemberForm, isPending: isStarting } = trpc.clientRouter.startMemberForm.useMutation({
    onSuccess({ profileId: createdProfileId }) {
      router.push(
        variant === "passport"
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
        category: variant === "passport" ? "passport" : "american_visa",
      });
      return;
    }

    router.push(formLink);
  }

  useEffect(() => {
    switch (statusDS) {
      case "awaiting":
        setStatusDSFormatted("Aguardando");
        break;
      case "filling":
        setStatusDSFormatted("Preenchendo");
        break;
      case "filled":
        setStatusDSFormatted("Preenchido");
        break;
      case "emitted":
        setStatusDSFormatted("Emitido");
        break;
      default:
        setStatusDSFormatted("Status Offline");
        break;
    }
  }, [statusDS]);

  useEffect(() => {
    switch (statusForm) {
      case "awaiting":
        setStatusFormFormatted("Vazio");
        break;
      case "filling":
        setStatusFormFormatted("Incompleto");
        break;
      case "filled":
        setStatusFormFormatted("Completo");
        break;
      default:
        setStatusFormFormatted("Sem Status");
        break;
    }
  }, [statusForm]);

  const passportTypeLabel =
    passportType === "renovacao" ? "Renovação" : passportType === "primeiro" ? "Primeiro passaporte" : "—";
  const isPassport = variant === "passport";

  return (
    <div
      className={cn(
        "w-full rounded-2xl p-8 flex flex-col gap-6",
        isPassport ? "bg-primary" : "bg-foreground",
      )}
    >
      <div className="w-full flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1 items-center sm:items-start">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            {isPassport ? "Passaporte ou Renovação" : "Visto Americano"}
          </span>
          <h6 className="text-2xl font-semibold text-white">{profileName}</h6>

          <span
            className={cn("w-fit px-2 py-1 text-base font-semibold uppercase text-center rounded-lg", {
              "bg-destructive text-destructive-foreground": statusForm === "awaiting",
              "bg-caution text-caution-foreground": statusForm === "filling",
              "bg-confirm text-confirm-foreground": statusForm === "filled",
            })}
          >
            Formulário {statusFormFormatted}
          </span>
        </div>

        <Button
          variant="secondary"
          size="xl"
          className="flex items-center gap-2"
          disabled={isStarting}
          onClick={openForm}
        >
          Formulário
          <ArrowUpRight />
        </Button>
      </div>

      <div className="w-full flex flex-col gap-4">
        <div
          className={cn(
            "w-full flex flex-col gap-4 items-center p-9 rounded-lg sm:flex-row sm:justify-around",
            isPassport ? "bg-[#8FB4E0]" : "bg-[#6A7DA6]",
          )}
        >
          {isPassport ? (
            <>
              <div className="w-fit flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-white/80">Tipo</span>
                <span className="text-lg font-semibold text-white">{passportTypeLabel}</span>
              </div>
              <div className="w-fit flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-white/80">Protocolo</span>
                <span className="text-lg font-semibold text-white">{protocol || "---"}</span>
              </div>
              <div className="w-fit flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-white/80">Validade</span>
                <span className="text-lg font-semibold text-white">
                  {expireDate ? format(new Date(expireDate), "dd/MM/yyyy") : "--/--/----"}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-fit flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-white/75">Data do CASV</span>
                <span className="text-lg font-semibold text-white">
                  {CASVDate ? format(new Date(CASVDate), "dd/MM/yyyy") : "--/--/----"}
                </span>
              </div>
              <div className="w-fit flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-white/75">Data da Entrevista</span>
                <span className="text-lg font-semibold text-white">
                  {interviewDate ? format(new Date(interviewDate), "dd/MM/yyyy") : "--/--/----"}
                </span>
              </div>
              <div className="w-fit flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-white/75">Número DS</span>
                <span className="text-lg font-semibold text-white">{DSNumber ? DSNumber : "---"}</span>
              </div>
            </>
          )}
        </div>

        <div className="w-full flex flex-col gap-2 items-center sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 h-5">
            <span className="text-secondary text-base font-medium">
              {isPassport ? "Status" : "Status DS"}
            </span>
            <div className="h-full w-[1.5px] rounded-full bg-secondary" />
            <strong className="text-secondary text-base font-semibold">
              {isPassport ? (statusForm === "filled" ? "Enviado" : "Aguardando") : statusDSFormatted}
            </strong>
          </div>

          <span className="text-secondary text-sm font-medium">
            Última Atualização: {updatedAt ? format(new Date(updatedAt), "dd/MM/yyyy") : "--/--/----"}
          </span>
        </div>
      </div>
    </div>
  );
}
