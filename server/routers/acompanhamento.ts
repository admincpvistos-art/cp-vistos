import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { adminProcedure, router } from "../trpc";
import {
  getAcompanhamentoRecord,
  listAcompanhamentoSheet,
  updateAcompanhamentoRecord,
} from "@/server/acompanhamento-sheet";

const updateSchema = z.object({
  id: z.string().min(1),
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
  updateRow: adminProcedure.input(updateSchema).mutation(async ({ input }) => {
    const row = await updateAcompanhamentoRecord(input);

    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cliente não encontrado no cadastro",
      });
    }

    return { row };
  }),
});
