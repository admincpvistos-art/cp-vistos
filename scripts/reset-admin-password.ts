/**
 * Reseta a senha do admin@cpvistos.com, regrava o hash no MongoDB
 * e valida imediatamente com bcrypt.compare lendo o valor FRESCO do banco.
 *
 * Uso:
 *   npx tsx scripts/reset-admin-password.ts
 *
 * Requer DATABASE_URL em `.env.local` (ou no ambiente).
 */
import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const ADMIN_EMAIL = "admin@cpvistos.com";
const PLAIN_PASSWORD = "Cpvistos@1979";
const BCRYPT_SALT_ROUNDS = 12;

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida. Configure em .env.local antes de rodar.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  // 1) Conexão via Prisma (DATABASE_URL -> MongoDB mydb / collection User)
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, email: true, role: true },
  });

  if (!existing) {
    throw new Error(`Usuário "${ADMIN_EMAIL}" não encontrado. Abortando.`);
  }

  // 2) Novo hash bcrypt (saltRounds 12)
  const newHash = await bcrypt.hash(PLAIN_PASSWORD, BCRYPT_SALT_ROUNDS);

  // 3) Atualiza o campo password no documento
  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { password: newHash },
  });

  // 4) Busca de novo no banco (não usar o valor em memória) e compara
  const fresh = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { password: true },
  });

  if (!fresh?.password) {
    throw new Error("Falha ao reler o usuário após o update. Abortando.");
  }

  const hashFromDb = fresh.password;
  const compareResult = await bcrypt.compare(PLAIN_PASSWORD, hashFromDb);

  // 5) Imprime hash e resultado do compare
  console.log("email:", ADMIN_EMAIL);
  console.log("user id:", existing.id);
  console.log("role:", existing.role);
  console.log("novo hash gerado:", newHash);
  console.log("hash lido do banco após save:", hashFromDb);
  console.log("hashes iguais (gerado === banco):", newHash === hashFromDb);
  console.log("bcrypt.compare('Cpvistos@1979', hashDoBanco):", compareResult);

  // 6) Se false, para tudo
  if (!compareResult) {
    console.error(
      "FALHA: bcrypt.compare retornou false após salvar. A senha NÃO foi validada. Pare e investigue.",
    );
    process.exitCode = 1;
    return;
  }

  console.log("OK: senha resetada e validada com sucesso no banco.");
}

main()
  .catch((error) => {
    console.error("Erro no reset-admin-password:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
