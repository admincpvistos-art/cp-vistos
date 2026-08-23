import { z } from "zod";
import { BudgetPaid, PaymentStatus, Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import prisma from "@/lib/prisma";
import { tripPriorityFromDate } from "@/lib/trip-priority";
import { financeAdminProcedure, router } from "../trpc";
import {
  getOperationsSyncStatus,
  OPERATIONS_SYNC_PAUSED,
} from "@/server/acompanhamento-sheet";
import {
  createManualOperationsClient,
  getOperationsClientIds,
  purgeFinanceOutsideAcompanhamento,
  sortGroupedByRecency,
} from "@/server/finance-ops";

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

async function applyFinanceStatus(params: {
  userId: string;
  amount: number | null;
  status: BudgetPaid;
  paidAt: Date | null;
}) {
  const existingFinance = await prisma.financeEntry.findUnique({
    where: { userId: params.userId },
  });

  if (existingFinance) {
    await prisma.financeEntry.update({
      where: { id: existingFinance.id },
      data: {
        amount: params.amount,
        status: params.status,
        paidAt: params.paidAt,
      },
    });
  } else {
    await prisma.financeEntry.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        status: params.status,
        paidAt: params.paidAt,
      },
    });
  }

  await prisma.profile.updateMany({
    where: { userId: params.userId },
    data: {
      paymentStatus:
        params.status === BudgetPaid.paid
          ? PaymentStatus.paid
          : PaymentStatus.pending,
    },
  });
}

export async function syncFinanceFromServiceCost(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, payerUserId: true },
  });

  if (!user) return null;

  const titularId = user.payerUserId ?? user.id;
  const serviceCost = await prisma.serviceCost.findUnique({
    where: { userId: titularId },
  });

  if (!serviceCost) return null;

  const total = sumServiceValues(serviceCost);
  const hasAmount = total > 0;
  const financeStatus = hasAmount ? BudgetPaid.paid : BudgetPaid.pending;
  const existingTitularFinance = await prisma.financeEntry.findUnique({
    where: { userId: titularId },
  });
  const paidAt = hasAmount
    ? existingTitularFinance?.paidAt ?? new Date()
    : null;

  await applyFinanceStatus({
    userId: titularId,
    amount: hasAmount ? total : null,
    status: financeStatus,
    paidAt,
  });

  const dependents = await prisma.user.findMany({
    where: { payerUserId: titularId },
    select: { id: true },
  });

  await Promise.all(
    dependents.map((dependent) =>
      applyFinanceStatus({
        userId: dependent.id,
        amount: null,
        status: financeStatus,
        paidAt,
      }),
    ),
  );

  return {
    total,
    financeStatus,
    situacao: tripPriorityFromDate(serviceCost.validadeDate),
  };
}

