"use client";

import { useAcompanhamentoOperationsSync } from "@/hooks/use-acompanhamento-operations-sync";
import { isFullAdmin } from "@/lib/staff-access";
import { trpc } from "@/lib/trpc-client";

/**
 * Mantém o sync do Excel rodando em qualquer página do painel enquanto
 * um admin estiver logado (não precisa ficar em Financeiro/Serviços).
 */
export function AcompanhamentoSyncWorker() {
  const { data } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const enabled = isFullAdmin(data?.user.role, data?.user.email);
  useAcompanhamentoOperationsSync(enabled);

  return null;
}
