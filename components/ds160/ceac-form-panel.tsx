"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CEAC_PAGES,
  buildCeacPages,
  type CeacPageId,
  type Ds160Packet,
} from "@/lib/ds160-ceac";
import { focusCeacWindow } from "@/lib/ds160-ceac-window";

interface Props {
  packet: Ds160Packet;
  pageId: CeacPageId;
  onPageChange: (pageId: CeacPageId) => void;
  reviewedPages?: string[];
  compact?: boolean;
}

export function CeacFormPanel({
  packet,
  pageId,
  onPageChange,
  reviewedPages = [],
  compact = false,
}: Props) {
  const pages = useMemo(() => buildCeacPages(packet), [packet]);
  const fields = pages[pageId] ?? [];
  const [activeId, setActiveId] = useState(fields[0]?.id ?? "");
  const [copiedId, setCopiedId] = useState("");

  async function copyValue(id: string, value: string) {
    if (!value) {
      toast.error("Campo vazio");
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setActiveId(id);
    const index = fields.findIndex((field) => field.id === id);
    const next = fields[index + 1];
    if (next) {
      setActiveId(next.id);
    }
    focusCeacWindow();
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f4f1ea] text-[#1b2a4a]">
      <div className="border-b border-[#c5c1b7] bg-[#0b3a6e] px-4 py-3 text-white">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
          Online Nonimmigrant Visa Application (DS-160)
        </p>
        <h2 className="text-lg font-semibold">
          {CEAC_PAGES.find((page) => page.id === pageId)?.title}
        </h2>
        <p className="text-xs text-white/80">
          {packet.user.name} · {packet.profile.name}
        </p>
      </div>

      <div
        className={cn(
          "flex gap-1 overflow-x-auto border-b border-[#c5c1b7] bg-[#e8e4d9] px-2 py-2",
          compact && "flex-wrap",
        )}
      >
        {CEAC_PAGES.map((page) => {
          const reviewed = reviewedPages.includes(page.id);
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onPageChange(page.id)}
              className={cn(
                "whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium",
                page.id === pageId
                  ? "bg-[#0b3a6e] text-white"
                  : "bg-white text-[#1b2a4a] hover:bg-white/80",
              )}
            >
              {reviewed ? "✓ " : ""}
              {page.title}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="overflow-hidden rounded border border-[#b7c3d4] bg-white">
          {fields.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_auto] items-center gap-3 border-b border-[#e4e7ee] px-3 py-2 last:border-b-0",
                activeId === item.id && "bg-[#e8f1fb]",
                index % 2 === 1 && activeId !== item.id && "bg-[#f7f8fb]",
              )}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0b3a6e]">
                  {item.label}
                </p>
                {item.hint ? (
                  <p className="text-[10px] text-[#6b7280]">{item.hint}</p>
                ) : null}
              </div>
              <p className="break-words text-sm font-medium text-[#111827]">
                {item.value || "—"}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                disabled={!item.value}
                onClick={() => copyValue(item.id, item.value)}
              >
                {copiedId === item.id ? (
                  <Check className="mr-1 size-3.5" />
                ) : (
                  <Copy className="mr-1 size-3.5" />
                )}
                Copiar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CeacBusy() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-[#0b3a6e]">
      <Loader2 className="size-5 animate-spin" />
      Carregando formulário…
    </div>
  );
}
