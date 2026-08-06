/**
 * Cria um novo usuário administrador espelhando a "role" do usuário
 * existente `cpassessoriavistos@gmail.com`, SEM alterar esse usuário.
 *
 * Uso (PowerShell):
 *   $env:NEW_ADMIN_EMAIL = "admin@cpvistos.com"
 *   $env:NEW_ADMIN_PASSWORD = "sua-senha-aqui"
 *   $env:NEW_ADMIN_NAME = "Admin CP Vistos"   # opcional
 *   npx tsx scripts/create-admin.ts
 *
 * Uso (bash):
 *   NEW_ADMIN_EMAIL="admin@cpvistos.com" NEW_ADMIN_PASSWORD="sua-senha-aqui" npx tsx scripts/create-admin.ts
 *
 * Nenhum dado sensível fica hardcoded no arquivo — tudo vem de variáveis de
 * ambiente, para que este script possa ser versionado com segurança.
 *
 * Requer que DATABASE_URL esteja definido em `.env.local` (ou já exportado
 * no ambiente). O script carrega `.env.local` manualmente, sem depender de
 * nenhuma dependência nova (evita `pnpm add dotenv`).
 */
import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const EXISTING_ADMIN_EMAIL = "cpassessoriavistos@gmail.com";

// Mesmo custo de salt usado em auth.ts, app/api/register/route.ts e
// app/api/edit-account-password/route.ts.
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
      `Variável de ambiente "${name}" não foi definida. Defina-a antes de rodar o script ` +
        "(veja o comentário de uso no topo deste arquivo).",
    );
  }
  return value;
}

async function main() {
  const newAdminEmail = getRequiredEnv("NEW_ADMIN_EMAIL");
  const newAdminPassword = getRequiredEnv("NEW_ADMIN_PASSWORD");
  const newAdminName = process.env.NEW_ADMIN_NAME || "Admin CP Vistos";

  // 1) Leitura (somente SELECT) do usuário existente, apenas para copiar a role.
  //    Nenhuma escrita/atualização é feita nesse registro em nenhum momento.
  const existingAdmin = await prisma.user.findUnique({
    where: { email: EXISTING_ADMIN_EMAIL },
    select: { role: true },
  });

  if (!existingAdmin) {
    throw new Error(
      `Usuário existente "${EXISTING_ADMIN_EMAIL}" não foi encontrado. ` +
        "Abortando para não criar o novo usuário com uma role incorreta.",
    );
  }

  const roleToUse: Role = existingAdmin.role;

  // 2) Evita duplicidade: se o e-mail já existir, não faz nada.
  const alreadyExists = await prisma.user.findUnique({
    where: { email: newAdminEmail },
    select: { id: true },
  });

  if (alreadyExists) {
    console.log(
      `Usuário "${newAdminEmail}" já existe (id: ${alreadyExists.id}). Nenhuma ação foi realizada.`,
    );
    return;
  }

  // 3) Hash da senha usando exatamente o mesmo método do sistema para essa role.
  //    auth.ts só usa bcrypt.compare para ADMIN/COLLABORATOR; para CLIENT a
  //    comparação é em texto puro. Espelhamos esse comportamento aqui.
  let passwordToStore: string;
  if (roleToUse === Role.ADMIN || roleToUse === Role.COLLABORATOR) {
    passwordToStore = await bcrypt.hash(newAdminPassword, BCRYPT_SALT_ROUNDS);
  } else {
    console.warn(
      `Aviso: a role espelhada do usuário existente é "${roleToUse}", que no sistema ` +
        "atual faz login com senha em texto puro (sem hash). Mantendo sem hash para " +
        "ser consistente com o fluxo de login existente.",
    );
    passwordToStore = newAdminPassword;
  }

  const created = await prisma.user.create({
    data: {
      name: newAdminName,
      email: newAdminEmail,
      password: passwordToStore,
      role: roleToUse,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  console.log("Novo usuário administrador criado com sucesso:");
  console.log(created);
}

main()
  .catch((error) => {
    console.error("Erro ao criar usuário administrador:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
