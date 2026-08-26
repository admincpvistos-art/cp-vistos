/**
 * Teste do protocolo Transferir CEAC (sem Chrome).
 * Valida versão, mensagens e timeouts esperados no código.
 * node scripts/test-ceac-transfer-unit.mjs
 */
import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ext = path.join(root, "extensions/ceac-frame");

const manifest = JSON.parse(fs.readFileSync(path.join(ext, "manifest.json"), "utf8"));
assert.strictEqual(manifest.version, "1.5.2");
assert.ok(manifest.permissions.includes("scripting"));
assert.ok(manifest.host_permissions.some((h) => h.includes("cpvistos.com.br")));
assert.ok(manifest.host_permissions.some((h) => h.includes("ceac.state.gov")));

const admin = fs.readFileSync(path.join(ext, "content-admin.js"), "utf8");
assert.ok(admin.includes('EXT_VERSION = "1.5.2"'));
assert.ok(admin.includes("sendRuntimeWithRetry"));
assert.ok(admin.includes("CP_VISTOS_TRANSFER_CEAC"));
assert.ok(admin.includes("CP_VISTOS_TRANSFER_CEAC_RESULT"));
assert.ok(admin.includes("unpin-ceac-window"));
assert.ok(admin.includes("transfer-ceac-fields"));
assert.ok(admin.includes("pin-ceac-window"));

const bg = fs.readFileSync(path.join(ext, "background.js"), "utf8");
assert.ok(bg.includes("transfer-ceac-fields"));
assert.ok(bg.includes("__cpVistosRunFill") || bg.includes("fill-ceac-fields"));
assert.ok(bg.includes("executeScript"));

const ceac = fs.readFileSync(path.join(ext, "content-ceac.js"), "utf8");
assert.ok(ceac.includes("__cpVistosRunFill"));

const win = fs.readFileSync(path.join(root, "lib/ds160-ceac-window.ts"), "utf8");
assert.ok(win.includes("pauseCeacPinForTransfer"));
assert.ok(win.includes("resumeCeacPinAfterTransfer"));
assert.ok(win.includes("CP_VISTOS_TRANSFER_CEAC"));
assert.ok(win.includes("40000"));
assert.ok(win.includes("v1.5.2"));

// Simula handshake página ↔ content-script
function simulateTransferHandshake({ extensionPresent, workerResponds, delayMs = 0 }) {
  if (!extensionPresent) {
    return {
      ok: false,
      error: "Extensão CP Vistos não detectada",
    };
  }

  const TIMEOUT = 40000;
  if (!workerResponds) {
    return {
      ok: false,
      error: "Extensão não respondeu",
    };
  }
  if (delayMs > TIMEOUT) {
    return {
      ok: false,
      error: "Extensão não respondeu",
    };
  }
  return { ok: true, filled: 3, skipped: 1, error: null };
}

assert.strictEqual(simulateTransferHandshake({ extensionPresent: false }).ok, false);
assert.strictEqual(
  simulateTransferHandshake({ extensionPresent: true, workerResponds: false }).ok,
  false,
);
assert.deepStrictEqual(
  simulateTransferHandshake({ extensionPresent: true, workerResponds: true, delayMs: 500 }),
  { ok: true, filled: 3, skipped: 1, error: null },
);

console.log("OK test-ceac-transfer-unit: protocolo v1.5.2 + handshake simulado");
