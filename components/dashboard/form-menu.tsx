"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FormMenu() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex p-6 h-full min-h-[calc(100vh-80px)] lg:min-h-[calc(100vh-96px)] w-[250px] flex-col justify-between border-r border-secondary">
      <ul className="mt-4 flex flex-col gap-6">
        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/clientes",
          })}
        >
          Dados Pessoais
        </li>

        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/criar-contas",
          })}
        >
          Endereço e Contatos
        </li>

        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/editar-conta",
          })}
        >
          Passaporte
        </li>

        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/editar-conta",
          })}
        >
          Sobre a Viagem
        </li>

        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/editar-conta",
          })}
        >
          Acompanhante da Viagem
        </li>

        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/editar-conta",
          })}
        >
          Viagens Anteriores
        </li>

        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/editar-conta",
          })}
        >
          Contatos nos Estados Unidos
        </li>

        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/editar-conta",
          })}
        >
          Informações da Família
        </li>

        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/editar-conta",
          })}
        >
          Trabalho e Educação
        </li>

        <li
          className={cn("text-lg font-medium", {
            "font-semibold": pathname === "/perfil/editar-conta",
          })}
        >
          Segurança
        </li>
      </ul>

      <Button
        onClick={() => signOut({ callbackUrl: "/" })}
        variant="secondary"
        className="flex items-center gap-2 text-base"
      >
        <LogOut />
        Sair
      </Button>
    </div>
  );
}
