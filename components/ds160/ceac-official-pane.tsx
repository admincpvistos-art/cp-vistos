"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CEAC_URL } from "@/lib/ds160-ceac";

function openCeacBeside() {
  const width = Math.floor(window.screen.availWidth / 2);
  const height = window.screen.availHeight;

  try {
    window.moveTo(0, 0);
    window.resizeTo(width, height);
  } catch {
    // alguns browsers bloqueiam resize
  }

  window.open(
    CEAC_URL,
    "cp-vistos-ceac",
    `popup=yes,width=${Math.max(480, window.screen.availWidth - width)},height=${height},left=${width},top=0`,
  );
}

export function CeacOfficialPane() {
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
    window.postMessage({ type: "CP_VISTOS_OPEN_CEAC_PANEL" }, "*");

    return () => window.removeEventListener("message", onMessage);
  }, []);

  function openPanel() {
    window.postMessage({ type: "CP_VISTOS_OPEN_CEAC_PANEL" }, "*");
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-5 bg-[#f4f1ea] px-8 text-center text-[#1b2a4a]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b3a6e]">
          Online Nonimmigrant Visa Application
        </p>
        <h2 className="mt-2 text-xl font-semibold">CEAC oficial</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#314060]">
          O site do governo não pode ser aberto dentro deste quadro — ele entra em loop de
          redirecionamento. O CEAC precisa abrir como página normal, ao lado deste formulário.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {extensionReady ? (
          <Button className="h-11" onClick={openPanel}>
            Abrir CEAC no painel do Chrome
          </Button>
        ) : null}
        <Button
          variant={extensionReady ? "outline" : "default"}
          className="h-11"
          onClick={openCeacBeside}
        >
          Abrir CEAC ao lado (metade da tela)
        </Button>
        <Button variant="outline" className="h-11" asChild>
          <a href={CEAC_URL} target="_blank" rel="noreferrer">
            Abrir CEAC em nova aba
          </a>
        </Button>
      </div>

      <p className="max-w-md text-xs text-[#6b7280]">
        Com a extensão <strong>CP Vistos — CEAC ao lado do DS-160</strong> (v1.1), o site abre no
        painel direito do Chrome. Sem ela, use o botão de metade da tela. Recarregue a extensão se
        ainda estiver na versão antiga.
      </p>
    </div>
  );
}
