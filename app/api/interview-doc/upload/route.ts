import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { canAccessAcompanhamento } from "@/lib/staff-access";

export const runtime = "nodejs";

const MAX_BYTES = 16 * 1024 * 1024;

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

    const utapi = new UTApi();
    const uploaded = await utapi.uploadFiles(file);

    if (uploaded.error || !uploaded.data) {
      return NextResponse.json(
        { error: uploaded.error?.message || "Falha no envio ao armazenamento" },
        { status: 502 },
      );
    }

    const fileUrl =
      ("ufsUrl" in uploaded.data && typeof uploaded.data.ufsUrl === "string"
        ? uploaded.data.ufsUrl
        : null) || uploaded.data.url;

    if (!fileUrl || !uploaded.data.key) {
      return NextResponse.json(
        { error: "Upload sem URL/chave — tente novamente" },
        { status: 502 },
      );
    }

    const doc = await prisma.interviewDocument.create({
      data: {
        userId: clientUserId,
        fileName: uploaded.data.name || file.name,
        fileUrl,
        fileKey: uploaded.data.key,
        uploadedById: staff.id,
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        createdAt: true,
      },
    });

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
