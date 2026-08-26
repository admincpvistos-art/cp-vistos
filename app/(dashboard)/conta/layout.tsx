import { DashboardHeader } from "@/app/(dashboard)/perfil/components/dashboard-header";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen relative pt-24 sm:pt-28">
      <DashboardHeader />
      {children}
    </div>
  );
}
