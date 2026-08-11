import { z } from "zod";

import prisma from "@/lib/prisma";
import { collaboratorProcedure, router } from "../trpc";

export const notificationRouter = router({
  getNotifications: collaboratorProcedure.query(async () => {
    const notifications = await prisma.notification.findMany({
      where: {
        viewed: false,
      },
      include: {
        profile: {
          select: {
            name: true,
          },
        },
      },
    });

    return { notifications };
  }),
  getAllNotifications: collaboratorProcedure.query(async () => {
    const notifications = await prisma.notification.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        profile: {
          select: {
            name: true,
          },
        },
      },
    });

    return { notifications };
  }),
  updateViewNotification: collaboratorProcedure
    .input(
      z.object({
        id: z.string().min(1),
      })
    )
    .mutation(async (opts) => {
      const { id } = opts.input;

      await prisma.notification.update({
        where: {
          id,
        },
        data: {
          viewed: true,
        },
      });

      return {};
    }),
  updateViewAllNotifications: collaboratorProcedure.mutation(async () => {
    await prisma.notification.updateMany({
      where: {
        viewed: false,
      },
      data: {
        viewed: true,
      },
    });

    return {};
  }),
});
