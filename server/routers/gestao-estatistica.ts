import { differenceInCalendarDays, startOfDay } from "date-fns";
import { Category, VisaStatus } from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  isFinanceAdminEmail,
  isFullAdmin,
  normalizeEmail,
} from "@/lib/staff-access";
import { parseSheetDateOnly } from "@/lib/sheet-datetime";
import type { AcompanhamentoRecord } from "@/lib/acompanhamento-types";
import { listAcompanhamentoSheet } from "@/server/acompanhamento-sheet";
import { acompanhamentoStaffProcedure, router } from "../trpc";

function isActiveRow(row: AcompanhamentoRecord) {
  return (row.status || "").toUpperCase() !== "FINALIZADO";
}

function hasService(row: AcompanhamentoRecord, service: string) {
  return row.services.includes(service as AcompanhamentoRecord["services"][number]);
}

function calendarDaysUntil(value: string): number | null {
  const parsed = parseSheetDateOnly(value);
  if (!parsed) {
    return null;
  }
  return differenceInCalendarDays(startOfDay(parsed), startOfDay(new Date()));
}

function isUnscheduledCasv(value: string) {
  const v = value.trim().toUpperCase();
  if (!v) {
    return true;
  }
  return v.includes("AGENDAR") || v.includes("REAGENDAR");
}

function isTaxUnpaid(row: AcompanhamentoRecord) {
  if (row.accountFields?.budgetPaid === "Pago") {
    return false;
  }
  if (row.accountFields?.budgetPaid === "Pendente") {
    return true;
  }
  const tax = row.tax.trim().toUpperCase();
  if (!tax) {
    return true;
  }
  return (
    tax.includes("FALTA") ||
    tax.includes("AGENDADO") ||
    tax.includes("PEND") ||
    tax.includes("AGUARD") ||
    tax.includes("ENROL") ||
    tax.includes("PAUSADO") ||
    tax.includes("SUMIU") ||
    tax.includes("SEM PREV")
  );
}

function isFormPending(row: AcompanhamentoRecord) {
  const formStatus = String(row.statusForm || "");
  if (formStatus === "filled") {
    return false;
  }
  const ds = row.ds160.trim().toUpperCase();
  if (!ds) {
    return formStatus !== "filled";
  }
  return (
    ds.includes("CLI PREENC") ||
    ds.includes("FALTA PPT") ||
    ds.includes("SEM PREVISAO") ||
    ds.includes("FALTA INFO") ||
    ds.includes("PREENCHENDO") ||
    ds.includes("AGUARD")
  );
}

function countInWindow(rows: AcompanhamentoRecord[], field: "casv" | "interview", maxDays: number) {
  let count = 0;
  for (const row of rows) {
    const days = calendarDaysUntil(row[field]);
    if (days == null) {
      continue;
    }
    if (days >= 0 && days <= maxDays) {
      count += 1;
    }
  }
  return count;
}

function buildByResponsible(
  rows: AcompanhamentoRecord[],
  nameByEmail: Map<string, string>,
) {
  const buckets = new Map<
    string,
    { key: string; label: string; total: number; primeiroVisto: number; renovacao: number }
  >();

  for (const row of rows) {
    const email = normalizeEmail(row.responsibleEmail);
    const key = email || "__unassigned__";
    const label = email
      ? nameByEmail.get(email) || email
      : "A DEFINIR";
    const current = buckets.get(key) ?? {
      key,
      label,
      total: 0,
      primeiroVisto: 0,
      renovacao: 0,
    };
    current.total += 1;
    if (hasService(row, "primeiro_visto")) {
      current.primeiroVisto += 1;
    }
    if (hasService(row, "renovacao")) {
      current.renovacao += 1;
    }
    buckets.set(key, current);
  }

  return Array.from(buckets.values()).sort((a, b) => b.total - a.total);
}

