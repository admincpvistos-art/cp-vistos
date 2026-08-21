import { z } from "zod";

import { collaboratorProcedure, router } from "../trpc";
import { listArquivadosSheet } from "@/server/arquivados-sheet";

export const arquivadosRouter = router({
  getSheet: collaboratorProcedure
    .input(
      z.object({
        category: z.enum(["american_visa", "renovacao", "passport", "e_ta"]),
      }),
    )
    .query(({ input }) => {
      const rows = listArquivadosSheet(input.category);
      return { rows, total: rows.length };
    }),
});
