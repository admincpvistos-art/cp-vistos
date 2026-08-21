import { collaboratorProcedure, router } from "../trpc";
import { listProspectsSheet } from "@/server/prospects-sheet";

export const prospectsRouter = router({
  getSheet: collaboratorProcedure.query(() => {
    const rows = listProspectsSheet();
    return { rows, total: rows.length };
  }),
});
