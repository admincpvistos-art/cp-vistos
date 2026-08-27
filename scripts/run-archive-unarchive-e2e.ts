/**
 * E2E: arquivar + desarquivar JULIA BREDA ROQUE (fluxo servidor).
 * npx tsx scripts/run-archive-unarchive-e2e.ts
 */
import fs from "fs";
import path from "path";
import assert from "assert";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return false;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
  return Boolean(process.env.DATABASE_URL);
}

function norm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

async function main() {
  if (!loadEnvLocal()) {
    console.error("DATABASE_URL ausente");
    process.exit(1);
  }

  const { archiveAcompanhamentoClient, listAcompanhamentoSheet } = await import(
    "../server/acompanhamento-sheet"
  );
  const { listArquivadosSheet, unarchiveArquivadoClient } = await import(
    "../server/arquivados-sheet"
  );
  const prisma = (await import("../lib/prisma")).default;

  const needle = "juliabredaroque";

  try {
    let sheet = await listAcompanhamentoSheet();
    let target = sheet.rows.find((row) => norm(row.name).includes(needle));

    if (!target) {
      const arch = await listArquivadosSheet("american_visa");
      const inArch = arch.find((row) => norm(row.name).includes(needle));
      if (inArch?.id.startsWith("db:")) {
        console.log("Julia já em Arquivados — desarquivando primeiro");
        await unarchiveArquivadoClient(inArch.id);
        sheet = await listAcompanhamentoSheet();
        target = sheet.rows.find((row) => norm(row.name).includes(needle));
      }
    }

    assert.ok(target, "JULIA BREDA ROQUE não encontrada no Acompanhamento");
    console.log("1) Acompanhamento:", target.name, target.id, target.services);

    const services =
      target.services.length > 0 ? target.services : (["primeiro_visto"] as const);
    const archiveResult = await archiveAcompanhamentoClient(target.id, [...services]);
    assert.ok(archiveResult);
    console.log("2) Arquivado →", archiveResult.labels.join(", "));

    sheet = await listAcompanhamentoSheet();
    assert.strictEqual(
      sheet.rows.some((row) => norm(row.name).includes(needle)),
      false,
      "Julia ainda no Acompanhamento após arquivar",
    );

    let archRowId: string | null = null;
    for (const category of archiveResult.categories) {
      const tab = await listArquivadosSheet(
        category as "american_visa" | "renovacao" | "passport" | "e_ta",
      );
      const found = tab.find((row) => norm(row.name).includes(needle));
      assert.ok(found, `Julia não na aba ${category}`);
      console.log(`3) Aba ${category}: OK (${found.id})`);
      if (found.id.startsWith("db:")) {
        archRowId = found.id;
      }
    }
    assert.ok(archRowId, "Snapshot db: não encontrado para desarquivar");

    const un = await unarchiveArquivadoClient(archRowId);
    console.log("4) Desarquivado → acompanhamentoId", un.acompanhamentoId);

    sheet = await listAcompanhamentoSheet();
    const back = sheet.rows.find((row) => norm(row.name).includes(needle));
    assert.ok(back, "Julia não voltou ao Acompanhamento");
    console.log("5) De volta ao Acompanhamento:", back.name, back.services);

    for (const category of archiveResult.categories) {
      const tab = await listArquivadosSheet(
        category as "american_visa" | "renovacao" | "passport" | "e_ta",
      );
      assert.strictEqual(
        tab.some((row) => norm(row.name).includes(needle) && row.id.startsWith("db:")),
        false,
        `Julia ainda em Arquivados/${category}`,
      );
    }

    console.log("\nOK archive+unarchive E2E");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nFALHA:", error instanceof Error ? error.message : error);
  process.exit(1);
});
