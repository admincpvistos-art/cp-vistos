import { Role, Status } from "@prisma/client";
import { toZonedTime } from "date-fns-tz";

import prisma from "@/lib/prisma";

const SAO_PAULO = "America/Sao_Paulo";

export function cadastroYear(entryDate: Date | null | undefined, createdAt: Date) {
  return toZonedTime(entryDate ?? createdAt, SAO_PAULO).getFullYear();
}

export function isCadastroFrom2025(entryDate: Date | null | undefined, createdAt: Date) {
  return cadastroYear(entryDate, createdAt) === 2025;
}

export function isCadastroBefore2026(entryDate: Date | null | undefined, createdAt: Date) {
  return cadastroYear(entryDate, createdAt) < 2026;
}

async function deleteClientAccount(userId: string) {
  await prisma.user.updateMany({
    where: { payerUserId: userId },
    data: { payerUserId: null },
  });

  const profiles = await prisma.profile.findMany({
    where: { userId },
    select: { id: true },
  });
  const profileIds = profiles.map((profile) => profile.id);

  if (profileIds.length) {
    await prisma.notification.deleteMany({ where: { profileId: { in: profileIds } } });
    await prisma.comments.deleteMany({ where: { profileId: { in: profileIds } } });
    await prisma.form.deleteMany({ where: { profileId: { in: profileIds } } });
    await prisma.passportForm.deleteMany({ where: { profileId: { in: profileIds } } });
    await prisma.profile.deleteMany({ where: { userId } });
  }

  await prisma.financeEntry.deleteMany({ where: { userId } });
  await prisma.serviceCost.deleteMany({ where: { userId } });
  await prisma.annotations.deleteMany({ where: { userId } });
  await prisma.comments.deleteMany({ where: { authorId: userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.acompanhamentoClient.deleteMany({
    where: { userId, source: "cadastro" },
  });
  await prisma.user.delete({ where: { id: userId } });
}

let purgePromise: Promise<void> | null = null;

export async function purgeCadastroClientsFrom2025() {
  if (!purgePromise) {
    purgePromise = runPurge().finally(() => {
      purgePromise = null;
    });
  }

  await purgePromise;
}

async function runPurge() {
  const imported = await prisma.acompanhamentoClient.findMany({
    where: { source: "imported", userId: { not: null } },
    select: { userId: true },
  });
  const importedIds = new Set(
    imported.map((row) => row.userId).filter((id): id is string => Boolean(id)),
  );

  const clients = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    select: {
      id: true,
      createdAt: true,
      profiles: {
        select: {
          entryDate: true,
          status: true,
        },
      },
    },
  });

  const toDelete: string[] = [];

  for (const user of clients) {
    if (importedIds.has(user.id)) {
      continue;
    }

    const listed = user.profiles.filter(
      (profile) =>
        profile.status === Status.active ||
        profile.status === Status.archived ||
        profile.status === Status.prospect,
    );

    if (!listed.length) {
      continue;
    }

    const entryDate = listed.find((profile) => profile.entryDate)?.entryDate ?? null;
    if (isCadastroFrom2025(entryDate, user.createdAt)) {
      toDelete.push(user.id);
    }
  }

  for (const userId of toDelete.slice(0, 20)) {
    try {
      await deleteClientAccount(userId);
    } catch {
      // keep removing the rest on the next page load
    }
  }
}
