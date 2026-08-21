"use client";

import { useEffect, useRef } from "react";

import { trpc } from "@/lib/trpc-client";

/**
 * Empurra o cadastro dos clientes do Excel em lotes.
 * Usado no layout do painel (qualquer página) enquanto o admin estiver logado.
 */
export function useAcompanhamentoOperationsSync(enabled: boolean) {
  const utils = trpc.useUtils();
  const running = useRef(false);
  const syncBatch = trpc.financeRouter.syncBatch.useMutation();
  const statusQuery = trpc.financeRouter.getSyncStatus.useQuery(undefined, {
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.pendingSync > 0 || data.linkedUsers < data.totalImported) {
        return 15000;
      }
      return false;
    },
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function tick() {
      if (cancelled || running.current) {
        return;
      }

      const status = statusQuery.data;
      if (
        status &&
        status.pendingSync === 0 &&
        status.linkedUsers >= status.totalImported &&
        status.totalImported > 0
      ) {
        return;
      }

      running.current = true;
      try {
        const result = await syncBatch.mutateAsync();
        await Promise.all([
          utils.financeRouter.getChecklist.invalidate(),
          utils.financeRouter.getSyncStatus.invalidate(),
          utils.serviceCostRouter.getRows.invalidate(),
          utils.acompanhamentoRouter.getClientesSheet.invalidate(),
        ]);
        if (
          !cancelled &&
          (result.pendingSync > 0 || result.linkedUsers < result.totalImported)
        ) {
          window.setTimeout(() => {
            void tick();
          }, 500);
        }
      } catch {
        if (!cancelled) {
          window.setTimeout(() => {
            void tick();
          }, 3000);
        }
      } finally {
        running.current = false;
      }
    }

    void tick();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, statusQuery.data?.pendingSync, statusQuery.data?.linkedUsers]);
}
