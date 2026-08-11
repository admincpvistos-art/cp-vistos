"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Bell, LogIn, LogOut, Users } from "lucide-react";
import { useWindowScroll } from "react-use";

import { Button } from "@/components/ui/button";
import { NotificationHeaderMenu } from "@/components/dashboard/notification-header-menu";
import { MobileFormMenu } from "./mobile-form-menu";

import { cn } from "@/lib/utils";

interface Props {
  isCollab?: boolean;
  isForm?: boolean;
  isEditing?: boolean;
  currentStep?: number;
  profileId?: string;
  formStep?: string | null;
}

export function DashboardHeader({
  isCollab,
  isForm,
  isEditing,
  currentStep,
  profileId,
  formStep,
}: Props) {
  const session = useSession();
  const { y } = useWindowScroll();

  return (
    <header
      className={cn(
        "w-full bg-transparent h-20 px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-30 sm:px-16 sm:top-4 lg:container transition-[left,width] duration-300",
        {
          "lg:left-[var(--dashboard-sidebar-width,250px)] lg:w-[calc(100%-var(--dashboard-sidebar-width,250px))]":
            isCollab,
        },
      )}
    >

      <div
        className={cn(
          "w-full h-20 absolute top-0 left-0 transform -translate-y-full bg-white/35 backdrop-blur-lg rounded-b-xl transition-transform duration-500 sm:rounded-b-3xl sm:h-[calc(80px+32px)] sm:-translate-y-[calc(100%+16px)]",
          {
            "translate-y-0 sm:-translate-y-4": y > 0,
          },
        )}
      />

      <Link href="/" className="relative w-20 h-20 z-40">
        <Image
          src="/assets/images/cp-vistos-logo-azul.png"
          alt="CP Vistos Logo"
          fill
          className="object-center object-contain"
        />
      </Link>

      <div className="lg:hidden h-full flex items-center gap-4 z-40">
        {isForm && (
          <MobileFormMenu
            isEditing={isEditing}
            currentStep={currentStep}
            profileId={profileId}
            formStep={formStep}
          />
        )}

        {isCollab && <NotificationHeaderMenu />}

        <Button
          variant="outline"
          asChild
          className="flex bg-secondary/40 border-secondary/40 text-base lg:hidden"
        >
          {session.status === "authenticated" ? (
            <Link href="/verificando-usuario">
              <Users color="#314060" />
            </Link>
          ) : (
            <Link href="/login">
              <LogIn color="#314060" />
            </Link>
          )}
        </Button>

        <Button
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut />
        </Button>
      </div>

      <div className="hidden lg:flex items-center gap-4 h-full z-40">
        {isCollab && <NotificationHeaderMenu />}

        <Button
          variant="outline"
          className="hidden bg-secondary/40 border-secondary/40 lg:flex lg:items-center lg:gap-2"
          asChild
        >
          {session ? (
            <Link href="/verificando-usuario">
              Perfil
              <Users color="#314060" />
            </Link>
          ) : (
            <Link href="/login">
              Entrar
              <LogIn color="#314060" />
            </Link>
          )}
        </Button>

        <Button
          onClick={() => signOut({ callbackUrl: "/" })}
          variant="destructive"
          className="hidden lg:flex lg:items-center lg:gap-2"
        >
          Sair
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
