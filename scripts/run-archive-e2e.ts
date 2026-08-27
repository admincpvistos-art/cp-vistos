/**
 * E2E real: arquivar OLÍVIA RIBEIRO (Jefferson Ribeiro) via server/acompanhamento-sheet.
 * npx tsx scripts/run-archive-e2e.ts
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
  const { listArquivadosSheet } = await import("../server/arquivados-sheet");
  const prisma = (await import("../lib/prisma")).default;

  try {
    const sheet = await listAcompanhamentoSheet();
    const target = sheet.rows.find(
      (row) =>
        norm(row.name).includes("olivia") &&
        norm(row.group).includes("jefferson"),
    );

    if (!target) {
      const archAmerican = await listArquivadosSheet("american_visa");
      const archPassport = await listArquivadosSheet("passport");
      const inArch = [...archAmerican, ...archPassport].find(
        (row) =>
          norm(row.name).includes("olivia") &&
          norm(row.group).includes("jefferson"),
      );
      if (inArch) {
        console.log("OK: OLÍVIA RIBEIRO já está em Arquivados —", inArch.id);
        return;
      }
      throw new Error("OLÍVIA RIBEIRO (Jefferson Ribeiro) não encontrada no Acompanhamento");
    }

    console.log("1) Cliente no Acompanhamento:", target.name, "| grupo:", target.group);
    console.log("   id:", target.id, "| serviços atuais:", target.services.join(", ") || "(vazio)");

    let services = target.services;
    if (!services.length) {
      console.log("2) Admin marca serviços (simulando 1º visto + passaporte)");
      services = ["primeiro_visto", "passaporte"];
    } else {
      console.log("2) Serviços do cadastro/planilha:", services.join(", "));
    }

    assert.ok(services.length, "Botão arquivar exige ao menos um serviço");

    const result = await archiveAcompanhamentoClient(target.id, services);
    assert.ok(result, "archive retornou null");
    console.log("3) Arquivado → abas:", result.labels.join(", "));
    console.log("   removedIds:", result.removedIds.length);

    const afterSheet = await listAcompanhamentoSheet();
    const stillThere = afterSheet.rows.some(
      (row) =>
        norm(row.name).includes("olivia") &&
        norm(row.group).includes("jefferson"),
    );
    assert.strictEqual(stillThere, false, "Cliente ainda no Acompanhamento");

    for (const category of result.categories) {
      const tab = await listArquivadosSheet(
        category as "american_visa" | "renovacao" | "passport" | "e_ta",
      );
      const found = tab.some(
        (row) =>
          norm(row.name).includes("olivia") &&
          norm(row.group).includes("jefferson"),
      );
      assert.ok(found, `Não encontrada na aba ${category}`);
      console.log(`4) Aba ${category}: OK`);
    }

    console.log("\nOK run-archive-e2e: fluxo admin completo");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nFALHA:", error instanceof Error ? error.message : error);
  process.exit(1);
});
