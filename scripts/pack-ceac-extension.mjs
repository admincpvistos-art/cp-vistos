/**
 * Empacota a extensão CEAC para upload na Chrome Web Store
 * e gera zip de fallback em public/downloads.
 *
 * Uso: node scripts/pack-ceac-extension.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const extDir = path.join(root, "extensions", "ceac-frame");
const outDir = path.join(root, "public", "downloads");
const storeZip = path.join(root, "extensions", "ceac-frame-store.zip");
const publicZip = path.join(outDir, "cp-vistos-ceac-extension.zip");

const INCLUDE = new Set([
  "manifest.json",
  "background.js",
  "content-admin.js",
  "content-ceac.js",
  "sidepanel.html",
  "sidepanel.js",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
]);

function listFiles(dir, prefix = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "icons") {
        files.push(...listFiles(abs, rel));
      }
      continue;
    }
    if (INCLUDE.has(rel.replace(/\\/g, "/"))) {
      files.push(rel.replace(/\\/g, "/"));
    }
  }
  return files;
}

const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf8"));
const version = manifest.version;
const files = listFiles(extDir);
if (!files.includes("manifest.json")) {
  throw new Error("manifest.json ausente no pacote");
}

fs.mkdirSync(outDir, { recursive: true });
for (const target of [storeZip, publicZip]) {
  if (fs.existsSync(target)) fs.unlinkSync(target);
}

// Prefer PowerShell Compress-Archive on Windows (no extra deps).
const staging = path.join(root, "extensions", ".ceac-pack-staging");
fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });
for (const rel of files) {
  const from = path.join(extDir, rel);
  const to = path.join(staging, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

const ps = `
$ErrorActionPreference = 'Stop'
Compress-Archive -Path '${staging.replace(/'/g, "''")}\\*' -DestinationPath '${storeZip.replace(/'/g, "''")}' -Force
Copy-Item -Force '${storeZip.replace(/'/g, "''")}' '${publicZip.replace(/'/g, "''")}'
`;
execFileSync("powershell.exe", ["-NoProfile", "-Command", ps], { stdio: "inherit" });
fs.rmSync(staging, { recursive: true, force: true });

console.log(`OK CEAC v${version}`);
console.log(`Store zip: ${storeZip}`);
console.log(`Public zip: ${publicZip}`);
console.log(`Arquivos: ${files.length}`);
