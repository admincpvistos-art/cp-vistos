"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export function NotificationHeaderMenu() {
  const { openModal } = useNotificationStore();
  const { data: me } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
  });
  const canLoadNotifications =
    me?.user.role === "ADMIN" || me?.user.role === "COLLABORATOR";

  const utils = trpc.useUtils();

  const { data } = trpc.notificationRouter.getNotifications.useQuery(
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
        utils.notificationRouter.getNotifications.invalidate();
        utils.notificationRouter.getAllNotifications.invalidate();
        toast.success("Todas as notificações foram marcadas como lidas");
      },
      onError: (error) => {
        console.error(error);
        toast.error("Ocorreu um erro ao marcar as notificações como lidas");
      },
    });

  const hasUnread = (data?.notifications.length ?? 0) > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative bg-secondary/40 border-secondary/40"
        >
          <Bell />

          {hasUnread && (
            <div className="size-6 flex items-center justify-center bg-primary rounded-full absolute top-0.5 right-1 text-white font-medium text-sm !leading-none">
              {data!.notifications.length}
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="flex flex-col gap-6 bg-white border-muted shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base text-foreground font-semibold">
            Notificações
          </h4>

          {hasUnread && (
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
              {data !== undefined ? (
                data.notifications.length > 0 ? (
                  data.notifications.map((notification) => (
                    <div key={notification.id} className=" w-full h-fit">
                      <div className="relative w-full overflow-hidden group">
                        <div className="bg-primary/15 rounded-2xl p-4 w-full flex items-end justify-between gap-4">
                          <span className="text-sm text-foreground">
                            {notification.statusForm === "filling" && (
                              <>
                                <strong className="text-sm text-foreground font-semibold">
                                  {notification.profile.name}
                                </strong>{" "}
                                começou a{" "}
                                <strong className="text-sm text-foreground font-semibold">
                                  preencher
                                </strong>{" "}
                                o formulário
                              </>
                            )}
                            {notification.statusForm === "filled" && (
                              <>
                                <strong className="text-sm text-foreground font-semibold">{`${notification.profile.name} preencheu`}</strong>{" "}
                                o formulário
                              </>
                            )}
                            {notification.statusForm === "updated" && (
                              <>
                                <strong className="text-sm text-foreground font-semibold">{`${notification.profile.name} atualizou`}</strong>{" "}
                                o formulário
                              </>
                            )}
                          </span>

                          <span className="text-[12px] text-right text-foreground/50 font-medium">
                            {formatDistance(
                              notification.createdAt,
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
