"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CeacBusy, CeacFormPanel } from "@/components/ds160/ceac-form-panel";
import { CEAC_PAGES, type CeacPageId } from "@/lib/ds160-ceac";
import { trpc } from "@/lib/trpc-client";

export default function ConferirFormularioPage({
  params,
}: {
  params: { profileId: string };
}) {
  const profileId = params.profileId;
  const router = useRouter();
  const [pageId, setPageId] = useState<CeacPageId>("personal1");
  const [returnOpen, setReturnOpen] = useState(false);
  const [note, setNote] = useState("");
  const utils = trpc.useUtils();

  const { data, isPending } = trpc.ds160Router.getPacket.useQuery({ profileId });

  const { mutate: returnToClient, isPending: isReturning } =
    trpc.ds160Router.returnToClient.useMutation({
      onSuccess(result) {
        toast.success(result.message);
        setReturnOpen(false);
        setNote("");
        utils.ds160Router.getPacket.invalidate({ profileId });
        utils.ds160Router.list.invalidate();
      },
      onError(error) {
        toast.error(error.message);
      },
    });

  const { mutate: markReviewed, isPending: isReviewing } =
    trpc.ds160Router.markPageReviewed.useMutation({
      onSuccess(result) {
        toast.success(result.message);
        utils.ds160Router.getPacket.invalidate({ profileId });
        const index = CEAC_PAGES.findIndex((page) => page.id === pageId);
        const next = CEAC_PAGES[index + 1];
        if (next) {
          setPageId(next.id);
        }
      },
      onError(error) {
        toast.error(error.message);
      },
    });

  const { mutate: startFill, isPending: isStarting } = trpc.ds160Router.startFill.useMutation({
    onSuccess() {
      router.push(`/perfil/preencher-ds160/${profileId}`);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const { mutate: openAdminEdit, isPending: isOpeningEdit } =
    trpc.ds160Router.openAdminEdit.useMutation({
      onSuccess() {
        router.push(`/formulario/${profileId}?formStep=0`);
      },
      onError(error) {
        toast.error(error.message);
      },
    });

  if (isPending || !data) {
    return (
      <div className="h-[calc(100vh-9rem)] px-4">
        <CeacBusy />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col px-4 pb-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/perfil/conferir-formularios">
            <ArrowLeft className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          {data.profile.formReturnNote
            ? `Devolução anterior: ${data.profile.formReturnNote}`
            : "Conferência página a página"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
        <CeacFormPanel
          packet={data}
          pageId={pageId}
          onPageChange={setPageId}
          reviewedPages={data.profile.ds160ReviewedPages}
        />
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setReturnOpen(true)}>
          Devolver ao cliente
        </Button>
        <Button
          variant="secondary"
          disabled={isReviewing}
          onClick={() => markReviewed({ profileId, pageId })}
        >
          Conferido
        </Button>
        <Button
          variant="outline"
          disabled={isOpeningEdit}
          onClick={() => openAdminEdit({ profileId })}
        >
          Editar formulário
        </Button>
        <Button disabled={isStarting} onClick={() => startFill({ profileId })}>
          Preencher DS-160
        </Button>
      </div>

      <AlertDialog open={returnOpen} onOpenChange={setReturnOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Devolver esta página ao cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              O formulário será desbloqueado para o cliente complementar. Informe o que falta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ex.: completar endereço nos EUA e nome da mãe"
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReturning}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isReturning || note.trim().length < 3}
              onClick={(event) => {
                event.preventDefault();
                returnToClient({ profileId, note: note.trim(), pageId });
              }}
            >
              Devolver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
