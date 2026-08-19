"use client";

import { toast } from "sonner";

import useClientDetailsModalStore from "@/constants/stores/useClientDetailsModalStore";
import { trpc } from "@/lib/trpc-client";

export function useOpenClientDetails() {
  const { openModal, setClient, setToResume } = useClientDetailsModalStore();

  function handleOpened(client: Parameters<typeof setClient>[0]) {
    if (!client) {
      toast.error("Perfil não encontrado!");
      return;
    }

    setClient(client);
    openModal();
    setToResume();
  }

  function handleError(error: { data?: { code?: string } | null; message?: string }) {
    if (error.data?.code === "NOT_FOUND") {
      toast.error(error.message || "Cliente não encontrado no cadastro");
      return;
    }

    toast.error("Ocorreu um erro ao abrir os detalhes do perfil!");
  }

  const byId = trpc.userRouter.getClientDetails.useMutation({
    onSuccess: ({ client }) => handleOpened(client),
    onError: handleError,
  });
  const byLookup = trpc.userRouter.findClientDetails.useMutation({
    onSuccess: ({ client }) => handleOpened(client),
    onError: handleError,
  });

  return {
    isPending: byId.isPending || byLookup.isPending,
    openByProfileId: (profileId: string) => byId.mutate({ profileId }),
    openByUserId: (userId: string) => byLookup.mutate({ userId }),
    openBySheetRow: (name: string, barcode?: string) =>
      byLookup.mutate({
        name,
        barcode: barcode?.trim() || undefined,
      }),
  };
}
