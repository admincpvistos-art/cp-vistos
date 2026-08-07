import prisma from "@/lib/prisma";

function sanitizeDbUrl(dbUrl: string): string {
  try {
    const url = new URL(dbUrl);
    // Hide credentials; show only protocol + host + pathname
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return dbUrl.substring(0, 40) + "...";
  }
}

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      return Response.json(
        {
          error: "DATABASE_URL não está definida!",
          message: "A variável de ambiente não foi carregada",
        },
        { status: 500 }
      );
    }

    // Probe real connectivity via Prisma
    await prisma.$runCommandRaw({ ping: 1 });

    return Response.json(
      {
        message: "DATABASE_URL está definida e a conexão com o banco funcionou!",
        urlPreview: sanitizeDbUrl(dbUrl),
        status: "Conectado",
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return Response.json({ error: message }, { status: 500 });
  }
}
