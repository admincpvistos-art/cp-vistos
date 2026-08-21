"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CeacBusy, CeacFormPanel } from "@/components/ds160/ceac-form-panel";
import { CeacOfficialPane } from "@/components/ds160/ceac-official-pane";
import { type CeacPageId } from "@/lib/ds160-ceac";
import { closeCeacWindow, openCeacInBrowserWindow } from "@/lib/ds160-ceac-window";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";

/** Janela maximizada / larga: formulário + quadro CEAC. Win+seta / estreita: só formulário. */
function useShowCeacSidePane() {
  const [showPane, setShowPane] = useState(true);

  useEffect(() => {
    function update() {
      const avail = window.screen.availWidth || window.screen.width || 1920;
      const nearlyMaximized = window.outerWidth >= avail * 0.85;
      const wideEnough = window.innerWidth >= 1100;
      setShowPane(nearlyMaximized && wideEnough);
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return showPane;
}

export default function PreencherDs160Page({
  params,
}: {
  params: { profileId: string };
}) {
  const profileId = params.profileId;
  const [pageId, setPageId] = useState<CeacPageId>("personal1");
  const showCeacPane = useShowCeacSidePane();

  const { data, isPending } = trpc.ds160Router.getPacket.useQuery({ profileId });
  const startFill = trpc.ds160Router.startFill.useMutation();

  useEffect(() => {
    startFill.mutate({ profileId });
    // start once when opening the workspace
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => {
    if (!showCeacPane) {
      closeCeacWindow();
    }
  }, [showCeacPane]);

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
        <button
          type="button"
          onClick={() => openCeacInBrowserWindow()}
          className="text-xs text-white/80 underline hover:text-white"
        >
          Abrir CEAC em nova janela
        </button>
      </div>

      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1",
          showCeacPane && "lg:grid-cols-2",
        )}
      >
        <div className={cn("min-h-0", showCeacPane && "border-r border-black/20")}>
          <CeacFormPanel
            packet={data}
            pageId={pageId}
            onPageChange={setPageId}
            reviewedPages={data.profile.ds160ReviewedPages}
            compact
          />
        </div>

        {showCeacPane ? (
          <div className="hidden min-h-0 lg:block">
            <CeacOfficialPane />
          </div>
        ) : null}
      </div>
    </div>
  );
}
