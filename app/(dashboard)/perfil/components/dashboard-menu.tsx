"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  KeyRound,
  UserPlus,
  Users,
  UserSearch,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc-client";
import useUserStore from "@/constants/stores/useUserStore";
import useDashboardSidebarStore from "@/constants/stores/useDashboardSidebarStore";

const mainLinks = [
  { href: "/perfil/clientes", label: "Clientes", icon: Users },
  { href: "/perfil/prospects", label: "Prospects", icon: UserSearch },
  { href: "/perfil/arquivados", label: "Arquivados", icon: Archive },
  { href: "/perfil/criar-conta", label: "Criar Conta", icon: UserPlus },
] as const;

const adminLinks = [
  {
    href: "/perfil/gerenciar-colaboradores",
    label: "Colaboradores",
    icon: Users,
  },
  {
    href: "/perfil/gerenciar-banners",
    label: "Gerenciar Banners",
    icon: ImageIcon,
  },
  { href: "/perfil/alterar-senha", label: "Alterar Senha", icon: KeyRound },
] as const;

export function DashboardMenu() {
  const { role, setRole } = useUserStore();
  const { collapsed, toggle } = useDashboardSidebarStore();
  const pathname = usePathname();
  const { data } = trpc.userRouter.getRole.useQuery();

  useEffect(() => {
    if (data) {
      setRole(data.role);
    }
  }, [data, setRole]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "hidden lg:flex h-full lg:min-h-full flex-col justify-between border-r border-secondary lg:fixed lg:top-0 lg:left-0 z-20 bg-background transition-[width,padding] duration-300",
          collapsed ? "w-[72px] px-3 py-6" : "w-[250px] p-6",
        )}
      >
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              "flex items-center",
              collapsed ? "justify-center" : "justify-end",
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              className="h-9 w-9 shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </div>

          <ul className="mt-2 flex flex-col gap-2">
            {mainLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              const link = (
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xl transition-colors hover:bg-secondary/50",
                    {
                      "font-semibold bg-secondary/40": isActive,
                      "justify-center px-0": collapsed,
                    },
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );

              return (
                <li key={href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}

            {role === "ADMIN" && (
              <>
                <div className="w-full h-px bg-muted my-2" />

                {adminLinks.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    pathname === href || pathname.startsWith(`${href}/`);
                  const link = (
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xl transition-colors hover:bg-secondary/50",
                        {
                          "font-semibold bg-secondary/40": isActive,
                          "justify-center px-0": collapsed,
                        },
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="leading-tight">{label}</span>}
                    </Link>
                  );

                  return (
                    <li key={href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </>
            )}
          </ul>
        </div>
      </div>
    </TooltipProvider>
  );
}
