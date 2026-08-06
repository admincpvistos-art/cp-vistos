/**
 * Garante que o admin exista com a senha informada (cria ou atualiza o hash).
 *
 * Uso (PowerShell):
 *   $env:NEW_ADMIN_EMAIL = "admin@cpvistos.com"
 *   $env:NEW_ADMIN_PASSWORD = "sua-senha-aqui"
 *   $env:NEW_ADMIN_NAME = "Admin CP Vistos"   # opcional
 *   npx tsx scripts/upsert-admin.ts
 */
import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const EXISTING_ADMIN_EMAIL = "cpassessoriavistos@gmail.com";
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

const prisma = new PrismaClient();

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente "${name}" não foi definida. Defina-a antes de rodar o script.`,
    );
  }
  return value;
}

async function main() {
  const newAdminEmail = getRequiredEnv("NEW_ADMIN_EMAIL").trim().toLowerCase();
  const newAdminPassword = getRequiredEnv("NEW_ADMIN_PASSWORD");
  const newAdminName = process.env.NEW_ADMIN_NAME || "Admin CP Vistos";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: EXISTING_ADMIN_EMAIL },
    select: { role: true },
  });

  if (!existingAdmin) {
    throw new Error(
      `Usuário existente "${EXISTING_ADMIN_EMAIL}" não foi encontrado. Abortando.`,
    );
  }

  const roleToUse: Role = existingAdmin.role;
  const passwordHash = await bcrypt.hash(newAdminPassword, BCRYPT_SALT_ROUNDS);

  const result = await prisma.user.upsert({
    where: { email: newAdminEmail },
    create: {
      name: newAdminName,
      email: newAdminEmail,
      password: passwordHash,
      role: roleToUse,
    },
    update: {
      name: newAdminName,
      password: passwordHash,
      role: roleToUse,
    },
    select: { id: true, name: true, email: true, role: true, updatedAt: true },
  });

  console.log("Admin upsert concluído:");
  console.log(result);
}

main()
  .catch((error) => {
    console.error("Erro ao upsert do admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
