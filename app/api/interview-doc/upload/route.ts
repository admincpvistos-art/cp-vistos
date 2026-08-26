import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { canAccessAcompanhamento } from "@/lib/staff-access";

export const runtime = "nodejs";

const MAX_BYTES = 16 * 1024 * 1024;
/** Limite seguro para gravar no Mongo (doc ≤ 16MB; base64 cresce ~33%). */
const MAX_INLINE_BYTES = 8 * 1024 * 1024;

async function storeInline(file: File, clientUserId: string, uploadedById: string) {
  if (file.size > MAX_INLINE_BYTES) {
    throw new Error(
      "Arquivo grande demais sem UploadThing. Configure UPLOADTHING_TOKEN na Vercel (até 16 MB) ou envie um arquivo de até 8 MB.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  const fileUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  return prisma.interviewDocument.create({
    data: {
      userId: clientUserId,
      fileName: file.name || "documento",
      fileUrl,
      fileKey: `inline:${randomUUID()}`,
      uploadedById,
    },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      createdAt: true,
    },
  });
}

async function storeUploadThing(file: File, clientUserId: string, uploadedById: string) {
  const token = process.env.UPLOADTHING_TOKEN?.trim();
  const utapi = new UTApi(token ? { token } : undefined);
  const uploaded = await utapi.uploadFiles(file);

  if (uploaded.error || !uploaded.data) {
    throw new Error(uploaded.error?.message || "Falha no envio ao armazenamento");
  }

  const fileUrl =
    ("ufsUrl" in uploaded.data && typeof uploaded.data.ufsUrl === "string"
      ? uploaded.data.ufsUrl
      : null) || uploaded.data.url;

  if (!fileUrl || !uploaded.data.key) {
    throw new Error("Upload sem URL/chave — tente novamente");
  }

  return prisma.interviewDocument.create({
    data: {
      userId: clientUserId,
      fileName: uploaded.data.name || file.name,
      fileUrl,
      fileKey: uploaded.data.key,
      uploadedById,
    },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      createdAt: true,
    },
  });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const staff = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, email: true },
    });

    if (!staff || !canAccessAcompanhamento(staff.role, staff.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const formData = await req.formData();
    const clientUserId = String(formData.get("clientUserId") ?? "").trim();
    const file = formData.get("file");

    if (!clientUserId) {
      return NextResponse.json({ error: "Cliente inválido" }, { status: 400 });
    }

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "Selecione um arquivo" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Arquivo maior que 16 MB" }, { status: 400 });
    }

    const client = await prisma.user.findFirst({
      where: { id: clientUserId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const hasToken = Boolean(process.env.UPLOADTHING_TOKEN?.trim());
    let doc;

    if (hasToken) {
      try {
        doc = await storeUploadThing(file, clientUserId, staff.id);
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : String(uploadError);
        // Token inválido / ausente em runtime → grava no banco.
        if (/missing token|UPLOADTHING_TOKEN|unauthorized/i.test(message)) {
          doc = await storeInline(file, clientUserId, staff.id);
        } else {
          throw uploadError;
        }
      }
    } else {
      doc = await storeInline(file, clientUserId, staff.id);
    }

    return NextResponse.json({ doc });
  } catch (error) {
    console.error("[interview-doc/upload]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Não foi possível enviar o documento",
      },
      { status: 500 },
    );
  }
}
