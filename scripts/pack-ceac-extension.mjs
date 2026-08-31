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

/** Chrome Web Store rejeita padrões com porta curinga (`:*`). */
function sanitizeStoreMatchPatterns(patterns) {
  return [...new Set(patterns.filter((p) => !p.includes(":*")))];
}

function storeManifest(source) {
  const next = structuredClone(source);
  next.host_permissions = sanitizeStoreMatchPatterns(source.host_permissions ?? []);
  next.content_scripts = (source.content_scripts ?? []).map((entry) => ({
    ...entry,
    matches: sanitizeStoreMatchPatterns(entry.matches ?? []),
  }));
  return next;
}

function stageExtension(targetDir, manifestJson) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  for (const rel of files) {
    if (rel === "manifest.json") continue;
    const from = path.join(extDir, rel);
    const to = path.join(targetDir, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  fs.writeFileSync(
    path.join(targetDir, "manifest.json"),
    `${JSON.stringify(manifestJson, null, 2)}\n`,
    "utf8",
  );
}

function zipDir(sourceDir, zipPath) {
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  const ps = `
$ErrorActionPreference = 'Stop'
Compress-Archive -Path '${sourceDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force
`;
  execFileSync("powershell.exe", ["-NoProfile", "-Command", ps], { stdio: "inherit" });
}

fs.mkdirSync(outDir, { recursive: true });

const stagingStore = path.join(root, "extensions", ".ceac-pack-staging-store");
const stagingPublic = path.join(root, "extensions", ".ceac-pack-staging-public");
stageExtension(stagingStore, storeManifest(manifest));
stageExtension(stagingPublic, manifest);
zipDir(stagingStore, storeZip);
zipDir(stagingPublic, publicZip);
fs.rmSync(stagingStore, { recursive: true, force: true });
fs.rmSync(stagingPublic, { recursive: true, force: true });

console.log(`OK CEAC v${version}`);
console.log(`Store zip: ${storeZip}`);
console.log(`Public zip: ${publicZip}`);
console.log(`Arquivos: ${files.length}`);
