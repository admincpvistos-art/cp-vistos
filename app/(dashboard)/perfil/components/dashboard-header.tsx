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
    <header className="w-full bg-transparent h-20 fixed top-0 left-0 right-0 z-30 sm:top-4">
      <div
        className={cn(
          "w-full h-20 absolute top-0 left-0 transform -translate-y-full bg-white/35 backdrop-blur-lg rounded-b-xl transition-transform duration-500 sm:rounded-b-3xl sm:h-[calc(80px+32px)] sm:-translate-y-[calc(100%+16px)]",
          {
            "translate-y-0 sm:-translate-y-4": y > 0,
          },
        )}
      />

      <div className="relative z-40 w-full h-20 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1920px] mx-auto flex items-center justify-between">
        <Link href="/" className="relative w-20 h-20">
          <Image
            src="/assets/images/cp-vistos-logo-azul.png"
            alt="CP Vistos Logo"
            fill
            className="object-center object-contain"
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
              />
            </div>
          )}

          {showNotifications && <NotificationHeaderMenu />}

          <UserAccountMenu />
        </div>
      </div>
    </header>
  );
}
