"use client";

import useDashboardSidebarStore from "@/constants/stores/useDashboardSidebarStore";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const collapsed = useDashboardSidebarStore((state) => state.collapsed);

  return (
    <div
      className="w-full h-full relative pt-20 sm:pt-36"
      style={
        {
          "--dashboard-sidebar-width": collapsed ? "72px" : "250px",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
