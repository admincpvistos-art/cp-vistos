"use client";

import Link from "next/link";
import Image from "next/image";
import { useWindowScroll } from "react-use";

import { NotificationHeaderMenu } from "@/components/dashboard/notification-header-menu";
import { MobileFormMenu } from "./mobile-form-menu";
import { UserAccountMenu } from "./user-account-menu";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "next-auth/react";

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
  const { data } = trpc.userRouter.getMe.useQuery(undefined, {
    enabled: session.status === "authenticated",
    retry: false,
  });

  const showNotifications =
    isCollab ||
    data?.user.role === "ADMIN" ||
    data?.user.role === "COLLABORATOR";

  return (
    <header className="w-full h-20 fixed top-0 left-0 right-0 z-30 sm:top-4">
      {/* Barra azul translúcida — destaca a logo branca oficial */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-20 bg-[#0b3a6e]/88 backdrop-blur-xl border-b border-white/15 shadow-[0_8px_30px_rgba(11,58,110,0.22)] transition-[background-color,box-shadow] duration-300 sm:inset-x-4 sm:rounded-2xl sm:border sm:h-20",
          y > 8 && "bg-[#0b3a6e]/95 shadow-[0_10px_36px_rgba(11,58,110,0.32)]",
        )}
      />

      <div className="relative z-40 w-full h-20 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1920px] mx-auto flex items-center justify-between">
        <Link href="/" className="relative w-[4.75rem] h-[4.75rem] shrink-0" aria-label="CP Vistos">
          <Image
            src="/assets/images/cp-vistos-logo.png"
            alt="CP Vistos"
            fill
            priority
            className="object-center object-contain drop-shadow-sm"
          />
        </Link>

        <div className="flex items-center gap-3 h-full">
          {isForm && (
            <div className="lg:hidden">
              <MobileFormMenu
                isEditing={isEditing}
                currentStep={currentStep}
                profileId={profileId}
                formStep={formStep}
                onBrand
              />
            </div>
          )}

          {showNotifications && <NotificationHeaderMenu onBrand />}

          <UserAccountMenu onBrand />
        </div>
      </div>
    </header>
  );
}
