import { z } from "zod";
import { BudgetPaid, Role } from "@prisma/client";

import prisma from "@/lib/prisma";
import { tripPriorityFromDate } from "@/lib/trip-priority";
import { financeAdminProcedure, router } from "../trpc";

function sumServiceValues(row: {
  renovacao: number | null;
  primeiroVisto: number | null;
  reuniaoPaga: number | null;
  monitoramento: number | null;
  passaporte: number | null;
  outros: number | null;
}) {
  return (
    (row.renovacao ?? 0) +
    (row.primeiroVisto ?? 0) +
    (row.reuniaoPaga ?? 0) +
    (row.monitoramento ?? 0) +
    (row.passaporte ?? 0) +
    (row.outros ?? 0)
  );
}

export async function syncFinanceFromServiceCost(userId: string) {
  const serviceCost = await prisma.serviceCost.findUnique({
    where: { userId },
  });

  if (!serviceCost) return null;

  const total = sumServiceValues(serviceCost);
  const hasAmount = total > 0;
  const financeStatus = hasAmount ? BudgetPaid.paid : BudgetPaid.pending;

  const existingFinance = await prisma.financeEntry.findUnique({
    where: { userId },
  });

  if (existingFinance) {
    await prisma.financeEntry.update({
      where: { id: existingFinance.id },
      data: {
        amount: hasAmount ? total : null,
        status: financeStatus,
        paidAt: hasAmount
          ? existingFinance.paidAt ?? new Date()
          : null,
      },
    });
  } else {
    await prisma.financeEntry.create({
      data: {
        userId,
        amount: hasAmount ? total : null,
        status: financeStatus,
        paidAt: hasAmount ? new Date() : null,
      },
    });
  }

  return {
    total,
    financeStatus,
    situacao: tripPriorityFromDate(serviceCost.validadeDate),
  };
}

async function ensureServiceAndFinanceRows() {
  const clients = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    select: { id: true, createdAt: true },
  });

  const [serviceCosts, financeEntries] = await Promise.all([
    prisma.serviceCost.findMany({ select: { userId: true } }),
    prisma.financeEntry.findMany({ select: { userId: true } }),
  ]);

  const serviceIds = new Set(serviceCosts.map((row) => row.userId));
  const financeIds = new Set(financeEntries.map((row) => row.userId));

  await Promise.all(
    clients.map(async (client) => {
      if (!serviceIds.has(client.id)) {
        await prisma.serviceCost.create({
          data: {
            userId: client.id,
            createdAt: client.createdAt,
          },
        });
      }

      if (!financeIds.has(client.id)) {
        await prisma.financeEntry.create({
          data: {
            userId: client.id,
            amount: null,
            status: BudgetPaid.pending,
            createdAt: client.createdAt,
          },
        });
      }
    }),
  );
}

const optionalAmount = z
  .number()
  .nonnegative()
  .nullable()
  .optional();

export const serviceCostRouter = router({
  getRows: financeAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      await ensureServiceAndFinanceRows();

      const rows = await prisma.serviceCost.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

      const searchLower = input.search?.trim().toLowerCase();
      const filtered = searchLower
        ? rows.filter((row) =>
            row.user.name.toLowerCase().includes(searchLower),
          )
        : rows;

      const sorted = [...filtered].sort(
        (a, b) => b.user.createdAt.getTime() - a.user.createdAt.getTime(),
      );

      return {
        rows: sorted.map((row) => {
          const total = sumServiceValues(row);
          return {
            id: row.id,
            userId: row.userId,
            clientName: row.user.name,
            clientEmail: row.user.email,
            renovacao: row.renovacao,
            primeiroVisto: row.primeiroVisto,
            reuniaoPaga: row.reuniaoPaga,
            monitoramento: row.monitoramento,
            passaporte: row.passaporte,
            outros: row.outros,
            outrosComment: row.outrosComment,
            validadeDate: row.validadeDate,
            situacao: tripPriorityFromDate(row.validadeDate),
            total,
          };
        }),
      };
    }),

  updateRow: financeAdminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        renovacao: optionalAmount,
        primeiroVisto: optionalAmount,
        reuniaoPaga: optionalAmount,
        monitoramento: optionalAmount,
        passaporte: optionalAmount,
        outros: optionalAmount,
        outrosComment: z.string().max(500).nullable().optional(),
        validadeDate: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, outrosComment, ...rest } = input;

      const updated = await prisma.serviceCost.update({
        where: { id },
        data: {
          ...rest,
          ...(outrosComment !== undefined
            ? {
                outrosComment: outrosComment?.trim()
                  ? outrosComment.trim()
                  : null,
              }
            : {}),
        },
      });

      const sync = await syncFinanceFromServiceCost(updated.userId);

      return {
        row: updated,
        total: sync?.total ?? 0,
        situacao:
          sync?.situacao ?? tripPriorityFromDate(updated.validadeDate),
      };
    }),

  createExpense: financeAdminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome obrigatório"),
        description: z.string().min(1, "Descrição obrigatória"),
        amount: z.number().positive("Valor deve ser maior que zero"),
      }),
    )
    .mutation(async ({ input }) => {
      const expense = await prisma.financeExpense.create({
        data: {
          name: input.name.trim(),
          description: input.description.trim(),
          amount: input.amount,
          paidAt: new Date(),
        },
      });

      return { expense };
    }),

  deleteExpense: financeAdminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await prisma.financeExpense.delete({
        where: { id: input.id },
      });

      return {};
    }),
});
