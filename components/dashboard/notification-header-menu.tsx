"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useNotificationStore from "@/constants/stores/useNotificationStore";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type NotificationItem = {
  id: string;
  statusForm: string;
  createdAt: Date | string;
  profile: { name: string };
};

function notificationLabel(statusForm: string, profileName: string) {
  if (statusForm === "registered") {
    return (
      <>
        <strong className="text-sm text-foreground font-semibold">{profileName}</strong>{" "}
        se cadastrou no sistema
      </>
    );
  }
  if (statusForm === "filling") {
    return (
      <>
        <strong className="text-sm text-foreground font-semibold">{profileName}</strong>{" "}
        começou a{" "}
        <strong className="text-sm text-foreground font-semibold">preencher</strong>{" "}
        o formulário
      </>
    );
  }
  if (statusForm === "filled") {
    return (
      <>
        <strong className="text-sm text-foreground font-semibold">{`${profileName} preencheu`}</strong>{" "}
        o formulário
      </>
    );
  }
  if (statusForm === "updated") {
    return (
      <>
        <strong className="text-sm text-foreground font-semibold">{`${profileName} atualizou`}</strong>{" "}
        o formulário
      </>
    );
  }
  return (
    <strong className="text-sm text-foreground font-semibold">{profileName}</strong>
  );
}

export function NotificationHeaderMenu({ onBrand = false }: { onBrand?: boolean }) {
  const { openModal } = useNotificationStore();
  const markedOpenRef = useRef(false);
  const [openList, setOpenList] = useState<NotificationItem[] | null>(null);
  const { data: me } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
  });
  const canLoadNotifications =
    me?.user.role === "ADMIN" || me?.user.role === "COLLABORATOR";

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notificationRouter.getNotifications.useQuery(
    undefined,
    { enabled: canLoadNotifications },
  );
  const { mutate: viewNotification, isPending } =
    trpc.notificationRouter.updateViewNotification.useMutation({
      onSuccess: () => {
        utils.notificationRouter.getNotifications.invalidate();
        utils.notificationRouter.getAllNotifications.invalidate();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Ocorreu um erro ao alterar o status da notificação");
      },
    });

  const { mutate: viewAllNotifications, isPending: isPendingAll } =
    trpc.notificationRouter.updateViewAllNotifications.useMutation({
      onSuccess: () => {
        utils.notificationRouter.getAllNotifications.invalidate();
        // Não invalida getNotifications enquanto o popover está aberto (lista some).
        if (!markedOpenRef.current) {
          utils.notificationRouter.getNotifications.invalidate();
        }
      },
      onError: (error) => {
        console.error(error);
        toast.error("Ocorreu um erro ao marcar as notificações como lidas");
      },
    });

  const liveUnread = data?.notifications ?? [];
  const hasUnread = liveUnread.length > 0;
  const listNotifications = openList ?? liveUnread;

  function onOpenChange(open: boolean) {
    if (open) {
      setOpenList(liveUnread);
      if (liveUnread.length > 0 && !markedOpenRef.current) {
        markedOpenRef.current = true;
        viewAllNotifications();
      }
      return;
    }
    markedOpenRef.current = false;
    setOpenList(null);
    void utils.notificationRouter.getNotifications.invalidate();
  }

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative",
            onBrand
              ? "bg-white/15 border-white/25 text-white hover:bg-white/25 hover:text-white"
              : "bg-secondary/40 border-secondary/40",
          )}
        >
          <Bell />

          {hasUnread && (
            <div className="size-6 flex items-center justify-center bg-rose-500 rounded-full absolute top-0.5 right-1 text-white font-medium text-sm !leading-none">
              {liveUnread.length}
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="flex flex-col gap-6 bg-white border-muted shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base text-foreground font-semibold">
            Notificações
          </h4>

          {listNotifications.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPendingAll}
              onClick={() => viewAllNotifications()}
              className="h-8 px-2 text-xs text-foreground/70 hover:text-foreground"
            >
              {isPendingAll ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="size-4 mr-1" />
                  Marcar tudo como lido
                </>
              )}
            </Button>
          )}
        </div>

        <div className="w-full flex flex-col gap-6">
          <ScrollArea className="w-full h-[300px]">
            <div className="w-full flex flex-col gap-2">
              {!isLoading || openList ? (
                listNotifications.length > 0 ? (
                  listNotifications.map((notification) => (
                    <div key={notification.id} className=" w-full h-fit">
                      <div className="relative w-full overflow-hidden group">
                        <div className="bg-primary/15 rounded-2xl p-4 w-full flex items-end justify-between gap-4">
                          <span className="text-sm text-foreground">
                            {notificationLabel(
                              notification.statusForm,
                              notification.profile.name,
                            )}
                          </span>

                          <span className="text-[12px] text-right text-foreground/50 font-medium">
                            {formatDistance(
                              new Date(notification.createdAt),
                              new Date(),
                              {
                                locale: ptBR,
                              },
                            )}
                          </span>
                        </div>

                        <Button
                          onClick={() =>
                            viewNotification({ id: notification.id })
                          }
                          variant="secondary"
                          className={cn(
                            "absolute top-0 -right-16 h-full transition-all hover:bg-white group-hover:right-0 group-hover:left-auto",
                            {
                              "right-0 left-auto bg-white": isPending,
                            },
                          )}
                        >
                          {isPending ? (
                            <Loader2 color="#AFBCDA" className="animate-spin" />
                          ) : (
                            <CheckCheck color="#AFBCDA" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-foreground/50 text-center">
                    Sem notificações no momento
                  </span>
                )
              ) : (
                <div>
                  <Loader2 className="animate-spin" />
                </div>
              )}
            </div>
          </ScrollArea>

          <Button
            onClick={openModal}
            variant="link"
            size="icon"
            className="w-fit text-foreground/60 underline"
          >
            Ver histórico
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
