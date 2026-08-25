import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { canAccessAcompanhamento } from "@/lib/staff-access";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      const currentUser = await auth();

      if (!currentUser || !currentUser.user || !currentUser.user.email) {
        throw new UploadThingError("Não autorizado");
      }

      const user = await prisma.user.findUnique({
        where: {
          email: currentUser.user.email,
        },
      });

      if (!user) {
        throw new UploadThingError("Usuário não encontrado");
      }

      if (user.role !== "ADMIN") {
        throw new UploadThingError("Não autorizado");
      }

      return {};
    })
    .onUploadComplete(async () => {
      return {};
    }),
  profileImageUploader: f({ image: { maxFileSize: "2MB" } })
    .middleware(async () => {
      const currentUser = await auth();

      if (!currentUser || !currentUser.user || !currentUser.user.email) {
        throw new UploadThingError("Não autorizado");
      }

      const user = await prisma.user.findUnique({
        where: {
          email: currentUser.user.email,
        },
      });

      if (!user) {
        throw new UploadThingError("Usuário não encontrado");
      }

      return { userId: user.id };
    })
    .onUploadComplete(async () => {
      return {};
    }),
  /** PDF/imagem/qualquer arquivo para impressão na entrevista. */
  interviewDocUploader: f({
    blob: { maxFileSize: "16MB", maxFileCount: 3 },
  })
    .input(z.object({ clientUserId: z.string().min(1) }))
    .middleware(async ({ input }) => {
      const currentUser = await auth();

      if (!currentUser?.user?.email) {
        throw new UploadThingError("Não autorizado");
      }

      const staff = await prisma.user.findUnique({
        where: { email: currentUser.user.email },
        select: { id: true, role: true, email: true },
      });

      if (!staff || !canAccessAcompanhamento(staff.role, staff.email)) {
        throw new UploadThingError("Não autorizado");
      }

      const client = await prisma.user.findFirst({
        where: { id: input.clientUserId },
        select: { id: true },
      });

      if (!client) {
        throw new UploadThingError("Cliente não encontrado");
      }

      return {
        clientUserId: client.id,
        uploadedById: staff.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        clientUserId: metadata.clientUserId,
        uploadedById: metadata.uploadedById,
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
