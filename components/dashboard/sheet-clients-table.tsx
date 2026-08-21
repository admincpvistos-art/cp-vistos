"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownAZ, ArrowUpAZ, CheckCircle2, CircleAlert, Search } from "lucide-react";
import { isValid, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  barcodeValidityStatus,
  expireDateFromIssued,
  parseIssuedDate,
} from "@/lib/barcode-validity";
import { cn } from "@/lib/utils";

export type SheetClientRow = {
  id: string;
  name: string;
  barcode: string;
  barcodeIssued: string;
  barcodeDone: boolean;
  casv: string;
  interview: string;
  meeting: string;
  tax: string;
  dob: string;
  passport: string;
  email: string;
  entryDate: string;
  group: string;
  status: string;
};

export const SHEET_VISIBLE_COLUMNS: {
  key: Exclude<keyof SheetClientRow, "barcodeDone">;
  label: string;
}[] = [
  { key: "name", label: "NOME" },
  { key: "barcode", label: "BARCODE" },
  { key: "barcodeIssued", label: "DATA BARCODE" },
  { key: "casv", label: "CASV" },
  { key: "interview", label: "DT. ENTREV." },
  { key: "meeting", label: "REUNIÃO" },
  { key: "tax", label: "PGTO TAXA" },
  { key: "dob", label: "DOB" },
  { key: "passport", label: "PPT" },
  { key: "email", label: "E-MAIL" },
  { key: "entryDate", label: "DT. ENTRADA" },
  { key: "group", label: "GRUPO" },
  { key: "status", label: "STATUS" },
];

function BarcodeDateCell({ issued, done }: { issued: string; done: boolean }) {
  if (!issued) {
    return <span>—</span>;
  }

  if (done) {
    return (
      <span className="inline-flex items-center justify-center gap-2">
        {issued}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <CheckCircle2 className="text-emerald-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Barcode feito</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
    );
  }

  const parsed = parseIssuedDate(issued);
  const status = parsed ? barcodeValidityStatus(expireDateFromIssued(parsed)) : "none";

  return (
    <span className="inline-flex items-center justify-center gap-2">
      {issued}
      {status === "expired" ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="text-rose-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Barcode vencido</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : status === "warning" ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <CircleAlert className="text-amber-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Barcode vence em 15 dias ou menos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </span>
  );
}

function entryTime(value: string) {
  if (!value) {
    return 0;
  }

  const parsed = parse(value, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed.getTime() : 0;
}

export function SheetClientsTable({
  rows,
  emptyMessage = "Sem resultados",
  footerLabel = "clientes",
  onRowClick,
}: {
  rows: SheetClientRow[];
  emptyMessage?: string;
  footerLabel?: string;
  onRowClick?: (row: SheetClientRow) => void;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const statusIndex = SHEET_VISIBLE_COLUMNS.findIndex((column) => column.key === "status");

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matched = term
      ? rows.filter((row) =>
          SHEET_VISIBLE_COLUMNS.some(({ key }) =>
            String(row[key] ?? "").toLowerCase().includes(term),
          ),
        )
      : [...rows];

    const newestByGroup = new Map<string, number>();
    for (const row of matched) {
      const key = (row.group?.trim() || row.id).toLowerCase();
      const time = entryTime(row.entryDate);
      const current = newestByGroup.get(key) ?? 0;
      if (time > current) {
        newestByGroup.set(key, time);
      }
    }

    return matched.sort((a, b) => {
      const groupA = (a.group?.trim() || a.id).toLowerCase();
      const groupB = (b.group?.trim() || b.id).toLowerCase();
      if (groupA !== groupB) {
        const timeA = newestByGroup.get(groupA) ?? 0;
        const timeB = newestByGroup.get(groupB) ?? 0;
        return sort === "desc" ? timeB - timeA : timeA - timeB;
      }

      const diff = entryTime(b.entryDate) - entryTime(a.entryDate);
      return sort === "desc" ? diff : -diff;
    });
  }, [rows, search, sort]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <div className="h-12 flex items-center gap-2 border border-muted/70 rounded-xl transition duration-300 bg-background px-3 py-2 text-sm group focus-within:border-primary hover:border-border w-full sm:max-w-xs">
          <Search className="w-5 h-5 text-border flex-shrink-0" strokeWidth={1.5} />
          <div className="w-[2px] flex-shrink-0 h-full bg-muted rounded-full" />
          <Input
            placeholder="Pesquise na planilha..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="flex h-full w-full transition border-0 duration-300 bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={() => setSort((prev) => (prev === "desc" ? "asc" : "desc"))}
        >
          {sort === "desc" ? (
            <>
              <ArrowDownAZ className="mr-2 h-4 w-4" />
              Mais recentes
            </>
          ) : (
            <>
              <ArrowUpAZ className="mr-2 h-4 w-4" />
              Mais antigos
            </>
          )}
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden bg-white">
        <Table containerClassName="max-h-[min(75vh,800px)]">
          <TableHeader className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
            <TableRow className="hover:bg-white border-b-0">
              {SHEET_VISIBLE_COLUMNS.map((column, index) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "sticky top-0 z-20 bg-white text-center whitespace-nowrap",
                    index === 0 && "left-0 z-30 min-w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                    index === statusIndex &&
                      "right-0 z-30 min-w-36 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn("group", onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row)}
                >
                  {SHEET_VISIBLE_COLUMNS.map((column, index) => (
                    <TableCell
                      key={`${row.id}-${column.key}`}
                      className={cn(
                        "text-center text-foreground whitespace-nowrap",
                        column.key === "barcodeIssued" && "min-w-[10.5rem]",
                        index === 0 &&
                          "sticky left-0 z-10 min-w-64 text-left font-medium bg-white group-hover:bg-muted/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                        index === statusIndex &&
                          "sticky right-0 z-10 min-w-36 bg-white group-hover:bg-muted/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                      )}
                    >
                      {column.key === "name" ? (
                        <span className="text-primary hover:underline">{row.name || "—"}</span>
                      ) : column.key === "barcodeIssued" ? (
                        <BarcodeDateCell issued={row.barcodeIssued} done={row.barcodeDone} />
                      ) : (
                        String(row[column.key] || "—")
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={SHEET_VISIBLE_COLUMNS.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="mt-3 mb-8 text-sm text-muted-foreground">
        {filteredRows.length} {footerLabel}
        {filteredRows.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
