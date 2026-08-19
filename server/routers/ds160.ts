import { Category, NotificationStatusForm, StatusForm } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { CEAC_PAGES } from "@/lib/ds160-ceac";
import { ds160StaffProcedure, router } from "../trpc";
import { syncExcelClientsForOperations } from "@/server/acompanhamento-sheet";

const pageIdSchema = z.enum([
  "personal1",
  "personal2",
  "address",
  "passport",
  "travel",
  "companions",
  "previous",
  "uscontact",
  "family",
  "work",
  "additional",
  "security",
]);

function packetInclude() {
  return {
    user: {
      select: {
        name: true,
        email: true,
        group: true,
        cpf: true,
      },
    },
    form: true,
  } as const;
}

export const ds160Router = router({
  list: ds160StaffProcedure
    .input(
      z
        .object({
          mode: z.enum(["review", "fill"]).default("review"),
        })
        .optional(),
    )
    .query(async (opts) => {
      const pendingSync = await syncExcelClientsForOperations();

      const imported = await prisma.acompanhamentoClient.findMany({
        where: { source: "imported", userId: { not: null } },
        select: { userId: true },
      });
      const importedUserIds = imported
        .map((row) => row.userId)
        .filter((id): id is string => Boolean(id));

      const profiles = await prisma.profile.findMany({
        where: {
          category: Category.american_visa,
          form: {
            isNot: null,
          },
          OR: [
            ...(importedUserIds.length ? [{ userId: { in: importedUserIds } }] : []),
            { statusForm: StatusForm.filled },
            { ds160ReviewStatus: { in: ["returned", "ready", "filling"] } },
          ],
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              group: true,
            },
          },
          form: {
            select: {
              firstName: true,
              lastName: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      const rows = profiles.map((profile) => {
        const formName = [profile.form?.firstName, profile.form?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

        return {
          profileId: profile.id,
          name: formName || profile.name,
          group: profile.user.group,
          email: profile.user.email,
          statusForm: profile.statusForm,
          formLocked: profile.formLocked,
          ds160ReviewStatus: profile.ds160ReviewStatus,
          reviewedCount: profile.ds160ReviewedPages?.length ?? 0,
          totalPages: CEAC_PAGES.length,
          formReturnNote: profile.formReturnNote,
          updatedAt: profile.updatedAt,
        };
      });

      return { rows, pendingSync };
    }),
  getPacket: ds160StaffProcedure
    .input(
      z.object({
        profileId: z.string().min(1),
      }),
    )
    .query(async (opts) => {
      const profile = await prisma.profile.findUnique({
        where: {
          id: opts.input.profileId,
        },
        include: packetInclude(),
      });

      if (!profile || profile.category !== Category.american_visa) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário de visto não encontrado",
        });
      }

      return {
        profile: {
          id: profile.id,
          name: profile.name,
          category: profile.category,
          statusForm: profile.statusForm,
          formLocked: profile.formLocked,
          visaClass: profile.visaClass,
          visaType: profile.visaType,
          DSNumber: profile.DSNumber,
          protocol: profile.protocol,
          ds160ReviewStatus: profile.ds160ReviewStatus,
          ds160ReviewedPages: profile.ds160ReviewedPages,
          formReturnNote: profile.formReturnNote,
          updatedAt: profile.updatedAt,
        },
        user: profile.user,
        form: profile.form,
      };
    }),
  returnToClient: ds160StaffProcedure
    .input(
      z.object({
        profileId: z.string().min(1),
        note: z.string().min(3, "Informe o que falta complementar"),
        pageId: pageIdSchema.optional(),
      }),
    )
    .mutation(async (opts) => {
      const profile = await prisma.profile.findUnique({
        where: { id: opts.input.profileId },
        select: { id: true, category: true },
      });

      if (!profile || profile.category !== Category.american_visa) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário de visto não encontrado",
        });
      }

      const pageLabel = opts.input.pageId
        ? CEAC_PAGES.find((page) => page.id === opts.input.pageId)?.title
        : null;
      const note = pageLabel
        ? `${pageLabel}: ${opts.input.note}`
        : opts.input.note;

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          statusForm: StatusForm.filling,
          formLocked: false,
          ds160ReviewStatus: "returned",
          formReturnNote: note,
        },
      });

      await prisma.notification.create({
        data: {
          statusForm: NotificationStatusForm.updated,
          profile: {
            connect: { id: profile.id },
          },
        },
      });

      return { message: "Formulário devolvido ao cliente" };
    }),
  markPageReviewed: ds160StaffProcedure
    .input(
      z.object({
        profileId: z.string().min(1),
        pageId: pageIdSchema,
      }),
    )
    .mutation(async (opts) => {
      const profile = await prisma.profile.findUnique({
        where: { id: opts.input.profileId },
        select: {
          id: true,
          category: true,
          ds160ReviewedPages: true,
        },
      });

      if (!profile || profile.category !== Category.american_visa) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário de visto não encontrado",
        });
      }

      const pages = Array.from(
        new Set([...(profile.ds160ReviewedPages ?? []), opts.input.pageId]),
      );
      const ready = CEAC_PAGES.every((page) => pages.includes(page.id));

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          ds160ReviewedPages: pages,
          ds160ReviewStatus: ready ? "ready" : "awaiting_review",
        },
      });

      return {
        message: ready
          ? "Todas as páginas conferidas"
          : "Página marcada como conferida",
        reviewedPages: pages,
        ready,
      };
    }),
  openAdminEdit: ds160StaffProcedure
    .input(
      z.object({
        profileId: z.string().min(1),
      }),
    )
    .mutation(async (opts) => {
      const profile = await prisma.profile.findUnique({
        where: { id: opts.input.profileId },
        select: { id: true, category: true, statusForm: true },
      });

      if (!profile || profile.category !== Category.american_visa) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário de visto não encontrado",
        });
      }

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          formLocked: false,
          formStep: 10,
          statusForm:
            profile.statusForm === StatusForm.awaiting
              ? StatusForm.filling
              : profile.statusForm,
        },
      });

      return { profileId: profile.id };
    }),
  startFill: ds160StaffProcedure
    .input(
      z.object({
        profileId: z.string().min(1),
      }),
    )
    .mutation(async (opts) => {
      const profile = await prisma.profile.findUnique({
        where: { id: opts.input.profileId },
        select: { id: true, category: true },
      });

      if (!profile || profile.category !== Category.american_visa) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Formulário de visto não encontrado",
        });
      }

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          ds160ReviewStatus: "filling",
        },
      });

      return { profileId: profile.id };
    }),
});
