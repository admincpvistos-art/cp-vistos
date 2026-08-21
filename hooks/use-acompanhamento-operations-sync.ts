"use client";

import { useEffect, useRef } from "react";

import { trpc } from "@/lib/trpc-client";

/** Empurra o cadastro dos clientes do Excel em lotes, sem bloquear a listagem. */
export function useAcompanhamentoOperationsSync(enabled: boolean) {
  const utils = trpc.useUtils();
  const running = useRef(false);
  const syncBatch = trpc.financeRouter.syncBatch.useMutation();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function tick() {
      if (cancelled || running.current) {
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
          }, 400);
        }
      } catch {
        if (!cancelled) {
          window.setTimeout(() => {
            void tick();
          }, 2000);
        }
      } finally {
        running.current = false;
      }
    }

    void tick();

    return () => {
      cancelled = true;
    };
    // syncBatch.mutateAsync is stable enough for this mount loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
