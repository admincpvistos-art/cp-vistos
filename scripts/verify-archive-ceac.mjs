/**
 * VerificaÃ§Ãµes estÃ¡ticas do fluxo Arquivar + extensÃ£o CEAC (sem rede).
 * Executar: node scripts/verify-archive-ceac.mjs
 */
import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SERVICE_TO_ARQUIVADOS_CATEGORY = {
  primeiro_visto: "american_visa",
  renovacao: "renovacao",
  passaporte: "passport",
  esta: "e_ta",
};

function categoriesForServices(services) {
  return services.map((service) => {
    const category = SERVICE_TO_ARQUIVADOS_CATEGORY[service];
    assert.ok(category, `serviÃ§o invÃ¡lido: ${service}`);
    return category;
  });
}

// --- Arquivar: mapeamento e replicaÃ§Ã£o ---
assert.deepStrictEqual(categoriesForServices(["primeiro_visto"]), ["american_visa"]);
assert.deepStrictEqual(categoriesForServices(["passaporte"]), ["passport"]);
assert.deepStrictEqual(categoriesForServices(["primeiro_visto", "passaporte"]), [
  "american_visa",
  "passport",
]);
assert.deepStrictEqual(
  categoriesForServices(["primeiro_visto", "renovacao", "passaporte", "esta"]),
  ["american_visa", "renovacao", "passport", "e_ta"],
);

// Simula â€œtransferÃªnciaâ€: sai da lista ativa e entra em N abas.
function simulateArchiveTransfer(activeRows, id, services) {
  const row = activeRows.find((item) => item.id === id);
  assert.ok(row, "cliente precisa existir no acompanhamento");
  const categories = categoriesForServices(services);
  const archived = categories.map((category, index) => ({
    id: `arch-${id}-${index}`,
    category,
    name: row.name,
    sourceAcompanhamentoId: id,
  }));
  const nextActive = activeRows.filter((item) => item.id !== id);
  return { nextActive, archived, categories };
}

const sim = simulateArchiveTransfer(
  [
    { id: "a1", name: "TESTE ARCHIVE" },
    { id: "a2", name: "OUTRO" },
  ],
  "a1",
  ["primeiro_visto", "esta"],
);
assert.strictEqual(sim.nextActive.length, 1);
assert.strictEqual(sim.nextActive[0].id, "a2");
assert.strictEqual(sim.archived.length, 2);
assert.deepStrictEqual(
  sim.archived.map((row) => row.category).sort(),
  ["american_visa", "e_ta"],
);

// --- CEAC extensÃ£o: versÃ£o alinhada ---
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "extensions/ceac-frame/manifest.json"), "utf8"),
);
assert.strictEqual(manifest.version, "1.5.4");

const contentAdmin = fs.readFileSync(
  path.join(root, "extensions/ceac-frame/content-admin.js"),
  "utf8",
);
assert.ok(contentAdmin.includes('const EXT_VERSION = "1.5.4"'));
assert.ok(contentAdmin.includes("sendRuntimeWithRetry"));
assert.ok(contentAdmin.includes("CP_VISTOS_TRANSFER_CEAC"));

const contentCeac = fs.readFileSync(
  path.join(root, "extensions/ceac-frame/content-ceac.js"),
  "utf8",
);
assert.ok(contentCeac.includes("__cpVistosRunFill"));

const windowLib = fs.readFileSync(path.join(root, "lib/ds160-ceac-window.ts"), "utf8");
assert.ok(windowLib.includes("CEAC_EXTENSION_EXPECTED_VERSION"));
assert.ok(windowLib.includes("1.5.4"));
assert.ok(windowLib.includes("pauseCeacPinForTransfer"));
assert.ok(windowLib.includes("16000"));

const archiveFn = fs.readFileSync(
  path.join(root, "server/acompanhamento-sheet.ts"),
  "utf8",
);
assert.ok(archiveFn.includes("archiveNameGroupKey(row.name, row.group)"));
assert.ok(archiveFn.includes("visibleRecords"));
assert.ok(archiveFn.includes("ACOMPANHAMENTO_ARCHIVED_SOURCE"));

const editSheet = fs.readFileSync(
  path.join(
    root,
    "app/(dashboard)/perfil/acompanhamento-clientes/acompanhamento-edit-sheet.tsx",
  ),
  "utf8",
);
assert.ok(editSheet.includes("AcompanhamentoArchiveAction") || editSheet.includes("Enviar para Arquivados"));

console.log("OK verify-archive-ceac: mapeamento, transferÃªncia simulada e CEAC v1.5.4");
