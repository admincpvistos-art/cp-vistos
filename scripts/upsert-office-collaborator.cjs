/**
 * Cria ou atualiza um colaborador de escritório (role COLLABORATOR).
 * Uso: node scripts/upsert-office-collaborator.cjs
 * Variáveis: OFFICE_COLLAB_EMAIL, OFFICE_COLLAB_PASSWORD, OFFICE_COLLAB_NAME
 */
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { PrismaClient, Role } = require("@prisma/client");

const BCRYPT_SALT_ROUNDS = 12;
const OFFICE_EMAILS = [
  "cpassessoriavistos1@gmail.com",
  "cpassessoriavistos2@gmail.com",
  "cpassessoriavistos3@gmail.com",
];

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
  const email = (process.env.OFFICE_COLLAB_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.OFFICE_COLLAB_PASSWORD ?? "";
  const name = process.env.OFFICE_COLLAB_NAME || "Colaborador CP Vistos";

  if (!email || !password) {
    throw new Error("Defina OFFICE_COLLAB_EMAIL e OFFICE_COLLAB_PASSWORD.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        password: passwordHash,
        role: Role.COLLABORATOR,
      },
    });
    console.log(`Atualizado ${email} como COLLABORATOR (${existing.id}).`);
  } else {
    const created = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: Role.COLLABORATOR,
      },
    });
    console.log(`Criado ${email} como COLLABORATOR (${created.id}).`);
  }

  const demoted = await prisma.user.updateMany({
    where: {
      email: { in: OFFICE_EMAILS },
      role: Role.ADMIN,
    },
    data: {
      role: Role.COLLABORATOR,
    },
  });

  console.log(`Logins de escritório rebaixados de ADMIN: ${demoted.count}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
