import { DashboardHeader } from "@/app/(dashboard)/perfil/components/dashboard-header";
import { NotificationModal } from "@/components/dashboard/notification-modal";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full relative pt-24 sm:pt-28">
      <DashboardHeader isCollab />
      <NotificationModal />
      <div className="h-full lg:min-h-full w-full">{children}</div>
    </div>
  );
}
