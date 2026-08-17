"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import useClientDetailsModalStore from "@/constants/stores/useClientDetailsModalStore";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  category: "american_visa" | "passport" | "e_ta";
  listStatus?: "active" | "prospect" | "archived";
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function AddGroupMemberForm({
  category,
  listStatus,
}: {
  category: "american_visa" | "passport" | "e_ta";
  listStatus: "active" | "prospect" | "archived";
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [group, setGroup] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const utils = trpc.useUtils();

  const groupsQuery = trpc.userRouter.getClientGroups.useQuery();

  const { mutate, isPending } = trpc.userRouter.addGroupMember.useMutation({
    onSuccess: (data) => {
      setName("");
      setCpf("");
      setGroup("");
      setValues({});
      setOpen(false);
      toast.success(data.message);
      utils.userRouter.getActiveClients.invalidate();
      utils.userRouter.getProspectsClients.invalidate();
      utils.userRouter.getArchivedClients.invalidate();
      utils.userRouter.getClientGroups.invalidate();
      utils.serviceCostRouter.getRows.invalidate();
      utils.financeRouter.getChecklist.invalidate();
      utils.financeRouter.getSummary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível adicionar");
    },
  });

  function handleAdd() {
    if (!name.trim() || name.trim().length < 4) {
      toast.error("Informe o nome completo");
      return;
    }
    if (cpf.length !== 14) {
      toast.error("CPF inválido");
      return;
    }
    if (!group) {
      toast.error("Selecione o grupo");
      return;
    }

    mutate({
      name: name.trim(),
      cpf,
      group,
      category,
      status: listStatus,
      ...values,
    });
  }

  const setValue = (key: string, value: string) =>
    setValues((current) => {
      const next = { ...current };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
  const field = (key: string, label: string, type = "text") => (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input type={type} value={values[key] ?? ""} onChange={(event) => setValue(key, event.target.value)} disabled={isPending} />
    </label>
  );
  const select = (key: string, label: string, options: [string, string][]) => (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Select value={values[key] ?? ""} onValueChange={(value) => setValue(key, value)} disabled={isPending}>
        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
        <SelectContent>
          {options.map(([value, optionLabel]) => <SelectItem key={value} value={value}>{optionLabel}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="h-12">
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar cliente</DialogTitle>
          <DialogDescription>Preencha os dados disponíveis para esta linha da tabela.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            Nome completo
            <Input value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            CPF
            <Input value={cpf} onChange={(event) => setCpf(formatCpf(event.target.value))} disabled={isPending} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Grupo do titular
            <Select value={group} onValueChange={setGroup} disabled={isPending}>
              <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
              <SelectContent>
                {groupsQuery.data?.groups.map((groupName) => <SelectItem key={groupName} value={groupName}>{groupName}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>

          {category === "american_visa" && (
            <>
              {field("CASVDate", "Data do CASV", "date")}
              {field("interviewDate", "Data da entrevista", "date")}
              {field("interviewTime", "Horário da entrevista", "time")}
              {field("meetingDate", "Data da reunião", "date")}
              {select("visaType", "Tipo de visto", [["primeiro_visto", "Primeiro visto"], ["renovacao", "Renovação"]])}
              {select("visaStatus", "Andamento", [["awaiting", "Aguardando"], ["in_progress", "Em andamento"], ["approved", "Aprovado"], ["disapproved", "Reprovado"], ["finished", "Finalizado"]])}
              {select("scheduleAccount", "Conta de agendamento", [["active", "Ativa"], ["inactive", "Inativa"]])}
              {select("shipping", "Envio", [["verifying", "A verificar"], ["pickup", "Retirada"], ["sedex", "SEDEX"], ["c_pickup", "C-Retirada"], ["c_sedex", "C-SEDEX"]])}
              {field("taxDate", "Data da taxa", "date")}
              {select("statusDS", "DS-160", [["awaiting", "Aguardando"], ["filling", "Preenchendo"], ["filled", "Preenchido"], ["emitted", "Emitido"]])}
            </>
          )}
          {category === "passport" && (
            <>
              {field("responsibleCpf", "CPF do responsável")}
              {field("protocol", "Protocolo")}
              {field("entryDate", "Data de entrada", "date")}
              {field("scheduleDate", "Data do agendamento", "date")}
            </>
          )}
          {category === "e_ta" && (
            <>
              {select("process", "Classificação", [
                ["ESTA", "ESTA"],
                ["E-TA", "E-TA"],
              ])}
              {field("passport", "Passaporte")}
              {select("ETAStatus", "Andamento", [
                ["analysis", "Em análise"],
                ["approved", "Aprovado"],
                ["disapproved", "Reprovado"],
              ])}
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleAdd} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DataTable<TData, TValue>({ columns, data, category, listStatus = "active" }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    name: false,
    tripPriority: false,
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
        tripPriority: true,
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
        tripPriority: true,
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
        tripPriority: true,
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
      <div className="flex flex-col gap-3 py-4 xl:flex-row xl:items-center xl:justify-between">
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

        <AddGroupMemberForm category={category} listStatus={listStatus} />
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
                      header.column.id === "tripPriority" &&
                        "left-52 z-30 min-w-[7.5rem] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                      (header.column.id === "visaStatus" || header.column.id === "ETAStatus") &&
                        "right-0 z-30 min-w-40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]",
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
                        cell.column.id === "tripPriority" &&
                          "sticky left-52 z-10 min-w-[7.5rem] bg-white group-hover:bg-muted/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                        (cell.column.id === "visaStatus" || cell.column.id === "ETAStatus") &&
                          "sticky right-0 z-10 min-w-40 bg-white group-hover:bg-muted/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]",
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
