"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Archive,
  ChevronDown,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  User,
  UserPlus,
  Users,
  Contact,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";

const collaboratorTools = [
  { href: "/perfil/clientes", label: "Clientes", icon: Users },
  { href: "/perfil/prospects", label: "Prospects", icon: Contact },
  { href: "/perfil/arquivados", label: "Arquivados", icon: Archive },
  { href: "/perfil/criar-conta", label: "Criar Conta", icon: UserPlus },
] as const;

const adminOnlyTools = [
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

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserAccountMenu() {
  const session = useSession();
  const [adminOpen, setAdminOpen] = useState(false);
  const { data } = trpc.userRouter.getMe.useQuery(undefined, {
    enabled: session.status === "authenticated",
    retry: false,
  });

  const user = data?.user;
  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isCollaborator = role === "ADMIN" || role === "COLLABORATOR";
  const displayName = user?.name || session.data?.user?.name || "Usuário";
  const displayEmail = user?.email || session.data?.user?.email || "";
  const imageUrl = user?.image || session.data?.user?.image || null;

  if (session.status === "unauthenticated") {
    return (
      <Button
        variant="outline"
        className="bg-secondary/40 border-secondary/40"
        asChild
      >
        <Link href="/login">Entrar</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setAdminOpen(false);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-11 w-11 rounded-full overflow-hidden bg-secondary/40 border-secondary/40"
          aria-label="Menu do usuário"
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={displayName}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-primary">
              {getInitials(displayName)}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 p-2 bg-background text-foreground border border-muted rounded-xl shadow-md"
      >        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {displayEmail}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/conta" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Meu Perfil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/perfil/alterar-senha" className="cursor-pointer">
            <KeyRound className="mr-2 h-4 w-4" />
            Alterar Senha
          </Link>
        </DropdownMenuItem>

        {isCollaborator && (
          <>
            <DropdownMenuSeparator />

            <button
              type="button"
              onPointerDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault();
                setAdminOpen((prev) => !prev);
              }}
              className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none text-foreground hover:bg-secondary/50"
            >
              <span className="font-medium">
                {isAdmin
                  ? "Ferramentas de Administração"
                  : "Ferramentas"}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  adminOpen && "rotate-180",
                )}
              />
            </button>

            {adminOpen && (
              <div className="mt-1 mb-1 ml-1 flex flex-col gap-0.5 border-l border-muted pl-2">
                {collaboratorTools.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} asChild>
                    <Link href={href} className="cursor-pointer">
                      <Icon className="mr-2 h-4 w-4" />
                      {label}
                    </Link>
                  </DropdownMenuItem>
                ))}

                {isAdmin &&
                  adminOnlyTools.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="cursor-pointer">
                        <Icon className="mr-2 h-4 w-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
              </div>
            )}
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
