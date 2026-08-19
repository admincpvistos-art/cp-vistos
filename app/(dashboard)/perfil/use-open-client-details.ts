"use client";

import { toast } from "sonner";

import useClientDetailsModalStore from "@/constants/stores/useClientDetailsModalStore";
import { trpc } from "@/lib/trpc-client";
import type { ProfilesWithUserAndForm } from "@/types";

export function useOpenClientDetails() {
  const { openModal, setClient, setToResume } = useClientDetailsModalStore();

  function onSuccess({ client }: { client: ProfilesWithUserAndForm }) {
    setClient(client);
    openModal();
    setToResume();
  }

  function onError(error: { data?: { code?: string }; message?: string }) {
    if (error.data?.code === "NOT_FOUND") {
      toast.error(error.message || "Cliente não encontrado no cadastro");
      return;
    }

    toast.error("Ocorreu um erro ao abrir os detalhes do perfil!");
  }

  const byId = trpc.userRouter.getClientDetails.useMutation({ onSuccess, onError });
  const byLookup = trpc.userRouter.findClientDetails.useMutation({ onSuccess, onError });

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
