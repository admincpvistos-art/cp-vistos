import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { acompanhamentoStaffProcedure, router } from "../trpc";
import prisma from "@/lib/prisma";
import {
  archiveAcompanhamentoClient,
  createAcompanhamentoRecord,
  getAcompanhamentoRecord,
  listAcompanhamentoSheet,
  updateAcompanhamentoRecord,
  updateAcompanhamentoSheetComment,
} from "@/server/acompanhamento-sheet";
import { ACOMPANHAMENTO_SERVICE_OPTIONS } from "@/lib/acompanhamento-types";
import { canArchiveAcompanhamento } from "@/lib/staff-access";

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
});

const updateSchema = rowFieldsSchema.extend({
  id: z.string().min(1),
});

export const acompanhamentoRouter = router({
  getClientesSheet: acompanhamentoStaffProcedure.query(async () => {
    const sheet = await listAcompanhamentoSheet();

    if (!sheet.headers.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Planilha de acompanhamento não encontrada",
      });
    }

    return sheet;
  }),
  getRow: acompanhamentoStaffProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const row = await getAcompanhamentoRecord(input.id);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado no cadastro",
        });
      }

      return { row };
    }),
  createRow: acompanhamentoStaffProcedure.input(rowFieldsSchema).mutation(async ({ input }) => {
    if (!input.name.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Informe o nome do cliente",
      });
    }

    try {
      const row = await createAcompanhamentoRecord(input);
      return { row };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Não foi possível criar o cliente",
      });
    }
  }),
  updateRow: acompanhamentoStaffProcedure.input(updateSchema).mutation(async ({ input }) => {
    try {
      const row = await updateAcompanhamentoRecord(input);

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
    .mutation(async ({ input }) => {
      try {
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
        services: z.array(z.enum(serviceValues)).optional().default([]),
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
