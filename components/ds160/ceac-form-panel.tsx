"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CEAC_PAGES,
  buildCeacPages,
  type CeacPageId,
  type Ds160Packet,
} from "@/lib/ds160-ceac";
import {
  CEAC_EXTENSION_EXPECTED_VERSION,
  focusCeacWindow,
  getCeacExtensionVersion,
  isCeacExtensionPresent,
  pauseCeacPinForTransfer,
  transferFieldsToCeac,
} from "@/lib/ds160-ceac-window";

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
  const [transferring, setTransferring] = useState(false);
  const [extensionReady, setExtensionReady] = useState(false);
  const [extVersion, setExtVersion] = useState<string | null>(null);

  useEffect(() => {
    function syncReady() {
      const version = getCeacExtensionVersion();
      const present = Boolean(version) || isCeacExtensionPresent();
      setExtensionReady(present);
      setExtVersion(version);
    }

    function onMessage(event: MessageEvent) {
      if (event.source !== window) {
        return;
      }
      if (event.data?.type === "CP_VISTOS_CEAC_EXT" && event.data.ready) {
        setExtensionReady(true);
        if (typeof event.data.version === "string") {
          setExtVersion(event.data.version);
        }
      }
    }

    window.addEventListener("message", onMessage);
    syncReady();
    window.postMessage({ type: "CP_VISTOS_CEAC_EXT_PING" }, "*");
    const timer = window.setInterval(() => {
      syncReady();
      window.postMessage({ type: "CP_VISTOS_CEAC_EXT_PING" }, "*");
    }, 2000);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(timer);
    };
  }, []);

  function copyToClipboardSync(text: string) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  async function copyToClipboard(text: string) {
    // Preferir caminho síncrono no gesto do clique — mais confiável com a
    // janela do CEAC disputando o foco.
    if (copyToClipboardSync(text)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async function copyValue(id: string, value: string) {
    const text = String(value ?? "").trim();
    if (!text || text === "—") {
      toast.error("Campo vazio");
      return;
    }

    pauseCeacPinForTransfer(2500);

    const ok = await copyToClipboard(text);
    if (!ok) {
      toast.error("Não foi possível copiar. Tente de novo.");
      return;
    }

    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1500);
    const index = fields.findIndex((field) => field.id === id);
    const next = fields[index + 1];
    setActiveId(next?.id ?? id);
    toast.success("Copiado — cole no CEAC (Ctrl+V)");

    // Foco no CEAC só depois, sem cancelar a pausa cedo demais (próximo Copiar
    // ainda precisa do quiet period se o usuário voltar rápido).
    window.setTimeout(() => {
      focusCeacWindow();
    }, 120);
  }

  async function transferPage() {
    const payload = fields
      .filter((field) => field.value && field.value !== "—")
      .map((field) => ({
        id: field.id,
        label: field.label,
        value: field.transferValue ?? field.value,
      }));

    if (!payload.length) {
      toast.error("Nenhum valor para transferir nesta página");
      return;
    }

    if (!extensionReady && !isCeacExtensionPresent()) {
      toast.error(
        `Extensão CP Vistos não detectada. Atualize para v${CEAC_EXTENSION_EXPECTED_VERSION}, recarregue a extensão e dê Ctrl+F5.`,
      );
      return;
    }

    setTransferring(true);
    try {
      const pageTitle = CEAC_PAGES.find((page) => page.id === pageId)?.title ?? pageId;
      const result = await transferFieldsToCeac({
        fields: payload,
        pageId,
        pageTitle,
      });

      // Foco uma vez após o resultado (sucesso ou falha útil).
      focusCeacWindow();

      if (!result.ok) {
        toast.error(result.error || "Não foi possível transferir para o CEAC");
        return;
      }

      toast.success(
        `${result.filled} campo(s) preenchido(s) no CEAC` +
          (result.skipped ? ` · ${result.skipped} sem correspondência` : ""),
      );
    } finally {
      setTransferring(false);
    }
  }

  const canTransfer = extensionReady || isCeacExtensionPresent();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f4f1ea] text-[#1b2a4a]">
      <div className="border-b border-[#c5c1b7] bg-[#0b3a6e] px-4 py-3 text-white">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
          Online Nonimmigrant Visa Application (DS-160)
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">
              {CEAC_PAGES.find((page) => page.id === pageId)?.title}
            </h2>
            <p className="text-xs text-white/80">
              {packet.user.name} · {packet.profile.name}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 shrink-0 bg-white text-[#0b3a6e] hover:bg-white/90"
            disabled={transferring || !fields.length || !canTransfer}
            title={
              canTransfer
                ? undefined
                : `Instale a extensão v${CEAC_EXTENSION_EXPECTED_VERSION} e dê Ctrl+F5`
            }
            onClick={() => void transferPage()}
          >
            {transferring ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 size-3.5" />
            )}
            Transferir para o CEAC
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-white/75">
          Você avança as páginas e resolve o captcha. O botão só preenche os campos desta
          página no site oficial
          {extVersion
            ? ` (extensão v${extVersion}).`
            : ` (requer extensão CP Vistos v${CEAC_EXTENSION_EXPECTED_VERSION}).`}
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
                data-cp-vistos-skip-ceac-raise=""
                disabled={!item.value || item.value === "—"}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void copyValue(item.id, item.value);
                }}
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
