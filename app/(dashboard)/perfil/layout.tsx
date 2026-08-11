import { DashboardMobileMenu } from "@/app/(dashboard)/perfil/components/dashboard-mobile-menu";
import { DashboardMenu } from "@/app/(dashboard)/perfil/components/dashboard-menu";
import { DashboardHeader } from "@/app/(dashboard)/perfil/components/dashboard-header";
import { DashboardShell } from "@/app/(dashboard)/perfil/components/dashboard-shell";
import { NotificationModal } from "@/components/dashboard/notification-modal";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <DashboardHeader isCollab />
      <DashboardMobileMenu />
      <NotificationModal />

      <div className="h-full lg:min-h-full w-full flex">
        <DashboardMenu />
        {children}
      </div>
    </DashboardShell>
  );
}
