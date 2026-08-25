import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { adminProcedure, acompanhamentoStaffProcedure, router } from "../trpc";
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
  archiveRow: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        services: z.array(z.enum(serviceValues)).min(1),
        name: z.string().optional(),
        barcode: z.string().optional(),
        barcodeIssued: z.string().optional(),
        casv: z.string().optional(),
        interview: z.string().optional(),
        meeting: z.string().optional(),
        shipping: z.string().optional(),
        tipo: z.string().optional(),
        resp: z.string().optional(),
        tax: z.string().optional(),
        ds160: z.string().optional(),
        alimto: z.string().optional(),
        obs: z.string().optional(),
        dob: z.string().optional(),
        passport: z.string().optional(),
        account: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        entryDate: z.string().optional(),
        group: z.string().optional(),
        pagto: z.string().optional(),
        status: z.string().optional(),
        barcodeDone: z.boolean().optional(),
        sheetComment: z.string().optional(),
        accountFields: accountFieldsSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!canArchiveAcompanhamento(ctx.admin.role, ctx.admin.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sua conta não pode arquivar clientes",
        });
      }

      try {
        // Salva o que der — falha de update não impede arquivar se já há serviços.
        if (input.name != null) {
          try {
            await updateAcompanhamentoRecord({
              id: input.id,
              name: input.name,
              barcode: input.barcode ?? "",
              barcodeIssued: input.barcodeIssued ?? "",
              casv: input.casv ?? "",
              interview: input.interview ?? "",
              meeting: input.meeting ?? "",
              shipping: input.shipping ?? "",
              tipo: input.tipo ?? "",
              resp: input.resp ?? "",
              tax: input.tax ?? "",
              ds160: input.ds160 ?? "",
              alimto: input.alimto ?? "",
              obs: input.obs ?? "",
              dob: input.dob ?? "",
              passport: input.passport ?? "",
              account: input.account ?? "",
              email: input.email ?? "",
              phone: input.phone ?? "",
              entryDate: input.entryDate ?? "",
              group: input.group ?? "",
              pagto: input.pagto ?? "",
              status: input.status ?? "",
              barcodeDone: input.barcodeDone ?? false,
              sheetComment: input.sheetComment ?? "",
              services: input.services,
              accountFields: input.accountFields,
            });
          } catch (saveError) {
            console.warn("[acompanhamento] save antes de arquivar falhou", saveError);
          }
        }

        const result = await archiveAcompanhamentoClient(input.id, input.services);
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

      if (doc.fileKey) {
        const { UTApi } = await import("uploadthing/server");
        const utapi = new UTApi();
        utapi.deleteFiles(doc.fileKey).catch((error) => {
          console.error("[interview-doc] falha ao apagar arquivo", error);
        });
      }

      return { ok: true as const, userId: doc.userId };
    }),
});
