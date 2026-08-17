"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Archive,
  ChevronDown,
  Code2,
  Database,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  Mail,
  Server,
  User,
  UserPlus,
  Users,
  Contact,
  ClipboardCheck,
  ClipboardList,
  FileInput,
  Table2,
  Wallet,
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
import {
  canAccessFinance as canAccessFinanceTools,
  isFullAdmin,
  isOfficeCollaboratorEmail,
} from "@/lib/staff-access";

const collaboratorTools = [
  { href: "/perfil/clientes", label: "Clientes", icon: Users },
  { href: "/perfil/prospects", label: "Prospects", icon: Contact },
  { href: "/perfil/arquivados", label: "Arquivados", icon: Archive },
  { href: "/perfil/criar-conta", label: "Criar Conta", icon: UserPlus },
] as const;

const officeCollaboratorTools = [
  { href: "/perfil/clientes", label: "Clientes", icon: Users },
  {
    href: "/perfil/conferir-formularios",
    label: "Conferir Formulários",
    icon: ClipboardCheck,
  },
  { href: "/perfil/preencher-ds160", label: "Preencher DS-160", icon: FileInput },
  { href: "/perfil/prospects", label: "Prospects", icon: Contact },
  { href: "/perfil/arquivados", label: "Arquivados", icon: Archive },
] as const;

const adminOnlyTools = [
  {
    href: "/perfil/gerenciar-colaboradores",
    label: "Colaboradores",
    icon: Users,
  },
] as const;

const developmentInternalTools = [
  {
    href: "/perfil/gerenciar-banners",
    label: "Gerenciar Banners",
    icon: ImageIcon,
  },
] as const;

const developmentExternalTools = [
  {
    href: "https://vercel.com",
    label: "Vercel",
    icon: Globe,
  },
  {
    href: "https://github.com/admincpvistos-art/cp-vistos",
    label: "Github",
    icon: Code2,
  },
  {
    href: "https://cloud.mongodb.com",
    label: "Mongo Atlas",
    icon: Database,
  },
  {
    href: "https://hpanel.hostinger.com",
    label: "Hostinger",
    icon: Server,
  },
  {
    href: "https://mail.google.com",
    label: "Gmail",
    icon: Mail,
  },
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

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        onPointerDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
        className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none text-[#314060] hover:bg-[#d4e0f5]"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-1 mb-1 ml-1 flex flex-col gap-0.5 border-l border-muted pl-2">
          {children}
        </div>
      )}
    </>
  );
}

export function UserAccountMenu() {
  const session = useSession();
  const [adminOpen, setAdminOpen] = useState(true);
  const [devOpen, setDevOpen] = useState(false);
  const { data } = trpc.userRouter.getMe.useQuery(undefined, {
    enabled: session.status === "authenticated",
    retry: false,
  });

  const user = data?.user;
  const role = user?.role;
  const displayName = user?.name || session.data?.user?.name || "Usuário";
  const displayEmail = user?.email || session.data?.user?.email || "";
  const imageUrl = user?.image || session.data?.user?.image || null;
  const isOfficeCollab = isOfficeCollaboratorEmail(displayEmail);
  const isAdmin = isFullAdmin(role, displayEmail);
  const isCollaborator = role === "ADMIN" || role === "COLLABORATOR";
  const canAccessFinance = canAccessFinanceTools(role, displayEmail);

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
        if (open) {
          setAdminOpen(true);
          setDevOpen(false);
        } else {
          setDevOpen(false);
        }
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
        collisionPadding={16}
        className="w-72 p-2 max-h-[min(80vh,calc(100dvh-5.5rem))] overflow-y-auto overscroll-contain !bg-white !text-[#314060] border border-secondary rounded-xl shadow-lg"
        style={{ backgroundColor: "#ffffff", color: "#314060" }}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              {displayName}
            </span>
            <span className="text-xs text-[#6b7280] truncate">
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

            <CollapsibleSection
              title={
                isOfficeCollab
                  ? "Colaborador administrador"
                  : isAdmin
                    ? "Ferramentas de Administração"
                    : "Ferramentas"
              }
              open={adminOpen}
              onToggle={() =>
                setAdminOpen((prev) => {
                  const next = !prev;
                  if (next) setDevOpen(false);
                  return next;
                })
              }
            >
              {isOfficeCollab
                ? officeCollaboratorTools.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="cursor-pointer">
                        <Icon className="mr-2 h-4 w-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))
                : collaboratorTools.map(({ href, label, icon: Icon }) => (
                    <div key={href} className="contents">
                      {href === "/perfil/clientes" && isAdmin ? (
                        <DropdownMenuItem asChild>
                          <Link
                            href="/perfil/acompanhamento-clientes"
                            className="cursor-pointer"
                          >
                            <Table2 className="mr-2 h-4 w-4" />
                            Acompanhamento Clientes
                          </Link>
                        </DropdownMenuItem>
                      ) : null}

                      <DropdownMenuItem asChild>
                        <Link href={href} className="cursor-pointer">
                          <Icon className="mr-2 h-4 w-4" />
                          {label}
                        </Link>
                      </DropdownMenuItem>

                      {href === "/perfil/clientes" && isAdmin ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/perfil/conferir-formularios"
                              className="cursor-pointer"
                            >
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              Conferir Formulários
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/perfil/preencher-ds160"
                              className="cursor-pointer"
                            >
                              <FileInput className="mr-2 h-4 w-4" />
                              Preencher DS-160
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : null}

                      {href === "/perfil/clientes" && canAccessFinance && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/perfil/servicos-e-custos"
                              className="cursor-pointer"
                            >
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Serviços e Custos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/perfil/financeiro"
                              className="cursor-pointer"
                            >
                              <Wallet className="mr-2 h-4 w-4" />
                              Financeiro
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                    </div>
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
            </CollapsibleSection>
          </>
        )}

        {isAdmin && (
          <>
            <DropdownMenuSeparator />

            <CollapsibleSection
              title="Ferramentas de Desenvolvimento"
              open={devOpen}
              onToggle={() =>
                setDevOpen((prev) => {
                  const next = !prev;
                  // Ao abrir desenvolvimento, recolhe admin para caber na tela
                  if (next) setAdminOpen(false);
                  else setAdminOpen(true);
                  return next;
                })
              }
            >
              {developmentInternalTools.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className="cursor-pointer">
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}

              {developmentExternalTools.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="flex-1">{label}</span>
                    <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-60" />
                  </a>
                </DropdownMenuItem>
              ))}
            </CollapsibleSection>
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
