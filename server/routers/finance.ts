import { z } from "zod";
import { BudgetPaid, Role } from "@prisma/client";

import prisma from "@/lib/prisma";
import { financeAdminProcedure, router } from "../trpc";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function monthRange(yearMonth: string) {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

async function sumPaidBetween(start: Date, end: Date) {
  const entries = await prisma.financeEntry.findMany({
    where: {
      status: BudgetPaid.paid,
      amount: { not: null },
      paidAt: {
        gte: start,
        lte: end,
      },
    },
    select: { amount: true },
  });

  return entries.reduce((acc, entry) => acc + (entry.amount ?? 0), 0);
}

async function ensureFinanceEntriesForClients() {
  const existingEntries = await prisma.financeEntry.findMany({
    select: { userId: true },
  });
  const existingUserIds = new Set(existingEntries.map((entry) => entry.userId));

  const clients = await prisma.user.findMany({
    where: {
      role: Role.CLIENT,
    },
    select: {
      id: true,
      budget: true,
      budgetPaid: true,
      createdAt: true,
    },
  });

  const clientsWithoutEntry = clients.filter(
    (client) => !existingUserIds.has(client.id),
  );

  if (clientsWithoutEntry.length === 0) return;

  await Promise.all(
    clientsWithoutEntry.map((client) => {
      const hasPaidAmount =
        client.budgetPaid === BudgetPaid.paid &&
        typeof client.budget === "number" &&
        client.budget > 0;

      return prisma.financeEntry.create({
        data: {
          userId: client.id,
          amount: hasPaidAmount ? client.budget : null,
          status: hasPaidAmount ? BudgetPaid.paid : BudgetPaid.pending,
          paidAt: hasPaidAmount ? client.createdAt : null,
          createdAt: client.createdAt,
        },
      });
    }),
  );
}

export const financeRouter = router({
  getSummary: financeAdminProcedure
    .input(
      z.object({
        yearMonth: z
          .string()
          .regex(/^\d{4}-\d{2}$/, "Mês inválido")
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      await ensureFinanceEntriesForClients();

      const now = new Date();
      const selectedMonth =
        input.yearMonth ??
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { start: monthStart, end: monthEnd } = monthRange(selectedMonth);

      const last30Start = startOfDay(
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      );
      const last6MonthsStart = startOfDay(
        new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      );
      const lastYearStart = startOfDay(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      );

      const [monthTotal, last30Days, last6Months, lastYear, allTime] =
        await Promise.all([
          sumPaidBetween(monthStart, monthEnd),
          sumPaidBetween(last30Start, endOfDay(now)),
          sumPaidBetween(last6MonthsStart, endOfDay(now)),
          sumPaidBetween(lastYearStart, endOfDay(now)),
          prisma.financeEntry
            .findMany({
              where: {
                status: BudgetPaid.paid,
                amount: { not: null },
              },
              select: { amount: true },
            })
            .then((entries) =>
              entries.reduce((acc, entry) => acc + (entry.amount ?? 0), 0),
            ),
        ]);

      return {
        selectedMonth,
        monthTotal,
        last30Days,
        last6Months,
        lastYear,
        allTime,
      };
    }),

  getChecklist: financeAdminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        yearMonth: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional()
          .nullable(),
        sort: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ input }) => {
      await ensureFinanceEntriesForClients();

      const search = input.search?.trim();
      const dateFilter = input.yearMonth
        ? (() => {
            const { start, end } = monthRange(input.yearMonth!);
            return { gte: start, lte: end };
          })()
        : undefined;

      const entries = await prisma.financeEntry.findMany({
        where: {
          user: {
            role: Role.CLIENT,
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
        },
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

      const searchLower = search?.toLowerCase();

      const filtered = searchLower
        ? entries.filter((entry) =>
            entry.user.name.toLowerCase().includes(searchLower),
          )
        : entries;

      const sorted = [...filtered].sort((a, b) => {
        const diff =
          a.user.createdAt.getTime() - b.user.createdAt.getTime();
        return input.sort === "asc" ? diff : -diff;
      });

      return {
        entries: sorted.map((entry) => ({
          id: entry.id,
          amount: entry.amount,
          status: entry.status,
          paidAt: entry.paidAt,
          userId: entry.userId,
          name: entry.user.name,
          email: entry.user.email,
          registeredAt: entry.user.createdAt,
        })),
      };
    }),

  updateAmount: financeAdminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        amount: z.number().nonnegative().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const hasAmount = input.amount !== null && input.amount > 0;

      const entry = await prisma.financeEntry.update({
        where: { id: input.id },
        data: {
          amount: hasAmount ? input.amount : null,
          status: hasAmount ? BudgetPaid.paid : BudgetPaid.pending,
          paidAt: hasAmount ? new Date() : null,
        },
      });

      return { entry };
    }),
});
