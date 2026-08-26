"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { OverlayAnimation, ModalAnimation } from "@/constants/animations/modal";
import useNotificationStore from "@/constants/stores/useNotificationStore";
import { trpc } from "@/lib/trpc-client";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

export function NotificationModal() {
  const { isModalOpen, closeModal } = useNotificationStore();
  const { data: me } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
  });
  const canLoadNotifications =
    me?.user.role === "ADMIN" || me?.user.role === "COLLABORATOR";

  const { data } = trpc.notificationRouter.getAllNotifications.useQuery(
    undefined,
    { enabled: canLoadNotifications },
  );

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          key="formsSelected[selected]-modal"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={OverlayAnimation}
          className="w-screen h-screen bg-black/80 fixed top-0 left-0 right-0 bottom-0 z-[9999] text-center overflow-auto p-6 after:h-full after:content-[''] after:inline-block after:align-middle"
        >
          <motion.div
            key="formsSelected[selected]-modal"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={ModalAnimation}
            className="w-full max-w-[800px] h-[80vh] bg-white p-6 rounded-2xl inline-block align-middle overflow-x-hidden"
          >
            <div className="w-full grid grid-cols-2 grid-rows-2 gap-4 mb-9 sm:flex sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold text-foreground text-center sm:text-3xl row-end-3 row-start-2 col-span-2">
                Histórico de Notificações
              </h1>

              <Button
                onClick={closeModal}
                variant="link"
                size="icon"
                className="row-start-1 row-end-2 justify-self-end"
              >
                <Image
                  src="/assets/icons/cross-blue.svg"
                  alt="Fechar"
                  width={24}
                  height={24}
                />
              </Button>
            </div>

            <ScrollArea className="w-full h-[calc(100%-48px-36px)]">
              <div className="w-full flex flex-col gap-4">
                {data !== undefined ? (
                  data.notifications.length > 0 ? (
                    data.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="bg-primary/15 p-4 w-full flex items-end justify-between gap-6"
                      >
                        <span className="text-lg text-left text-foreground">
                          {notification.statusForm === "registered" && (
                            <>
                              <strong className="font-semibold">
                                {notification.profile.name}
                              </strong>{" "}
                              se cadastrou no sistema
                            </>
                          )}
                          {notification.statusForm === "filling" && (
                            <>
                              <strong className="font-semibold">
                                {notification.profile.name}
                              </strong>{" "}
                              começou a{" "}
                              <strong className="font-semibold">
                                preencher
                              </strong>{" "}
                              o formulário
                            </>
                          )}
                          {notification.statusForm === "filled" && (
                            <>
                              <strong className="font-semibold">{`${notification.profile.name} preencheu`}</strong>{" "}
                              o formulário
                            </>
                          )}
                          {notification.statusForm === "updated" && (
                            <>
                              <strong className="font-semibold">{`${notification.profile.name} atualizou`}</strong>{" "}
                              o formulário
                            </>
                          )}
                        </span>

                        <span className="text-[12px] font-medium text-foreground/50">
                          {formatDistance(notification.createdAt, new Date(), {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full flex items-center justify-center">
                      <span className="text-foreground/50 text-center font-medium text-base lg:text-lg">
                        Sem notificação no momento
                      </span>
                    </div>
                  )
                ) : (
                  <div className="w-full flex flex-col items-center justify-center my-6 gap-2">
                    <Loader2
                      className="animate-spin"
                      size={54}
                      strokeWidth={1.5}
                    />
                    <span className="text-foreground font-medium text-base lg:text-lg">
                      Carregando Notificações...
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
