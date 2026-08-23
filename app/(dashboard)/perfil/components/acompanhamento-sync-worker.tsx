"use client";

import { useAcompanhamentoOperationsSync } from "@/hooks/use-acompanhamento-operations-sync";
import { canAccessFinance, isFullAdmin } from "@/lib/staff-access";
import { trpc } from "@/lib/trpc-client";

/**
 * Mantém o sync do Excel rodando no painel enquanto admin/financeiro
 * estiver logado — preenche Serviços e Custos + checklist Financeiro.
 */
export function AcompanhamentoSyncWorker() {
  const { data } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const enabled =
    isFullAdmin(data?.user.role, data?.user.email) ||
    canAccessFinance(data?.user.role, data?.user.email);

  useAcompanhamentoOperationsSync(enabled);

  return null;
}
