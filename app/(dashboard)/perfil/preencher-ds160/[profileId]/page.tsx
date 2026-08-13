"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CeacBusy, CeacFormPanel } from "@/components/ds160/ceac-form-panel";
import { CEAC_URL, type CeacPageId } from "@/lib/ds160-ceac";
import { trpc } from "@/lib/trpc-client";

export default function PreencherDs160Page({
  params,
}: {
  params: { profileId: string };
}) {
  const profileId = params.profileId;
  const [pageId, setPageId] = useState<CeacPageId>("personal1");
  const [showHint, setShowHint] = useState(true);

  const { data, isPending } = trpc.ds160Router.getPacket.useQuery({ profileId });
  const startFill = trpc.ds160Router.startFill.useMutation();

  useEffect(() => {
    startFill.mutate({ profileId });
    // start once when opening the workspace
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  if (isPending || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <CeacBusy />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b3a6e]">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 px-3 text-white">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/perfil/preencher-ds160">
            <ArrowLeft className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <p className="truncate text-sm font-medium">
          Preencher DS-160 · {data.profile.name}
        </p>
        <a
          href={CEAC_URL}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-white/80 underline"
        >
          Abrir CEAC em nova aba
        </a>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 border-r border-black/20">
          <CeacFormPanel
            packet={data}
            pageId={pageId}
            onPageChange={setPageId}
            reviewedPages={data.profile.ds160ReviewedPages}
            compact
          />
        </div>

        <div className="relative flex min-h-0 flex-col bg-white">
          {showHint ? (
            <div className="flex items-start justify-between gap-3 border-b bg-[#fff7e6] px-3 py-2 text-xs text-[#1b2a4a]">
              <p>
                Se o quadro abaixo ficar em branco, carregue a extensão{" "}
                <strong>extensions/ceac-frame</strong> em chrome://extensions (Modo do
                desenvolvedor → Carregar sem compactação).
              </p>
              <button type="button" className="shrink-0 underline" onClick={() => setShowHint(false)}>
                Fechar
              </button>
            </div>
          ) : null}
          <iframe
            id="ceac-frame"
            title="CEAC DS-160"
            src={CEAC_URL}
            className="min-h-0 w-full flex-1 border-0"
          />
        </div>
      </div>
    </div>
  );
}
