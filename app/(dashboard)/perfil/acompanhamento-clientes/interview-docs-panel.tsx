"use client";

import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { UploadButton } from "@/lib/uploadthing";
import { trpc } from "@/lib/trpc-client";

export function InterviewDocsPanel({
  clientUserId,
  clientName,
}: {
  clientUserId: string;
  clientName: string;
}) {
  const utils = trpc.useUtils();
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

  return (
    <div className="sm:col-span-2 space-y-3 rounded-lg border border-muted p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Documentos para a entrevista</p>
        <p className="text-xs text-muted-foreground">
          Envie o arquivo que {clientName || "o cliente"} (e dependentes, cada um no
          próprio cadastro) deverá baixar e imprimir. Visível no login do cliente.
        </p>
      </div>

      <UploadButton
        endpoint="interviewDocUploader"
        input={{ clientUserId }}
        onClientUploadComplete={() => {
          toast.success("Documento enviado");
          utils.acompanhamentoRouter.listInterviewDocs.invalidate({ userId: clientUserId });
        }}
        onUploadError={(error) => {
          toast.error(error.message || "Falha no envio do documento");
        }}
      />
      <p className="text-xs text-muted-foreground">PDF ou imagem · até 16 MB</p>

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
