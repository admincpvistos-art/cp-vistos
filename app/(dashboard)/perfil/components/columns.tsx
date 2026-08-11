"use client";

import { ColumnDef } from "@tanstack/react-table";
import { differenceInDays, format } from "date-fns";
import { AlertTriangle, ArrowUpDown } from "lucide-react";
import { ETAStatus, ScheduleAccount, Shipping, StatusDS, VisaStatus, VisaType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  tripPriorityLabel,
  tripPriorityRank,
  type TripPriority,
} from "@/lib/trip-priority";
import { cn } from "@/lib/utils";

export type UserTable = {
  id: string;
  name: string;
  CASVDate: Date | null;
  interviewDate: Date | null;
  meetingDate: Date | null;
  DSValid: Date | null;
  visaType: VisaType;
  scheduleAccount: ScheduleAccount;
  shipping: Shipping;
  tax: boolean;
  statusDS: StatusDS;
  cpf: string | null;
  responsibleCpf: string | null;
  protocol: string | null;
  entryDate: Date | null;
  scheduleDate: Date | null;
  process: string | null;
  passport: string | null;
  ETAStatus: ETAStatus;
  tripPriority: TripPriority | null;
  visaStatus?: VisaStatus;
  group?: string;
};

function TripPriorityBadge({ priority }: { priority: TripPriority | null }) {
  const label = tripPriorityLabel(priority);
  if (!label || !priority) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        priority === "urgente" && "bg-red-100 text-red-700",
        priority === "media" && "bg-amber-100 text-amber-800",
        priority === "baixa" && "bg-emerald-100 text-emerald-700",
      )}
    >
      {label}
    </span>
  );
}

