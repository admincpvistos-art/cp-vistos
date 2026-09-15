import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";

import { acompanhamentoStaffProcedure, router } from "../trpc";
import prisma from "@/lib/prisma";
import {
  archiveAcompanhamentoClient,
  createAcompanhamentoRecord,
  getAcompanhamentoRecord,
  listAcompanhamentoSheet,
  removeAcompanhamentoClient,
  updateAcompanhamentoRecord,
  updateAcompanhamentoSheetComment,
} from "@/server/acompanhamento-sheet";
import {
  ACOMPANHAMENTO_SERVICE_OPTIONS,
  type AcompanhamentoRecord,
} from "@/lib/acompanhamento-types";
import {
  canArchiveAcompanhamento,
  canAssignAcompanhamentoResponsible,
  canOnlySeeAssignedAcompanhamento,
  isFinanceAdminEmail,
  isFullAdmin,
  normalizeEmail,
} from "@/lib/staff-access";

const serviceValues = ACOMPANHAMENTO_SERVICE_OPTIONS.map((option) => option.value) as [
  (typeof ACOMPANHAMENTO_SERVICE_OPTIONS)[number]["value"],
  ...(typeof ACOMPANHAMENTO_SERVICE_OPTIONS)[number]["value"][],
];

const accountFieldsSchema = z.object({
  cpf: z.string(),
  address: z.string(),
  cel: z.string(),
  email: z.string(),
  password: z.string(),
  passwordConfirm: z.string(),
  emailScheduleAccount: z.string(),
  passwordScheduleAccount: z.string(),
  passwordConfirmScheduleAccount: z.string(),
  budget: z.string(),
  budgetPaid: z.enum(["", "Pago", "Pendente"]),
  scheduleAccount: z.enum(["", "Ativado", "Inativo"]),
});

const rowFieldsSchema = z.object({
  name: z.string(),
  barcode: z.string(),
  barcodeIssued: z.string(),
  casv: z.string(),
  interview: z.string(),
  meeting: z.string(),
  shipping: z.string(),
  tipo: z.string(),
  resp: z.string(),
  tax: z.string(),
  ds160: z.string(),
  alimto: z.string(),
  obs: z.string(),
  dob: z.string(),
  passport: z.string(),
  account: z.string(),
  email: z.string(),
  phone: z.string(),
  entryDate: z.string(),
  group: z.string(),
  pagto: z.string(),
  status: z.string(),
  barcodeDone: z.boolean(),
  sheetComment: z.string(),
  services: z.array(z.enum(serviceValues)),
  accountFields: accountFieldsSchema.nullable().optional(),
  responsibleEmail: z.string().nullable().optional(),
});

const updateSchema = rowFieldsSchema.extend({
  id: z.string().min(1),
});

function assertCanAccessRow(
  row: AcompanhamentoRecord | null | undefined,
  staff: { role?: string | null; email?: string | null },
) {
  if (!row) {
    return;
  }
  if (!canOnlySeeAssignedAcompanhamento(staff.role, staff.email)) {
    return;
  }

  const responsible = normalizeEmail(row.responsibleEmail);
  // Sem responsável: disponível para qualquer colaborador com acesso.
  if (!responsible) {
    return;
  }

  if (responsible !== normalizeEmail(staff.email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cliente fora da sua responsabilidade",
    });
  }
}

function collaboratorCanSeeRow(row: AcompanhamentoRecord, staffEmail: string) {
  const responsible = normalizeEmail(row.responsibleEmail);
  return !responsible || responsible === staffEmail;
}

/** Pool estatístico dos admins: sem responsável ou designado a admin@ / cpassessoriavistos@. */
function isInSharedAdminStatsPool(row: AcompanhamentoRecord) {
  const responsible = normalizeEmail(row.responsibleEmail);
  if (!responsible) {
    return true;
  }
  return isFinanceAdminEmail(responsible);
}

function buildSheetStats(rows: AcompanhamentoRecord[]) {
  let primeiroVisto = 0;
  let passaporte = 0;
  let esta = 0;
  let totalPago = 0;

  for (const row of rows) {
    if (row.services.includes("primeiro_visto")) {
      primeiroVisto += 1;
    }
    if (row.services.includes("passaporte")) {
      passaporte += 1;
    }
    if (row.services.includes("esta")) {
      esta += 1;
    }

    if (row.accountFields?.budgetPaid === "Pago") {
      totalPago += 1;
    }
  }

  return {
    totalClientes: rows.length,
    primeiroVisto,
    passaporte,
    esta,
    totalPago,
  };
}

