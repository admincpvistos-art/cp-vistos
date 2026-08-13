"use client";

import { ReactNode, useEffect } from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { canAccessDs160 } from "@/lib/staff-access";
import { trpc } from "@/lib/trpc-client";

export function AdminOnly({ children }: { children: ReactNode }) {
  const session = useSession();
  const { data, isPending } = trpc.userRouter.getMe.useQuery(undefined, {
    enabled: session.status === "authenticated",
    retry: false,
  });

  useEffect(() => {
    if (session.status === "unauthenticated") {
      toast.error("Usuário não autorizado");
      redirect("/");
    }
  }, [session.status]);

  if (session.status === "loading" || isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canAccessDs160(data?.user.role, data?.user.email)) {
    return (
      <div className="px-6 py-16 text-center text-sm text-muted-foreground">
        Esta ferramenta é exclusiva dos logins de administrador.
      </div>
    );
  }

  return <>{children}</>;
}
