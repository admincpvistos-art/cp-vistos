"use client";

import { useRef, useState } from "react";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc-client";

export function InterviewDocsPanel({
  clientUserId,
  clientName,
}: {
  clientUserId: string;
  clientName: string;
}) {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = trpc.acompanhamentoRouter.listInterviewDocs.useQuery(
    { userId: clientUserId },
    { enabled: Boolean(clientUserId) },
  );

  const { mutate: deleteDoc, isPending: deleting, variables } =
    trpc.acompanhamentoRouter.deleteInterviewDoc.useMutation({
      onSuccess: () => {
        toast.success("Documento removido");
        utils.acompanhamentoRouter.listInterviewDocs.invalidate({ userId: clientUserId });
      },
      onError: (error) => {
        toast.error(error.message || "Não foi possível remover o documento");
      },
    });

  const docs = data?.docs ?? [];

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || !clientUserId) {
      return;
    }

    const files = Array.from(fileList).slice(0, 3);
    setBusy(true);
    try {
      let saved = 0;
      for (const file of files) {
        const body = new FormData();
        body.set("clientUserId", clientUserId);
        body.set("file", file);

        const response = await fetch("/api/interview-doc/upload", {
          method: "POST",
          body,
        });

        const payload = (await response.json().catch(() => null)) as {
          doc?: { id: string };
          error?: string;
        } | null;

        if (!response.ok || !payload?.doc) {
          throw new Error(payload?.error || `Falha ao enviar ${file.name}`);
        }
        saved += 1;
      }

      toast.success(saved > 1 ? `${saved} documentos salvos` : "Documento salvo");
      await utils.acompanhamentoRouter.listInterviewDocs.invalidate({
        userId: clientUserId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o documento",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="sm:col-span-2 space-y-3 rounded-lg border border-muted p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Documentos para a entrevista</p>
        <p className="text-xs text-muted-foreground">
          Envie PDF ou imagem que {clientName || "o cliente"} deverá baixar e imprimir.
          Visível no login do cliente (titular e dependentes, cada um no próprio cadastro).
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*,.pdf"
        multiple
        className="hidden"
        disabled={busy || !clientUserId}
        onChange={(event) => {
          void handleFiles(event.target.files);
        }}
      />

      <Button
        type="button"
        variant="secondary"
        disabled={busy || !clientUserId}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="mr-2 h-4 w-4" />
        )}
        {busy ? "Enviando…" : "Enviar documento (PDF/imagem)"}
      </Button>
      <p className="text-xs text-muted-foreground">Até 16 MB · PDF ou imagem</p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando documentos…
        </div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum documento enviado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between rounded-md border border-muted/70 bg-background px-3 py-2"
            >
              <span className="text-sm font-medium truncate" title={doc.fileName}>
                {doc.fileName}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" download={doc.fileName}>
                    <Download className="mr-1 h-4 w-4" />
                    Baixar
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={deleting && variables?.id === doc.id}
                  onClick={() => deleteDoc({ id: doc.id })}
                >
                  {deleting && variables?.id === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
