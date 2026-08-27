/**
 * E2E leve Prisma: arquivar + desarquivar JULIA (valida delete + recreate).
 * node scripts/test-archive-unarchive-light.mjs
 */
import assert from "assert";
import { loadEnvLocal } from "./load-env-local.mjs";

if (!loadEnvLocal()) {
  console.error("DATABASE_URL ausente");
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

const SERVICE_TO_CATEGORY = {
  primeiro_visto: "american_visa",
  renovacao: "renovacao",
  passaporte: "passport",
  esta: "e_ta",
};

function norm(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function archiveNameGroupKey(name, group) {
  const n = norm(name);
  const g = norm(group);
  if (!n || !g) return "";
  return `${n}|${g}`;
}

try {
  const rows = await prisma.acompanhamentoClient.findMany({
    where: { source: "imported" },
    include: { user: { select: { name: true, group: true } } },
  });
  const target = rows.find((r) => {
    const n = norm(r.user?.name || r.cells?.[0] || "");
    return n === "juliabredaroque" || n.includes("juliabreda");
  });
  assert.ok(target, "JULIA BREDA ROQUE não encontrada no Acompanhamento");

  const name = target.user?.name || target.cells[0];
  const group = target.user?.group || target.cells[19] || "";
  let services = (target.services || []).filter(Boolean);
  if (!services.length) services = ["primeiro_visto"];

  console.log("1) Arquivando", name, "| serviços:", services.join(", "));

  const createdIds = [];
  for (const service of services) {
    const category = SERVICE_TO_CATEGORY[service];
    assert.ok(category, `serviço inválido: ${service}`);
    const created = await prisma.arquivadoClient.create({
      data: {
        category,
        name,
        group,
        barcode: target.cells?.[1] || "",
        barcodeIssued: target.cells?.[2] || "",
        casv: target.cells?.[3] || "",
        interview: target.cells?.[4] || "",
        meeting: target.cells?.[5] || "",
        tax: target.cells?.[9] || "",
        dob: target.cells?.[13] || "",
        passport: target.cells?.[14] || "",
        email: target.cells?.[16] || "",
        entryDate: target.cells?.[18] || "",
        status: "FINALIZADO",
        services: [service],
        sourceAcompanhamentoId: target.id,
        sourceUserId: target.userId,
      },
    });
    createdIds.push(created.id);
    console.log("   → Arquivados/", category);
  }

  await prisma.acompanhamentoClient.delete({ where: { id: target.id } });
  assert.strictEqual(
    await prisma.acompanhamentoClient.findUnique({ where: { id: target.id } }),
    null,
  );
  console.log("2) Saiu do Acompanhamento");

  // --- desarquivar (espelha unarchiveArquivadoClient) ---
  const snapshot = await prisma.arquivadoClient.findUnique({
    where: { id: createdIds[0] },
  });
  assert.ok(snapshot);
  const related = await prisma.arquivadoClient.findMany({
    where: {
      OR: [
        ...(snapshot.sourceUserId ? [{ sourceUserId: snapshot.sourceUserId }] : []),
        ...(snapshot.sourceAcompanhamentoId
          ? [{ sourceAcompanhamentoId: snapshot.sourceAcompanhamentoId }]
          : []),
        { name: snapshot.name, group: snapshot.group },
      ],
    },
  });

  let userId = snapshot.sourceUserId;
  if (userId) {
    const taken = await prisma.acompanhamentoClient.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (taken) userId = null;
  }

  const cells = Array.from({ length: 22 }, () => "");
  cells[0] = snapshot.name;
  cells[1] = snapshot.barcode;
  cells[2] = snapshot.barcodeIssued;
  cells[3] = snapshot.casv;
  cells[4] = snapshot.interview;
  cells[5] = snapshot.meeting;
  cells[9] = snapshot.tax;
  cells[13] = snapshot.dob;
  cells[14] = snapshot.passport;
  cells[16] = snapshot.email;
  cells[18] = snapshot.entryDate;
  cells[19] = snapshot.group;
  cells[21] = "ATIVO";

  const restored = await prisma.acompanhamentoClient.create({
    data: {
      source: "imported",
      cells,
      statusLabel: "ATIVO",
      services,
      ...(userId ? { userId } : {}),
    },
  });
  await prisma.arquivadoClient.deleteMany({
    where: { id: { in: related.map((r) => r.id) } },
  });
  console.log("3) Desarquivado →", restored.id);

  const back = await prisma.acompanhamentoClient.findMany({
    where: { source: "imported" },
    include: { user: { select: { name: true } } },
  });
  assert.ok(
    back.some((r) => norm(r.user?.name || r.cells?.[0] || "").includes("juliabredaroque")),
  );
  assert.strictEqual(
    await prisma.arquivadoClient.count({
      where: { id: { in: createdIds } },
    }),
    0,
  );
  console.log("4) De volta ao Acompanhamento; snapshots removidos");
  console.log("\nOK test-archive-unarchive-light");
} catch (error) {
  console.error("\nFALHA:", error.message || error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