export const columns: ColumnDef<UserTable>[] = [
  {
    accessorKey: "id",
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <span className="block min-w-52">{row.getValue("name")}</span>;
    },
  },
  {
    accessorKey: "tripPriority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    sortingFn: (rowA, rowB) =>
      tripPriorityRank(rowA.original.tripPriority) -
      tripPriorityRank(rowB.original.tripPriority),
    cell: ({ row }) => (
      <div className="min-w-[7.5rem] flex justify-center">
        <TripPriorityBadge priority={row.original.tripPriority} />
      </div>
    ),
  },
  {
    accessorKey: "cpf",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          CPF
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <span className="block min-w-36">{row.getValue("cpf")}</span>;
    },
  },
  {
    accessorKey: "responsibleCpf",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          CPF do Responsável
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("responsibleCpf")) {
        return <span>---</span>;
      }

      return <span className="block min-w-36">{row.getValue("responsibleCpf")}</span>;
    },
  },
  {
    accessorKey: "protocol",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Protocolo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("protocol")) {
        return <span>---</span>;
      }

      return <span>{row.getValue("protocol")}</span>;
    },
  },
  {
    accessorKey: "entryDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Data de Entrada
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("entryDate")) {
        return <span>--/--/----</span>;
      }

      const dateFormatted = format(row.getValue("entryDate"), "dd/MM/yyyy");

      return <span>{dateFormatted}</span>;
    },
  },
  {
    accessorKey: "scheduleDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Data do Agendamento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("scheduleDate")) {
        return <span>--/--/----</span>;
      }

      const dateFormatted = format(row.getValue("scheduleDate"), "dd/MM/yyyy");

      return <span>{dateFormatted}</span>;
    },
  },
  {
    accessorKey: "process",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Processo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("process")) {
        return <span>---</span>;
      }

      return <span>{row.getValue("process")}</span>;
    },
  },
  {
    accessorKey: "passport",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Passaporte
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("passport")) {
        return <span>---</span>;
      }

      return <span>{row.getValue("passport")}</span>;
    },
  },
  {
    accessorKey: "ETAStatus",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Andamento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      let ETAStatus;

      const value = row.getValue("ETAStatus") as ETAStatus;

      switch (value) {
        case "analysis":
          ETAStatus = "Em analise";
          break;
        case "approved":
          ETAStatus = "Aprovado";
          break;
        case "disapproved":
          ETAStatus = "Reprovado";
          break;
        default:
          ETAStatus = "Em analise";
          break;
      }

      return <span>{ETAStatus}</span>;
    },
  },
  {
    accessorKey: "DSValid",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Data Barcode
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("DSValid")) {
        return <span>--/--/----</span>;
      }

      const dateFormatted = format(row.getValue("DSValid"), "dd/MM/yyyy");

      return (
        <span className="w-full flex items-center justify-center gap-2">
          {dateFormatted}
          {differenceInDays(row.getValue("DSValid"), new Date()) <= -30 ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="text-rose-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vencido</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : differenceInDays(row.getValue("DSValid"), new Date()) <= -20 ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="text-amber-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Proximo do vencimento</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </span>
      );
    },
  },
  {
    accessorKey: "CASVDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          CASV
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("CASVDate")) {
        return <span>--/--/----</span>;
      }

      const dateFormatted = format(row.getValue("CASVDate"), "dd/MM/yyyy");

      return <span>{dateFormatted}</span>;
    },
  },
  {
    accessorKey: "interviewDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Entrevista
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("interviewDate")) {
        return <span>--/--/----</span>;
      }

      const dateFormatted = format(row.getValue("interviewDate"), "dd/MM/yyyy");

      return <span>{dateFormatted}</span>;
    },
  },
  {
    accessorKey: "meetingDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Reunião
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("meetingDate")) {
        return <span>--/--/----</span>;
      }

      const dateFormatted = format(row.getValue("meetingDate"), "dd/MM/yyyy");

      return <span>{dateFormatted}</span>;
    },
  },
  {
    accessorKey: "shipping",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Envio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      let shipping;

      const value = row.getValue("shipping") as Shipping;

      switch (value) {
        case "verifying":
          shipping = "A Verificar";
          break;
        case "pickup":
          shipping = "Retirada";
          break;
        case "sedex":
          shipping = "SEDEX";
          break;
        case "c_pickup":
          shipping = "C-Retirada";
          break;
        case "c_sedex":
          shipping = "C-SEDEX";
          break;
        default:
          shipping = "A Verificar";
          break;
      }

      return <span>{shipping}</span>;
    },
  },
  {
    accessorKey: "visaType",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Visto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      let visaType;

      const value = row.getValue("visaType") as VisaType;

      switch (value) {
        case "primeiro_visto":
          visaType = "Primeiro Visto";
          break;
        case "renovacao":
          visaType = "Renovação";
          break;
      }

      return <span>{visaType}</span>;
    },
  },
  {
    accessorKey: "scheduleAccount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Agendamento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      let scheduleAccount;

      const value = row.getValue("scheduleAccount") as ScheduleAccount;

      switch (value) {
        case "active":
          scheduleAccount = "Ativo";
          break;
        case "inactive":
          scheduleAccount = "Inativo";
          break;
      }

      return <span>{scheduleAccount}</span>;
    },
  },
  {
    accessorKey: "tax",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Taxa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      let tax;

      const value = row.getValue("tax") as boolean;

      if (value) {
        tax = "Pago";
      } else {
        tax = "Pendente";
      }

      return <span>{tax}</span>;
    },
  },
  {
    accessorKey: "statusDS",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          DS-160
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      let statusDS;

      const value = row.getValue("statusDS") as StatusDS;

      switch (value) {
        case "awaiting":
          statusDS = "Aguardando";
          break;
        case "emitted":
          statusDS = "Emitido";
          break;
        case "filled":
          statusDS = "Preenchido";
          break;
        case "filling":
          statusDS = "Preenchendo";
          break;
      }

      return <span>{statusDS}</span>;
    },
  },
  {
    accessorKey: "group",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Grupo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (!row.getValue("group")) {
        return <span>----</span>;
      }

      return <span>{row.getValue("group")}</span>;
    },
  },
  {
    accessorKey: "visaStatus",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-center w-full"
        >
          Andamento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      let visaStatus;

      const value = row.getValue("visaStatus") as VisaStatus;

      switch (value) {
        case "awaiting":
          visaStatus = "Aguardando";
          break;
        case "in_progress":
          visaStatus = "Em Andamento";
          break;
        case "approved":
          visaStatus = "Aprovado";
          break;
        case "disapproved":
          visaStatus = "Reprovado";
          break;
        case "finished":
          visaStatus = "Finalizado";
          break;
      }

      return <span>{visaStatus}</span>;
    },
  },
];
