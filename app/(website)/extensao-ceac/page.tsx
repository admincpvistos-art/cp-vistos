import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CEAC_EXTENSION_EXPECTED_VERSION } from "@/lib/ds160-ceac-window";

const STORE_URL = process.env.NEXT_PUBLIC_CEAC_EXTENSION_STORE_URL?.trim() || "";

export default function ExtensaoCeacPage() {
  const hasStore = Boolean(STORE_URL);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col gap-6 px-6 py-24">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Uso interno · escritório
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Extensão CEAC · v{CEAC_EXTENSION_EXPECTED_VERSION}
        </h1>
        <p className="mt-3 text-foreground/70 leading-relaxed">
          Esta extensão abre o site oficial do CEAC ao lado do Preencher DS-160 e permite
          transferir os campos da página atual. Para atualizar{" "}
          <strong>automaticamente</strong> em todos os PCs, ela precisa estar instalada pela
          Chrome Web Store (não pelo modo “Carregar sem compactação”).
        </p>
      </div>

      {hasStore ? (
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <p className="font-medium">Instalação recomendada (atualiza sozinha)</p>
          <ol className="list-decimal pl-5 text-sm text-foreground/80 space-y-1">
            <li>Abra o link da Chrome Web Store</li>
            <li>Clique em <strong>Usar no Chrome</strong></li>
            <li>Se existir a extensão antiga “sem compactação”, remova-a em chrome://extensions</li>
            <li>Abra Preencher DS-160 e confira a versão no quadro CEAC</li>
          </ol>
          <Button asChild className="mt-2">
            <a href={STORE_URL} target="_blank" rel="noreferrer">
              Abrir na Chrome Web Store
            </a>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4 space-y-2 text-sm text-amber-950">
          <p className="font-medium">Store ainda não configurada neste ambiente</p>
          <p>
            Publique o zip gerado por <code>node scripts/pack-ceac-extension.mjs</code> no
            Chrome Web Store Developer Dashboard (veja{" "}
            <code>extensions/ceac-frame/PUBLISH.md</code>). Depois defina na Vercel:
          </p>
          <p>
            <code>NEXT_PUBLIC_CEAC_EXTENSION_STORE_URL</code> = link da extensão na Store
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border p-4 space-y-3">
        <p className="font-medium">Fallback manual (sem atualização automática)</p>
        <ol className="list-decimal pl-5 text-sm text-foreground/80 space-y-1">
          <li>
            Baixe o{" "}
            <a
              className="text-primary underline"
              href="/downloads/cp-vistos-ceac-extension.zip"
            >
              zip da extensão
            </a>
          </li>
          <li>Extraia em uma pasta fixa do PC</li>
          <li>
            Em <code>chrome://extensions</code>, ative Modo do desenvolvedor → Carregar sem
            compactação
          </li>
          <li>Ctrl+F5 em Preencher DS-160</li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Neste modo, a cada versão nova é preciso clicar em Atualizar na pasta ou
          reinstalar.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Política de privacidade:{" "}
        <Link href="/politica-de-privacidade" className="text-primary underline">
          /politica-de-privacidade
        </Link>
      </p>
    </main>
  );
}
