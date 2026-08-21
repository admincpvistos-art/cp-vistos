import { NextResponse } from "next/server";

import { runOperationsSyncBatch } from "@/server/acompanhamento-sheet";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron === "1") {
    return true;
  }

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Sem segredo configurado, ainda aceita o header da Vercel acima.
    return false;
  }

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Job em segundo plano: cadastra clientes do Excel no Financeiro / Serviços
 * mesmo com o painel fechado. Agendado em vercel.json (a cada minuto).
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runOperationsSyncBatch({
      budgetMs: 50000,
      batchSize: 40,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      done:
        result.pendingSync === 0 &&
        result.linkedUsers >= result.totalImported,
    });
  } catch (error) {
    console.error("[cron/sync-acompanhamento]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falha no sync",
      },
      { status: 500 },
    );
  }
}