export const gestaoEstatisticaRouter = router({
  getDashboard: acompanhamentoStaffProcedure.query(async ({ ctx }) => {
    const sheet = await listAcompanhamentoSheet();
    const isAdmin = isFullAdmin(ctx.staff.role, ctx.staff.email);
    const staffEmail = normalizeEmail(ctx.staff.email);

    const scopedRows = isAdmin
      ? sheet.rows
      : sheet.rows.filter((row) => {
          const responsible = normalizeEmail(row.responsibleEmail);
          return !responsible || responsible === staffEmail;
        });

    const activeRows = scopedRows.filter(isActiveRow);
    const primeiroVistoRows = activeRows.filter((row) => hasService(row, "primeiro_visto"));
    const renovacaoRows = activeRows.filter((row) => hasService(row, "renovacao"));
    const passaporteRows = activeRows.filter((row) => hasService(row, "passaporte"));
    const estaRows = activeRows.filter((row) => hasService(row, "esta"));

    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "COLLABORATOR"] } },
      select: { name: true, email: true },
    });
    const nameByEmail = new Map(
      staffUsers.map((user) => [normalizeEmail(user.email), user.name]),
    );

    const byResponsible = isAdmin
      ? buildByResponsible(activeRows, nameByEmail)
      : buildByResponsible(activeRows, nameByEmail).filter(
          (item) => item.key === "__unassigned__" || item.key === staffEmail,
        );

    const arquivados = await prisma.arquivadoClient.findMany({
      where: {
        category: { in: ["american_visa", "renovacao"] },
      },
      select: { status: true, category: true },
      take: 8000,
    });

    let aprovados = 0;
    let negados = 0;
    let procAdm = 0;
    for (const row of arquivados) {
      const status = row.status.trim().toUpperCase();
      if (status.includes("APROV")) {
        aprovados += 1;
      } else if (status.includes("NEGAD")) {
        negados += 1;
      } else if (status.includes("PROC") || status.includes("ADM")) {
        procAdm += 1;
      }
    }

    // Fallback: status do Profile americano finalizado/reprovado
    if (aprovados + negados === 0) {
      const [approved, disapproved] = await Promise.all([
        prisma.profile.count({
          where: {
            category: Category.american_visa,
            visaStatus: { in: [VisaStatus.approved, VisaStatus.finished] },
          },
        }),
        prisma.profile.count({
          where: { category: Category.american_visa, visaStatus: VisaStatus.disapproved },
        }),
      ]);
      aprovados = approved;
      negados = disapproved;
    }

    const taxaAprovacao =
      aprovados + negados > 0 ? aprovados / (aprovados + negados) : 0;

    const adminPoolActive = activeRows.filter((row) => {
      const responsible = normalizeEmail(row.responsibleEmail);
      return !responsible || isFinanceAdminEmail(responsible);
    });

    return {
      scope: isAdmin ? ("admin" as const) : ("collaborator" as const),
      generatedAt: new Date().toISOString(),
      ativos: {
        total: activeRows.length,
        primeiroVisto: primeiroVistoRows.length,
        renovacao: renovacaoRows.length,
        passaporte: passaporteRows.length,
        esta: estaRows.length,
        finalizados: scopedRows.filter((row) => !isActiveRow(row)).length,
        semResponsavel: activeRows.filter((row) => !normalizeEmail(row.responsibleEmail)).length,
        poolAdmins: isAdmin ? adminPoolActive.length : null,
      },
      alertas: {
        casv7: countInWindow(activeRows, "casv", 7),
        casv30: countInWindow(activeRows, "casv", 30),
        semCasv: activeRows.filter((row) => isUnscheduledCasv(row.casv)).length,
        taxaNaoPaga: activeRows.filter((row) => isTaxUnpaid(row)).length,
        formPendente: activeRows.filter((row) => isFormPending(row)).length,
        casv2Primeiro: countInWindow(primeiroVistoRows, "casv", 1),
        entrevista2: countInWindow(primeiroVistoRows, "interview", 1),
        entrevista3: countInWindow(primeiroVistoRows, "interview", 2),
        entrevista7: countInWindow(primeiroVistoRows, "interview", 6),
        entrevista14: countInWindow(primeiroVistoRows, "interview", 13),
        casv2Renovacao: countInWindow(renovacaoRows, "casv", 1),
        casv7Renovacao: countInWindow(renovacaoRows, "casv", 6),
        casv14Renovacao: countInWindow(renovacaoRows, "casv", 13),
      },
      byResponsible,
      historico: {
        aprovados,
        negados,
        taxaAprovacao,
        processoAdministrativo: procAdm,
      },
    };
  }),
});
