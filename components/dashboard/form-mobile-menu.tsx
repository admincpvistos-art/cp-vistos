"use client";

import { usePathname } from "next/navigation";
import { LogOut, PanelRightOpen } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FormMobileMenu() {
  const pathname = usePathname();

  return (
    <div className="w-full px-6 sm:px-16 mt-12 lg:hidden">
      <Sheet>
        <SheetTrigger>
          <PanelRightOpen size={30} />
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px]">
          <div className="h-full flex flex-col justify-between">
            <ul className="mt-10 flex flex-col gap-6">
              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/clientes",
                })}
              >
                Dados Pessoais
              </li>

              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/criar-contas",
                })}
              >
                Endereço e Contatos
              </li>

              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/editar-conta",
                })}
              >
                Passaporte
              </li>

              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/editar-conta",
                })}
              >
                Sobre a Viagem
              </li>

              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/editar-conta",
                })}
              >
                Acompanhante da Viagem
              </li>

              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/editar-conta",
                })}
              >
                Viagens Anteriores
              </li>

              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/editar-conta",
                })}
              >
                Contatos nos Estados Unidos
              </li>

              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/editar-conta",
                })}
              >
                Informações da Família
              </li>

              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/editar-conta",
                })}
              >
                Trabalho e Educação
              </li>

              <li
                className={cn("text-xl", {
                  "font-semibold": pathname === "/perfil/editar-conta",
                })}
              >
                Segurança
              </li>
            </ul>

            <Button variant="secondary" className="flex items-center gap-2 text-base">
              <LogOut />
              Sair
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
