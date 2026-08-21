import { z } from "zod";
import { BudgetPaid, Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import prisma from "@/lib/prisma";
import { financeAdminProcedure, router } from "../trpc";
import { removeClientFromFinance } from "./service-cost";
import { syncExcelClientsForOperations } from "@/server/acompanhamento-sheet";
import {
  purgePre2026FinanceExceptIsadora,
  sortGroupedByRecency,
} from "@/server/finance-ops";

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

async function sumReceiptsBetween(start: Date, end: Date) {
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

async function sumExpensesBetween(start?: Date, end?: Date) {
  const expenses = await prisma.financeExpense.findMany({
    where:
      start && end
        ? {
            paidAt: {
              gte: start,
              lte: end,
            },
          }
        : undefined,
    select: { amount: true },
  });

  return expenses.reduce((acc, expense) => acc + expense.amount, 0);
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
      const now = new Date();
      const selectedMonth =
        input.yearMonth ??
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { start: monthStart, end: monthEnd } = monthRange(selectedMonth);

      const last6MonthsStart = startOfDay(
        new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
      );
      const lastYearStart = startOfDay(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      );

      const [
        monthTotal,
        last6Months,
        lastYear,
        allTime,
        monthExpenses,
        allTimeExpenses,
      ] = await Promise.all([
        sumReceiptsBetween(monthStart, monthEnd),
        sumReceiptsBetween(last6MonthsStart, endOfDay(now)),
        sumReceiptsBetween(lastYearStart, endOfDay(now)),
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
        sumExpensesBetween(monthStart, monthEnd),
        sumExpensesBetween(),
      ]);

      return {
        selectedMonth,
        monthTotal,
        last6Months,
        lastYear,
        allTime,
        monthExpenses,
        allTimeExpenses,
        netMonth: monthTotal - monthExpenses,
        netAllTime: allTime - allTimeExpenses,
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
      const pendingSync = await syncExcelClientsForOperations();
      await purgePre2026FinanceExceptIsadora();

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
              group: true,
              payerUserId: true,
            },
          },
        },
      });

      const searchLower = search?.toLowerCase();

      const filtered = searchLower
        ? entries.filter(
            (entry) =>
              entry.user.name.toLowerCase().includes(searchLower) ||
              (entry.user.group ?? "").toLowerCase().includes(searchLower),
          )
        : entries;

      const sorted = sortGroupedByRecency(filtered, (entry) => entry.user, input.sort);

      return {
        pendingSync,
        entries: sorted.map((entry) => {
          const isDependent = Boolean(entry.user.payerUserId);
          return {
            id: entry.id,
            amount: isDependent ? null : entry.amount,
            status: entry.status,
            paidAt: entry.paidAt,
            userId: entry.userId,
            name: entry.user.name,
            email: entry.user.email,
            groupName: entry.user.group,
            isDependent,
            registeredAt: entry.user.createdAt,
          };
        }),
      };
    }),

  getExpenses: financeAdminProcedure
    .input(
      z
        .object({
          yearMonth: z
            .string()
            .regex(/^\d{4}-\d{2}$/)
            .optional()
            .nullable(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const yearMonth = input?.yearMonth;
      const dateFilter = yearMonth
        ? (() => {
            const { start, end } = monthRange(yearMonth);
            return { gte: start, lte: end };
          })()
        : undefined;

      const expenses = await prisma.financeExpense.findMany({
        where: dateFilter ? { paidAt: dateFilter } : undefined,
        orderBy: { paidAt: "desc" },
      });

      return { expenses };
    }),

  updateAmount: financeAdminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        amount: z.number().nonnegative().nullable(),
      }),
    )
    .mutation(async () => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Valores do financeiro são definidos em Serviços e Custos",
      });
    }),

  createExpense: financeAdminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome obrigatório"),
        description: z.string().min(1, "Descrição obrigatória"),
        amount: z.number().positive("Valor deve ser maior que zero"),
        paidAt: z.date().optional(),
      }),
    )
    .mutation(async () => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Pagamentos devem ser lançados em Serviços e Custos",
      });
    }),

  deleteExpense: financeAdminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await prisma.financeExpense.delete({
        where: { id: input.id },
      });

      return { message: "Pagamento excluído." };
    }),

  deleteReceipt: financeAdminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const entry = await prisma.financeEntry.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Linha não encontrada",
        });
      }

      return removeClientFromFinance(entry.userId);
    }),
});
