import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { collaboratorProcedure, router } from "../trpc";
import {
  createManualProspect,
  listProspectsSheet,
} from "@/server/prospects-sheet";

export const prospectsRouter = router({
  getSheet: collaboratorProcedure
    .input(
      z
        .object({
          category: z
            .enum(["american_visa", "renovacao", "passport", "e_ta"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const rows = await listProspectsSheet(input?.category);
      return { rows, total: rows.length };
    }),

  createManual: collaboratorProcedure
    .input(
      z.object({
        name: z.string().min(1, "Informe o nome"),
        email: z.string().optional(),
        phone: z.string().optional(),
        group: z.string().optional(),
        category: z
          .enum(["american_visa", "renovacao", "passport", "e_ta"])
          .default("american_visa"),
        passport: z.string().optional(),
        dob: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const row = await createManualProspect(input);
        return { id: row.id, name: row.name };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível incluir o prospect",
        });
      }
    }),
});
