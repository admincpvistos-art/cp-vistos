import { appRouter } from "@/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createContext } from "@/server/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext,
  });

export { handler as GET, handler as POST };

/** Permite completar o sync em lote dos clientes do Acompanhamento. */
export const maxDuration = 60;

