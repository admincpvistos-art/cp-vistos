import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { collaboratorProcedure, router } from "../trpc";
import { listArquivadosSheet, unarchiveArquivadoClient } from "@/server/arquivados-sheet";
import { canArchiveAcompanhamento } from "@/lib/staff-access";

export const arquivadosRouter = router({
  getSheet: collaboratorProcedure
    .input(
      z.object({
        category: z.enum(["american_visa", "renovacao", "passport", "e_ta"]),
      }),
    )
    .query(async ({ input }) => {
      const rows = await listArquivadosSheet(input.category);
      return { rows, total: rows.length };
    }),

  unarchiveRow: collaboratorProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (!canArchiveAcompanhamento(ctx.collaborator.role, ctx.collaborator.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sua conta não pode desarquivar clientes",
        });
      }

      try {
        return await unarchiveArquivadoClient(input.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[arquivados] unarchiveRow failed", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível desarquivar o cliente",
        });
      }
    }),
});
