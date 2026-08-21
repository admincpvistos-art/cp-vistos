import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { adminProcedure, router } from "../trpc";
import {
  createAcompanhamentoRecord,
  getAcompanhamentoRecord,
  listAcompanhamentoSheet,
  updateAcompanhamentoRecord,
  updateAcompanhamentoSheetComment,
} from "@/server/acompanhamento-sheet";
import { ACOMPANHAMENTO_SERVICE_OPTIONS } from "@/lib/acompanhamento-types";

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
  getClientesSheet: adminProcedure.query(async () => {
    const sheet = await listAcompanhamentoSheet();

    if (!sheet.headers.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Planilha de acompanhamento não encontrada",
      });
    }

    return sheet;
  }),
  getRow: adminProcedure
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
  createRow: adminProcedure.input(rowFieldsSchema).mutation(async ({ input }) => {
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
  updateRow: adminProcedure.input(updateSchema).mutation(async ({ input }) => {
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
  updateComment: adminProcedure
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
});
