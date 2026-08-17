import { TRPCError } from "@trpc/server";

import { adminProcedure, router } from "../trpc";
import payload from "@/data/acompanhamento-clientes.json";

export const acompanhamentoRouter = router({
  getClientesSheet: adminProcedure.query(async () => {
    if (!payload.headers?.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Planilha de acompanhamento não encontrada",
      });
    }

    return {
      sheet: payload.sheet,
      headers: payload.headers,
      rows: payload.rows,
    };
  }),
});
