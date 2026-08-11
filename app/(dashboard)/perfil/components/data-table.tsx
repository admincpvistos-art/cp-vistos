"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import useClientDetailsModalStore from "@/constants/stores/useClientDetailsModalStore";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  category: "american_visa" | "passport" | "e_ta";
}

export function DataTable<TData, TValue>({ columns, data, category }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    name: false,
    cpf: false,
    group: false,
    CASVDate: false,
    interviewDate: false,
    meetingDate: false,
    visaType: false,
    visaStatus: false,
    scheduleAccount: false,
    shipping: false,
    tax: false,
    statusDS: false,
    responsibleCpf: false,
    protocol: false,
    entryDate: false,
    scheduleDate: false,
    process: false,
    passport: false,
    ETAStatus: false,
  });
  const { openModal, setClient, setToResume } =
    //eslint-disable-next-line
    useClientDetailsModalStore();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const { mutate: handleOpenDetailsModal, isPending } = trpc.userRouter.getClientDetails.useMutation({
    onSuccess({ client }) {
      console.log({ clientBirthDate: client.birthDate });

      setClient(client);
      openModal();
      setToResume();
    },
    onError(error) {
      console.error(error.data);

      if (error.data && error.data.code === "NOT_FOUND") {
        toast.error(error.message);
      } else {
        toast.error("Ocorreu um erro ao abrir os detalhes do perfil!");
      }
    },
  });

  useEffect(() => {
    if (category === "american_visa") {
      setColumnVisibility({
        id: false,
        name: true,
        cpf: true,
        group: true,
        CASVDate: true,
        interviewDate: true,
        meetingDate: true,
        visaType: true,
        visaStatus: true,
        scheduleAccount: true,
        shipping: true,
        tax: true,
        statusDS: true,
        responsibleCpf: false,
        protocol: false,
        entryDate: false,
        scheduleDate: false,
        process: false,
        passport: false,
        ETAStatus: false,
      });
    }

    if (category === "e_ta") {
      setColumnVisibility({
        id: false,
        name: true,
        group: true,
        CASVDate: false,
        interviewDate: false,
        meetingDate: false,
        DSValid: false,
        scheduleAccount: false,
        statusDS: false,
        tax: false,
        visaType: false,
        visaStatus: false,
        shipping: false,
        cpf: true,
        responsibleCpf: false,
        protocol: false,
        entryDate: false,
        scheduleDate: false,
        process: true,
        passport: true,
        ETAStatus: true,
      });
    }

    if (category === "passport") {
      setColumnVisibility({
        id: false,
        name: true,
        group: true,
        CASVDate: false,
        interviewDate: false,
        meetingDate: false,
        DSValid: false,
        scheduleAccount: false,
        statusDS: false,
        tax: false,
        visaType: false,
        visaStatus: false,
        shipping: false,
        cpf: true,
        responsibleCpf: true,
        protocol: true,
        entryDate: true,
        scheduleDate: true,
        process: false,
        passport: false,
        ETAStatus: false,
      });
    }
  }, [category]);

  return (
    <div>
      <div className="flex items-center py-4">
        <div className="h-12 flex items-center gap-2 border border-muted/70 rounded-xl transition duration-300 bg-background px-3 py-2 text-sm group focus-within:border-primary hover:border-border w-full sm:max-w-xs">
          <Search className="w-5 h-5 text-border flex-shrink-0" strokeWidth={1.5} />

          <div className="w-[2px] flex-shrink-0 h-full bg-muted rounded-full" />

          <Input
            placeholder="Pesquise pelo nome..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="flex h-full w-full transition border-0 duration-300 bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0  disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-white">
        <Table containerClassName="max-h-[min(70vh,720px)]">
          <TableHeader className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-white border-b-0">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "sticky top-0 z-20 bg-white text-center whitespace-nowrap",
                      header.column.id === "name" &&
                        "left-0 z-30 min-w-52 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                    )}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() =>
                    handleOpenDetailsModal({
                      profileId: row.getValue("id"),
                    })
                  }
                  className={cn("group cursor-pointer", {
                    "cursor-not-allowed pointer-events-none opacity-70": isPending,
                  })}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "text-center text-foreground font-medium",
                        cell.column.id === "name" &&
                          "sticky left-0 z-10 min-w-52 bg-white group-hover:bg-muted/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sem resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="w-full flex items-center justify-between">
        <div className="hidden sm:flex w-[100px] items-center justify-center text-sm font-medium">
          Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="w-full flex items-center justify-between space-x-2 py-4 sm:justify-end sm:w-fit">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>

          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