export const acompanhamentoRouter = router({
  getClientesSheet: acompanhamentoStaffProcedure.query(async ({ ctx }) => {
    const sheet = await listAcompanhamentoSheet();

    if (!sheet.headers.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Planilha de acompanhamento não encontrada",
      });
    }

    const restrict = canOnlySeeAssignedAcompanhamento(ctx.staff.role, ctx.staff.email);
    const isAdmin = isFullAdmin(ctx.staff.role, ctx.staff.email);
    const staffEmail = normalizeEmail(ctx.staff.email);
    const rows = restrict
      ? sheet.rows.filter((row) => collaboratorCanSeeRow(row, staffEmail))
      : sheet.rows;

    const statsRows = restrict
      ? rows
      : isAdmin
        ? sheet.rows.filter((row) => isInSharedAdminStatsPool(row))
        : [];

    return {
      ...sheet,
      rows,
      stats:
        restrict || isAdmin
          ? {
              ...buildSheetStats(statsRows),
              scope: restrict ? ("collaborator" as const) : ("admin_shared" as const),
            }
          : null,
    };
  }),
  getRow: acompanhamentoStaffProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const row = await getAcompanhamentoRecord(input.id);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado no cadastro",
        });
      }

      assertCanAccessRow(row, ctx.staff);

      return { row };
    }),

  listAssignees: acompanhamentoStaffProcedure.query(async () => {
    const users = await prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.COLLABORATOR] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });

    return {
      assignees: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })),
    };
  }),

  createRow: acompanhamentoStaffProcedure.input(rowFieldsSchema).mutation(async ({ input, ctx }) => {
    if (!input.name.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Informe o nome do cliente",
      });
    }

    const canAssign = canAssignAcompanhamentoResponsible(ctx.staff.role, ctx.staff.email);
    const staffEmail = normalizeEmail(ctx.staff.email);
    const responsibleEmail = canAssign
      ? input.responsibleEmail?.trim().toLowerCase() || null
      : staffEmail || null;

    try {
      const row = await createAcompanhamentoRecord({
        ...input,
        responsibleEmail,
        createdByEmail: ctx.staff.email,
      });
      return { row };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Não foi possível criar o cliente",
      });
    }
  }),
  updateRow: acompanhamentoStaffProcedure.input(updateSchema).mutation(async ({ input, ctx }) => {
    try {
      const existing = await getAcompanhamentoRecord(input.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado no cadastro",
        });
      }

      assertCanAccessRow(existing, ctx.staff);

      const canAssign = canAssignAcompanhamentoResponsible(ctx.staff.role, ctx.staff.email);
      const nextResponsible = input.responsibleEmail?.trim().toLowerCase() || null;
      const prevResponsible = existing.responsibleEmail?.trim().toLowerCase() || null;

      if (!canAssign && nextResponsible !== prevResponsible) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Somente administrador pode alterar o responsável",
        });
      }

      const row = await updateAcompanhamentoRecord({
        ...input,
        responsibleEmail: canAssign ? nextResponsible : prevResponsible,
      });

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado no cadastro",
        });
      }

      return { row };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error instanceof Error ? error.message : "Não foi possível salvar",
      });
    }
  }),
  updateComment: acompanhamentoStaffProcedure
    .input(
      z.object({
        id: z.string().min(1),
        sheetComment: z.string().max(500),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const existing = await getAcompanhamentoRecord(input.id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cliente não encontrado no cadastro",
          });
        }
        assertCanAccessRow(existing, ctx.staff);

        const row = await updateAcompanhamentoSheetComment(input.id, input.sheetComment);
        if (!row) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cliente não encontrado no cadastro",
          });
        }
        return { row };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Não foi possível salvar o comentário",
        });
      }
    }),
  archiveRow: acompanhamentoStaffProcedure
    .input(
      z.object({
        id: z.string().min(1),
        services: z.array(z.enum(serviceValues)).min(1, "Marque ao menos um serviço"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!canArchiveAcompanhamento(ctx.staff.role, ctx.staff.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sua conta não pode arquivar clientes",
        });
      }

      try {
        const result = await archiveAcompanhamentoClient(input.id, input.services ?? []);
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cliente não encontrado no cadastro",
          });
        }
        if (!result.categories.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nenhuma aba de Arquivados foi definida para este cliente",
          });
        }
        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[acompanhamento] archiveRow failed", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Não foi possível arquivar o cliente",
        });
      }
    }),

  /** Exclui só do Acompanhamento — sem Arquivados/Prospects; Financeiro permanece. */
  deleteRow: acompanhamentoStaffProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (!canArchiveAcompanhamento(ctx.staff.role, ctx.staff.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sua conta não pode excluir clientes",
        });
      }

      try {
        const result = await removeAcompanhamentoClient(input.id);
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cliente não encontrado no cadastro",
          });
        }
        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[acompanhamento] deleteRow failed", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Não foi possível excluir o cliente",
        });
      }
    }),

  listInterviewDocs: acompanhamentoStaffProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const docs = await prisma.interviewDocument.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          createdAt: true,
        },
      });
      return { docs };
    }),

  registerInterviewDoc: acompanhamentoStaffProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        fileName: z.string().min(1),
        fileUrl: z.string().min(1),
        fileKey: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const client = await prisma.user.findFirst({
        where: { id: input.userId },
        select: { id: true },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        });
      }

      try {
        const doc = await prisma.interviewDocument.create({
          data: {
            userId: input.userId,
            fileName: input.fileName,
            fileUrl: input.fileUrl,
            fileKey: input.fileKey,
            uploadedById: ctx.staff.id,
          },
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            createdAt: true,
          },
        });
        return { doc };
      } catch (error) {
        console.error("[interview-doc] register failed", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível salvar o documento no banco",
        });
      }
    }),

  deleteInterviewDoc: acompanhamentoStaffProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const doc = await prisma.interviewDocument.findUnique({
        where: { id: input.id },
        select: { id: true, fileKey: true, userId: true },
      });

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Documento não encontrado",
        });
      }

      await prisma.interviewDocument.delete({ where: { id: doc.id } });

      if (doc.fileKey && !doc.fileKey.startsWith("inline:")) {
        const { UTApi } = await import("uploadthing/server");
        const utapi = new UTApi({
          token: process.env.UPLOADTHING_TOKEN,
        });
        utapi.deleteFiles(doc.fileKey).catch((error) => {
          console.error("[interview-doc] falha ao apagar arquivo", error);
        });
      }

      return { ok: true as const, userId: doc.userId };
    }),
});
