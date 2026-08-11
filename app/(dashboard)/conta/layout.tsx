import { DashboardHeader } from "@/app/(dashboard)/perfil/components/dashboard-header";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen relative pt-20 sm:pt-36">
      <DashboardHeader />
      {children}
    </div>
  );
}
