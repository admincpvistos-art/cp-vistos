"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CEAC_URL } from "@/lib/ds160-ceac";
import { getCeacExtensionVersion, isCeacExtensionPresent, openCeacOverElement } from "@/lib/ds160-ceac-window";

export function CeacOfficialPane() {
  const paneRef = useRef<HTMLDivElement>(null);
  const [extensionReady, setExtensionReady] = useState(false);
  const [extVersion, setExtVersion] = useState<string | null>(null);

  useEffect(() => {
    function syncReady() {
      const version = getCeacExtensionVersion();
      if (version || isCeacExtensionPresent()) {
        setExtensionReady(true);
        setExtVersion(version);
      }
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

  function openOverPane() {
    if (!paneRef.current) {
      return;
    }

    openCeacOverElement(paneRef.current, {
      useExtension: extensionReady || isCeacExtensionPresent(),
    });
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
          quadro. Com a extensão CP Vistos, a janela oficial abre sobre este quadrado e o botão
          <strong> Transferir para o CEAC</strong> preenche os campos da página atual.
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
        Extensão {extVersion ? `v${extVersion}` : "não detectada"}
        {extVersion && extVersion !== "1.4.1" ? " (atualize para 1.4.1)" : ""}
        : use <strong> Transferir para o CEAC</strong> no painel esquerdo após abrir
        o site oficial. Captcha e avanço de páginas continuam manuais. Sem a extensão, use
        Copiar + Ctrl+V.
      </p>
    </div>
  );
}
