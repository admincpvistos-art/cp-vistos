"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Task } from "iconsax-react";
import { Events } from "react-scroll";
import { usePathname, useSearchParams } from "next/navigation";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

interface Props {
  isFormMenu?: boolean;
  profileId?: string;
  currentStep?: number;
  isEditing?: boolean;
  formStep?: string | null;
  onBrand?: boolean;
}

export function MobileFormMenu({
  isFormMenu,
  profileId,
  currentStep,
  isEditing,
  formStep,
  onBrand = false,
}: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const pathname = usePathname();

  function close() {
    setIsOpen(false);
  }

  useEffect(() => {
    Events.scrollEvent.register("begin", () => {
      setIsOpen(false);
    });

    return () => {
      Events.scrollEvent.remove("begin");
    };
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "hidden z-20 lg:hidden",
            onBrand
              ? "bg-white/15 border-white/25 text-white hover:bg-white/25 hover:text-white"
              : "bg-secondary/40 border-secondary/40 text-foreground",
            {
              flex: pathname.includes(`/formulario`) && !isEditing,
            },
          )}
        >
          <Task />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full sm:w-3/4">
        <Image
          src="/assets/images/cp-vistos-logo-azul.png"
          alt="CP Vistos Logo"
          width={65}
          height={36}
          className="object-center object-contain"
        />

        <nav className="mt-6 h-[calc(100%-24px-36px)] flex flex-col justify-between">
          <ul className="w-full h-full overflow-y-auto flex flex-col gap-y-4 sm:gap-y-7">
            <li>
              <Link
                href={`/formulario/${profileId}?formStep=0`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 0 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "0",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Dados Pessoais
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=1`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 1 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "1",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Endereço e Contatos
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=2`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 2 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "2",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Passaporte
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=3`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 3 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "3",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Sobre a viagem
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=4`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 4 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "4",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Sobre a Viagem
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=5`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 5 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "5",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Acompanhante da Viagem
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=6`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 6 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "6",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Viagens Anteriores
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=7`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 7 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "7",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Contatos nos Estados Unidos
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=8`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 8 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "8",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Informações da Família
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=9`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 9 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "9",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Trabalho e Educação
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=10`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 10 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "10",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Informação Adicional
                </span>
              </Link>
            </li>

            <li>
              <Link
                href={`/formulario/${profileId}?formStep=11`}
                className={cn(
                  "w-full border-b border-border/25 py-2 flex items-center gap-2 group pointer-events-none opacity-70",
                  { "pointer-events-auto opacity-100": currentStep! >= 11 },
                )}
                onClick={close}
              >
                <div
                  className={cn(
                    "w-0 h-[2px] bg-destructive transition-all group-hover:w-6",
                    {
                      "w-6": formStep === "11",
                    },
                  )}
                />

                <span className="text-lg sm:text-xl font-medium text-foreground transition-colors group-hover:text-destructive">
                  Segurança
                </span>
              </Link>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
