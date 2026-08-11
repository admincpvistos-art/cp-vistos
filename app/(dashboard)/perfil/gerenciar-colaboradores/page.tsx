"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CollaboratorBox } from "./components/collaborator-box";

import { trpc } from "@/lib/trpc-client";

export default function CollaboratorManagementPage() {
  const router = useRouter();

  const { data } = trpc.collaboratorRouter.getCollaborators.useQuery();
  const { data: roleData } = trpc.userRouter.getRole.useQuery();

  useEffect(() => {
    if (roleData !== undefined && roleData.role !== "ADMIN") {
      toast.error("Acesso não autorizado");

      router.push("/perfil/clientes");
    }
  }, [roleData, router]);

  return (
    <div className="w-full lg:w-[calc(100%-var(--dashboard-sidebar-width,250px))] px-6 sm:px-16 lg:ml-[var(--dashboard-sidebar-width,250px)] lg:px-40 transition-[margin,width] duration-300">
      <div className="w-full flex flex-col gap-4 items-center my-6 sm:flex-row sm:items-end sm:justify-between lg:my-12">
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold">
          Colaboradores
        </h1>

        <Button size="xl" className="w-full sm:w-fit" asChild>
          <Link href="/perfil/gerenciar-colaboradores/cadastro">
            Adicionar Colaborador
          </Link>
        </Button>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
        {data !== undefined ? (
          data.collaborators.length > 0 ? (
            data.collaborators.map((collaborator) => (
              <CollaboratorBox
                key={collaborator.id}
                name={collaborator.name}
                collaboratorId={collaborator.id}
              />
            ))
          ) : (
            <div className="w-full flex items-center justify-center col-span-2 mt-12">
              <span className="text-xl font-medium text-center text-foreground/70">
                Nenhum colaborador cadastrado no momento
              </span>
            </div>
          )
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-4 col-span-2 mt-12">
            <Loader2 className="animate-spin" size={50} strokeWidth={1.5} />
            <span className="text-xl font-medium text-center">
              Carregando colaboradores
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
