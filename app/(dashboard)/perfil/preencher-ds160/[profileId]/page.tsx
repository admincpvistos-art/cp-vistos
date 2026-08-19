"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CeacBusy, CeacFormPanel } from "@/components/ds160/ceac-form-panel";
import { CeacOfficialPane } from "@/components/ds160/ceac-official-pane";
import { CEAC_URL, type CeacPageId } from "@/lib/ds160-ceac";
import { trpc } from "@/lib/trpc-client";

export default function PreencherDs160Page({
  params,
}: {
  params: { profileId: string };
}) {
  const profileId = params.profileId;
  const [pageId, setPageId] = useState<CeacPageId>("personal1");

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

      <div className="grid min-h-0 flex-1 grid-cols-1 min-[1600px]:grid-cols-2">
        <div className="min-h-0 border-r border-black/20">
          <CeacFormPanel
            packet={data}
            pageId={pageId}
            onPageChange={setPageId}
            reviewedPages={data.profile.ds160ReviewedPages}
            compact
          />
        </div>

        <div className="hidden min-h-0 min-[1600px]:block">
          <CeacOfficialPane />
        </div>
      </div>
    </div>
  );
}
