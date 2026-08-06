/**
 * Diagnóstico de login para um usuário (não altera dados).
 * Uso (PowerShell):
 *   $env:CHECK_EMAIL = "admin@cpvistos.com"
 *   $env:CHECK_PASSWORD = "sua-senha"
 *   npx tsx scripts/check-admin-login.ts
 */
import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

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

async function main() {
  const email = process.env.CHECK_EMAIL;
  const password = process.env.CHECK_PASSWORD;

  if (!email || !password) {
    throw new Error("Defina CHECK_EMAIL e CHECK_PASSWORD");
  }

  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.log(JSON.stringify({ found: false, email }, null, 2));
    return;
  }

  const looksHashed = user.password.startsWith("$2a$") || user.password.startsWith("$2b$");
  const bcryptMatch = looksHashed
    ? await bcrypt.compare(password, user.password)
    : false;
  const plaintextMatch = password === user.password;

  console.log(
    JSON.stringify(
      {
        found: true,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        passwordLooksHashed: looksHashed,
        passwordLength: user.password.length,
        bcryptMatch,
        plaintextMatch,
        authPath:
          user.role === "ADMIN" || user.role === "COLLABORATOR"
            ? "bcrypt.compare"
            : "plaintext ===",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Erro:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
