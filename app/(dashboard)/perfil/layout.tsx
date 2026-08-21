import { DashboardHeader } from "@/app/(dashboard)/perfil/components/dashboard-header";
import { AcompanhamentoSyncWorker } from "@/app/(dashboard)/perfil/components/acompanhamento-sync-worker";
import { NotificationModal } from "@/components/dashboard/notification-modal";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full relative pt-20 sm:pt-36">
      <DashboardHeader isCollab />
      <NotificationModal />
      <AcompanhamentoSyncWorker />
      <div className="h-full lg:min-h-full w-full">{children}</div>
    </div>
  );
}
