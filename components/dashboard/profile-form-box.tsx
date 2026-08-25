"use client";

import { toast } from "sonner";
import { ArrowRight, Download, FileText, Loader2 } from "lucide-react";
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
  isTitular: boolean;
  formStep: number;
  mode?: "fill" | "add";
  interviewDocs?: {
    id: string;
    fileName: string;
    fileUrl: string;
  }[];
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
  interviewDocs = [],
}: Props) {
  const router = useRouter();
  const isPassport = variant === "passport";
  const isAdd = mode === "add";
  const utils = trpc.useUtils();

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
      utils.clientRouter.getAreaData.invalidate();
      router.push(
        isPassport
          ? `/formulario-passaporte/${createdProfileId}`
          : `/formulario/${createdProfileId}?formStep=0`,
      );
    },
    onError(error) {
      toast.error(error.message || "Não foi possível abrir o formulário do dependente");
    },
  });

  function openForm() {
    if (isAdd) {
      addDependent({
        category: isPassport ? "passport" : "american_visa",
      });
      return;
    }

    if (!profileId) {
      startMemberForm({
        userId: memberUserId,
        category: isPassport ? "passport" : "american_visa",
      });
      return;
    }

    router.push(formLink);
  }

  const busy = isStarting || isAdding;
  const showTitular = !isAdd && isTitular;
  const title = isAdd ? "Adicionar dependente" : profileName;
  const description = isPassport
    ? showTitular
      ? "Preencha o mesmo formulário com os dados do cadastro de login. Depois do salvamento, este card passa a ser para família ou amigos."
      : "Abre o mesmo formulário em branco para o dependente. Nome e sobrenome entram no checklist ao salvar."
    : showTitular
      ? "Preencha o mesmo formulário com os dados do cadastro de login. Depois do salvamento, este card passa a ser para família ou amigos."
      : "Abre o mesmo formulário em branco para o dependente. Nome e sobrenome entram no checklist ao salvar.";

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
        <h6 className="text-2xl font-semibold text-white">{title}</h6>
        <span className="w-fit px-2 py-1 text-sm font-semibold uppercase text-center rounded-lg bg-white/15 text-white">
          {showTitular ? "Titular" : "Família ou amigos"}
        </span>
        <p className="text-sm text-white/80 leading-relaxed max-w-md">{description}</p>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {!isAdd && interviewDocs.length
          ? interviewDocs.map((doc) => (
              <Button
                key={doc.id}
                variant="secondary"
                size="xl"
                className="w-full h-12 rounded-2xl text-sm font-semibold justify-between px-6 bg-white/15 text-white hover:bg-white/25 border-0"
                asChild
              >
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" download={doc.fileName}>
                  <span className="flex items-center gap-2 truncate">
                    <Download className="size-5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">Baixar documento para entrevista</span>
                  </span>
                  <ArrowRight className="size-5 shrink-0" strokeWidth={1.75} />
                </a>
              </Button>
            ))
          : null}
        <Button
          variant="secondary"
          size="xl"
          className="w-full h-14 rounded-2xl text-base font-semibold justify-between px-6"
          disabled={busy}
          onClick={openForm}
        >
          <span className="flex items-center gap-2">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" strokeWidth={1.75} />}
            Preencher formulário
          </span>
          <ArrowRight className="size-5" strokeWidth={1.75} />
        </Button>
        <span className="text-xs text-white/70 text-center sm:text-left">
          A edição de quem já salvou fica no checklist abaixo.
        </span>
      </div>
    </div>
  );
}
