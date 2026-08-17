"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc-client";
import { isFullAdmin } from "@/lib/staff-access";
import { cn } from "@/lib/utils";

export default function AcompanhamentoClientesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: me, isLoading: isMeLoading } = trpc.userRouter.getMe.useQuery(undefined, {
    retry: false,
  });
  const isAdmin = isFullAdmin(me?.user.role, me?.user.email);

  const { data, isLoading, isError, error } = trpc.acompanhamentoRouter.getClientesSheet.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });

  useEffect(() => {
    if (!me || isMeLoading) {
      return;
    }

    if (!isAdmin) {
      toast.error("Acesso não autorizado");
      router.push("/perfil/clientes");
    }
  }, [isAdmin, isMeLoading, me, router]);

  const filteredRows = useMemo(() => {
    if (!data?.rows) {
      return [];
    }

    const term = search.trim().toLowerCase();
    if (!term) {
      return data.rows;
    }

    return data.rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(term)));
  }, [data?.rows, search]);

  const statusIndex = data?.headers.findIndex((header) => header === "STATUS") ?? -1;

  if (!me || isMeLoading || !isAdmin) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1920px] mx-auto">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6 mt-6 lg:mt-12">
        Acompanhamento Clientes
      </h1>

      <div className="h-12 flex items-center gap-2 border border-muted/70 rounded-xl transition duration-300 bg-background px-3 py-2 text-sm group focus-within:border-primary hover:border-border w-full sm:max-w-xs mb-4">
        <Search className="w-5 h-5 text-border flex-shrink-0" strokeWidth={1.5} />
        <div className="w-[2px] flex-shrink-0 h-full bg-muted rounded-full" />
        <Input
          placeholder="Pesquise na planilha..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex h-full w-full transition border-0 duration-300 bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{error.message || "Não foi possível carregar a planilha"}</p>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <Table containerClassName="max-h-[min(75vh,800px)]">
            <TableHeader className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
              <TableRow className="hover:bg-white border-b-0">
                {data?.headers.map((header, index) => (
                  <TableHead
                    key={`${header}-${index}`}
                    className={cn(
                      "sticky top-0 z-20 bg-white text-center whitespace-nowrap",
                      index === 0 && "left-0 z-30 min-w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                      index === statusIndex &&
                        "right-0 z-30 min-w-36 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                    )}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length ? (
                filteredRows.map((row, rowIndex) => (
                  <TableRow key={`${row[0]}-${rowIndex}`} className="group">
                    {row.map((cell, cellIndex) => (
                      <TableCell
                        key={`${rowIndex}-${cellIndex}`}
                        className={cn(
                          "text-center text-foreground whitespace-nowrap",
                          cellIndex === 0 &&
                            "sticky left-0 z-10 min-w-64 text-left font-medium bg-white group-hover:bg-muted/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                          cellIndex === statusIndex &&
                            "sticky right-0 z-10 min-w-36 bg-white group-hover:bg-muted/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                        )}
                      >
                        {cell || "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={data?.headers.length ?? 1} className="h-24 text-center">
                    Sem resultados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="mt-3 mb-8 text-sm text-muted-foreground">
        {filteredRows.length} cliente{filteredRows.length === 1 ? "" : "s"} na aba CLIENTES
      </p>
    </div>
  );
}
