"use client";

import Link from "next/link";
import Image from "next/image";
import { useWindowScroll } from "react-use";
import { LogOut, Users } from "lucide-react";
import { Link as ScrollLink } from "react-scroll";
import { signOut, useSession } from "next-auth/react";

import { cn } from "@/lib/utils";

import { MobileMenu } from "./mobile-menu";
import { HeaderBrandLogo } from "./header-brand-logo";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function Header() {
  const session = useSession();
  const pathname = usePathname();
  const { y } = useWindowScroll();

  return (
    <header className="w-full bg-transparent h-20 px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-30 sm:px-16 sm:top-4 lg:container">
      <div
        className={cn(
          "w-full h-20 absolute top-0 left-0 transform -translate-y-full bg-white/35 backdrop-blur-lg rounded-b-xl transition-transform duration-500 sm:rounded-b-3xl sm:h-[calc(80px+32px)] sm:-translate-y-[calc(100%+16px)]",
          {
            "translate-y-0 sm:-translate-y-4": y > 0,
          },
        )}
      />

      <HeaderBrandLogo />

      <MobileMenu session={session} pathname={pathname} />

      <nav className="z-40 hidden lg:flex lg:items-center lg:gap-12">
        <ul
          className={cn(
            "flex items-center gap-1",
            pathname === "/politica-de-privacidade" && "hidden",
          )}
        >
          <li>
            <ScrollLink
              to="home"
              activeClass="active"
              spy={true}
              smooth={true}
              offset={-176}
              duration={1000}
              className="text-base font-medium text-foreground transition-colors cursor-pointer hover:bg-secondary/40 rounded-2xl px-5 py-3"
            >
              Início
            </ScrollLink>
          </li>

          <li>
            <ScrollLink
              to="about"
              activeClass="active"
              spy={true}
              smooth={true}
              offset={-200}
              duration={1000}
              className="text-base font-medium text-foreground transition-colors cursor-pointer hover:bg-secondary/40 rounded-2xl px-5 py-3"
            >
              Sobre
            </ScrollLink>
          </li>

          <li>
            <ScrollLink
              to="how-it-works"
              activeClass="active"
              spy={true}
              smooth={true}
              offset={-200}
              duration={1000}
              className="text-base font-medium text-foreground transition-colors cursor-pointer hover:bg-secondary/40 rounded-2xl px-5 py-3"
            >
              Como Funciona
            </ScrollLink>
          </li>

          <li>
            <ScrollLink
              to="services"
              activeClass="active"
              spy={true}
              smooth={true}
              offset={-200}
              duration={1000}
              className="text-base font-medium text-foreground transition-colors cursor-pointer hover:bg-secondary/40 rounded-2xl px-5 py-3"
            >
              Serviços
            </ScrollLink>
          </li>

          <li>
            <ScrollLink
              to="testimonials"
              activeClass="active"
              spy={true}
              smooth={true}
              offset={-200}
              duration={1000}
              className="text-base font-medium text-foreground transition-colors cursor-pointer hover:bg-secondary/40 rounded-2xl px-5 py-3"
            >
              Depoimentos
            </ScrollLink>
          </li>

          <li>
            <ScrollLink
              to="features"
              activeClass="active"
              spy={true}
              smooth={true}
              offset={-200}
              duration={1000}
              className="text-base font-medium text-foreground transition-colors cursor-pointer hover:bg-secondary/40 rounded-2xl px-5 py-3"
            >
              Diferenciais
            </ScrollLink>
          </li>
        </ul>

        <div className="flex items-center gap-4">
          {session.status === "authenticated" ? (
            <>
              <Button
                variant="outline"
                className="bg-secondary/40 flex items-center gap-2"
                asChild
              >
                <Link href="/verificando-usuario">
                  Perfil <Users color="#314060" />
                </Link>
              </Button>

              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="destructive"
                className="flex items-center gap-2"
              >
                Sair
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="hover:bg-white/40" asChild>
                <a
                  href="https://wa.link/2i5gt9"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Contato
                </a>
              </Button>

              <Button variant="destructive" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
      {/* <div className="w-full h-full flex items-center justify-between gap-12 border-t border-b border-secondary">
        <div className="flex items-center gap-24">
          <Link href="/" className="relative w-20 h-20 ml-6">
            <Image
              src="/assets/images/cp-vistos-logo-azul.png"
              alt="CP Vistos"
              fill
              className="object-center object-contain"
            />
          </Link>

          <nav className="hidden lg:block">
            <ul className="flex items-center gap-12">
              <li className="text-lg font-medium text-foreground hover:opacity-70">
                <Link href="/servicos">Serviços</Link>
              </li>

              <li className="text-lg font-medium text-foreground hover:opacity-70">
                <Link href="/diferenciais">Diferenciais</Link>
              </li>

              <li className="text-lg font-medium text-foreground hover:opacity-70">
                <Link href="/depoimentos">Depoimentos</Link>
              </li>
            </ul>
          </nav>
        </div>

        <MobileBtns />

        <div className="hidden lg:flex items-center h-full">
          <Button
            variant="link"
            size="icon"
            asChild
            className="hidden lg:flex px-6 w-auto h-full border-l border-secondary text-lg font-medium hover:no-underline transition-opacity hover:opacity-70"
          >
            <Link href="/contato">Contato</Link>
          </Button>

          <Button
            variant="link"
            size="icon"
            asChild
            className="hidden lg:flex px-6 w-auto h-full border-l border-secondary text-lg font-medium hover:no-underline transition-opacity hover:opacity-70"
          >
            {session.status === "authenticated" ? (
              <Link href="/verificando-usuario">Perfil</Link>
            ) : (
              <Link href="/login">Entrar</Link>
            )}
          </Button>

          {session.status === "authenticated" ? (
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              variant="secondary"
              className="hidden lg:flex px-6 w-auto h-full border-l border-secondary text-lg font-medium hover:no-underline transition-opacity hover:opacity-70"
            >
              Sair
            </Button>
          ) : null}
        </div>
      </div> */}
    </header>
  );
}
