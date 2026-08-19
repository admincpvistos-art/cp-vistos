import { TRPCError } from "@trpc/server";

import { adminProcedure, router } from "../trpc";
import { listAcompanhamentoSheet } from "@/server/acompanhamento-sheet";

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
});
