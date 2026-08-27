import { redirect } from "next/navigation";

import { buildGoogleWriteReviewUrl } from "@/lib/google-reviews";

/**
 * Link curto para enviar aos clientes:
 * https://www.cpvistos.com.br/avaliar
 * Redireciona ao formulário oficial de avaliação no Google.
 */
export default function AvaliarPage() {
  const url = buildGoogleWriteReviewUrl();

  if (!url) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Avaliação Google</h1>
        <p className="text-foreground/70">
          Configure a variável de ambiente <code>GOOGLE_PLACE_ID</code> ou{" "}
          <code>GOOGLE_REVIEW_URL</code> no deploy para ativar este link.
        </p>
        <a href="/" className="text-primary underline">
          Voltar ao site
        </a>
      </main>
    );
  }

  redirect(url);
}
