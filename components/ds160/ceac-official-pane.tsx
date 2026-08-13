"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CEAC_URL } from "@/lib/ds160-ceac";
import { openCeacOverElement } from "@/lib/ds160-ceac-window";

export function CeacOfficialPane() {
  const paneRef = useRef<HTMLDivElement>(null);
  const [extensionReady, setExtensionReady] = useState(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window) {
        return;
      }
      if (event.data?.type === "CP_VISTOS_CEAC_EXT" && event.data.ready) {
        setExtensionReady(true);
      }
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: "CP_VISTOS_CEAC_EXT_PING" }, "*");

    return () => window.removeEventListener("message", onMessage);
  }, []);

  function openOverPane() {
    if (!paneRef.current) {
      return;
    }

    openCeacOverElement(paneRef.current, { useExtension: extensionReady });
  }

  function openPanel() {
    window.postMessage({ type: "CP_VISTOS_OPEN_CEAC_PANEL" }, "*");
  }

  return (
    <div
      ref={paneRef}
      className="flex h-full min-h-0 flex-col items-center justify-center gap-5 bg-[#f4f1ea] px-8 text-center text-[#1b2a4a]"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b3a6e]">
          Online Nonimmigrant Visa Application
        </p>
        <h2 className="mt-2 text-xl font-semibold">CEAC oficial</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#314060]">
          O site do governo bloqueia iframe, então ele não pode viver <em>dentro</em> deste
          quadro. A janela oficial abre exatamente em cima deste quadrado e, ao clicar em
          Copiar, volta para a frente para você colar.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button className="h-11" onClick={openOverPane}>
          Abrir CEAC neste quadro
        </Button>
        {extensionReady ? (
          <Button variant="outline" className="h-11" onClick={openPanel}>
            Abrir CEAC no painel do Chrome
          </Button>
        ) : null}
        <Button variant="outline" className="h-11" asChild>
          <a href={CEAC_URL} target="_blank" rel="noreferrer">
            Abrir CEAC em nova aba
          </a>
        </Button>
      </div>

      <p className="max-w-md text-xs text-[#6b7280]">
        O painel do Chrome (extensão v1.2) fica na mesma janela e não some ao copiar. Sem a
        extensão, use <strong>Abrir CEAC neste quadro</strong>: depois de Copiar, o CEAC volta
        sozinho para colar com Ctrl+V.
      </p>
    </div>
  );
}