export async function removeClientFromFinance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      payerUserId: true,
      name: true,
    },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Cliente não encontrado",
    });
  }

  const ids = [user.id];

  if (!user.payerUserId) {
    const dependents = await prisma.user.findMany({
      where: { payerUserId: user.id },
      select: { id: true },
    });
    ids.push(...dependents.map((dependent) => dependent.id));
  }

  await prisma.financeEntry.deleteMany({
    where: { userId: { in: ids } },
  });
  await prisma.serviceCost.deleteMany({
    where: { userId: { in: ids } },
  });

  return {
    message: user.payerUserId
      ? "Linha do dependente excluída."
      : "Compra cancelada. A linha saiu do Financeiro e de Serviços e Custos.",
  };
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
      if (OPERATIONS_SYNC_PAUSED) {
        const rows = await prisma.serviceCost.findMany({
          where: { user: { role: Role.CLIENT } },
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

        const searchLower = input.search?.trim().toLowerCase();
        const filtered = searchLower
          ? rows.filter(
              (row) =>
                row.user.name.toLowerCase().includes(searchLower) ||
                (row.user.group ?? "").toLowerCase().includes(searchLower),
            )
          : rows;

        const sorted = sortGroupedByRecency(filtered, (row) => row.user, "desc");

        return {
          pendingSync: 0,
          totalImported: 0,
          linkedUsers: sorted.length,
          rows: sorted.map((row) => {
            const isDependent = Boolean(row.user.payerUserId);
            const total = isDependent ? 0 : sumServiceValues(row);
            return {
              id: row.id,
              userId: row.userId,
              clientName: row.user.name,
              clientEmail: row.user.email,
              groupName: row.user.group,
              isDependent,
              renovacao: isDependent ? null : row.renovacao,
              primeiroVisto: isDependent ? null : row.primeiroVisto,
              reuniaoPaga: isDependent ? null : row.reuniaoPaga,
              monitoramento: isDependent ? null : row.monitoramento,
              passaporte: isDependent ? null : row.passaporte,
              outros: isDependent ? null : row.outros,
              outrosComment: isDependent ? null : row.outrosComment,
              validadeDate: row.validadeDate,
              situacao: tripPriorityFromDate(row.validadeDate),
              total,
            };
          }),
        };
      }

      const sync = await getOperationsSyncStatus();
      if (sync.pendingSync === 0) {
        await purgeFinanceOutsideAcompanhamento();
      }
      const keepIds = await getOperationsClientIds();
      const keepList = Array.from(keepIds);

      const rowChunks =
        keepList.length === 0
          ? []
          : await Promise.all(
              Array.from({ length: Math.ceil(keepList.length / 80) }, (_, index) => {
                const slice = keepList.slice(index * 80, index * 80 + 80);
                return prisma.serviceCost.findMany({
                  where: { userId: { in: slice } },
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
              }),
            );
      const rows = rowChunks.flat();

      const searchLower = input.search?.trim().toLowerCase();
      const filtered = searchLower
        ? rows.filter(
            (row) =>
              row.user.name.toLowerCase().includes(searchLower) ||
              (row.user.group ?? "").toLowerCase().includes(searchLower),
          )
        : rows;

      const sorted = sortGroupedByRecency(filtered, (row) => row.user, "desc");

      return {
        pendingSync: sync.pendingSync,
        totalImported: sync.totalImported,
        linkedUsers: sync.linkedUsers,
        rows: sorted.map((row) => {
          const isDependent = Boolean(row.user.payerUserId);
          const total = isDependent ? 0 : sumServiceValues(row);
          return {
            id: row.id,
            userId: row.userId,
            clientName: row.user.name,
            clientEmail: row.user.email,
            groupName: row.user.group,
            isDependent,
            renovacao: isDependent ? null : row.renovacao,
            primeiroVisto: isDependent ? null : row.primeiroVisto,
            reuniaoPaga: isDependent ? null : row.reuniaoPaga,
            monitoramento: isDependent ? null : row.monitoramento,
            passaporte: isDependent ? null : row.passaporte,
            outros: isDependent ? null : row.outros,
            outrosComment: isDependent ? null : row.outrosComment,
            validadeDate: row.validadeDate,
            situacao: tripPriorityFromDate(row.validadeDate),
            total,
          };
        }),
      };
    }),

  /** Inclui cliente na planilha de serviços e replica no checklist Financeiro. */
  includeClient: financeAdminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Informe o nome"),
        email: z.string().email().optional().or(z.literal("")),
        group: z.string().optional(),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const user = await createManualOperationsClient({
          name: input.name,
          email: input.email || undefined,
          group: input.group,
          phone: input.phone,
        });
        return { userId: user.id, name: user.name, email: user.email };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível incluir o cliente",
        });
      }
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

      const current = await prisma.serviceCost.findUnique({
        where: { id },
        include: {
          user: { select: { payerUserId: true } },
        },
      });

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Linha não encontrada",
        });
      }

      const isDependent = Boolean(current.user.payerUserId);
      const amountKeys = [
        "renovacao",
        "primeiroVisto",
        "reuniaoPaga",
        "monitoramento",
        "passaporte",
        "outros",
      ] as const;
      const tryingAmount =
        outrosComment !== undefined ||
        amountKeys.some((key) => rest[key] !== undefined);

      if (isDependent && tryingAmount) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Valores do grupo são preenchidos apenas no titular",
        });
      }

      const updated = await prisma.serviceCost.update({
        where: { id },
        data: isDependent
          ? { validadeDate: rest.validadeDate }
          : {
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

      return { message: "Pagamento excluído." };
    }),

  deleteRow: financeAdminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const row = await prisma.serviceCost.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Linha não encontrada",
        });
      }

      return removeClientFromFinance(row.userId);
    }),
});
