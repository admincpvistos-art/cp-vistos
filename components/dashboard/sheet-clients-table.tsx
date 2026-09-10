"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArchiveRestore,
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  CircleAlert,
  FileText,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { isValid, parse } from "date-fns";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SheetCommentBubble } from "@/components/dashboard/sheet-comment-bubble";
import {
  barcodeValidityStatus,
  expireDateFromIssued,
  parseIssuedDate,
} from "@/lib/barcode-validity";
import {
  ACOMPANHAMENTO_SERVICE_LABEL,
  type AcompanhamentoService,
} from "@/lib/acompanhamento-types";
import { cn } from "@/lib/utils";

export type SheetClientRow = {
  id: string;
  name: string;
  services?: AcompanhamentoService[];
  sheetComment?: string;
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
  /** ms — cadastro no sistema; usado na ordem padrão “mais recentes”. */
  registeredAt?: number;
  /** Perfil ESTA/E-TA — botão de formulário só quando preenchido abaixo. */
  estaProfileId?: string | null;
  estaFormStep?: number;
  estaStatusForm?: "" | "awaiting" | "filling" | "filled";
};

const ESTA_FORM_STEPS = 6;

function estaFormButtonLabel(
  statusForm: SheetClientRow["estaStatusForm"],
  formStep = 0,
): string {
  if (statusForm === "filled") {
    return "ESTA ✓";
  }

  if (statusForm === "filling" || formStep > 0) {
    return `ESTA · ${Math.min(formStep + 1, ESTA_FORM_STEPS)}/${ESTA_FORM_STEPS}`;
  }

  return "ESTA";
}

type VisibleColumn =
  | { key: keyof SheetClientRow; label: string }
  | { key: "services"; label: string }
  | { key: "delete"; label: string };

export const SHEET_VISIBLE_COLUMNS: VisibleColumn[] = [
  { key: "name", label: "NOME" },
  { key: "services", label: "SERVIÇO" },
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

function sheetColumnsWithDelete(showDelete: boolean): VisibleColumn[] {
  if (!showDelete) {
    return SHEET_VISIBLE_COLUMNS;
  }

  const columns = [...SHEET_VISIBLE_COLUMNS];
  const statusIndex = columns.findIndex((column) => column.key === "status");
  columns.splice(statusIndex >= 0 ? statusIndex : columns.length, 0, {
    key: "delete",
    label: "",
  });
  return columns;
}

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

function ServicesCell({ services }: { services: AcompanhamentoService[] }) {
  if (!services.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col items-center gap-0.5 leading-tight">
      {services.map((service) => (
        <span key={service} className="text-[11px] text-foreground">
          {ACOMPANHAMENTO_SERVICE_LABEL[service]}
        </span>
      ))}
    </div>
  );
}

function NameCell({
  row,
  onSaveComment,
  commentPending,
  canUnarchive,
  unarchivePending,
  onUnarchive,
}: {
  row: SheetClientRow;
  onSaveComment?: (rowId: string, comment: string) => Promise<void>;
  commentPending?: boolean;
  canUnarchive?: boolean;
  unarchivePending?: boolean;
  onUnarchive?: (row: SheetClientRow) => void;
}) {
  const estaLabel = estaFormButtonLabel(row.estaStatusForm, row.estaFormStep ?? 0);
  const estaFilled = row.estaStatusForm === "filled";
  const estaDraft = row.estaStatusForm === "filling" || (row.estaFormStep ?? 0) > 0;

  return (
    <div className="flex flex-col items-start gap-1 min-w-0">
      <div className="flex items-center gap-1.5 min-w-0 w-full">
        <SheetCommentBubble
          comment={row.sheetComment ?? ""}
          isPending={commentPending}
          title="Comentário"
          ariaLabel="Comentário do cliente"
          onSave={async (sheetComment) => {
            if (!onSaveComment) {
              toast.message("Comentário disponível quando houver clientes nesta aba");
              return;
            }
            await onSaveComment(row.id, sheetComment);
          }}
        />
        <span className="text-primary hover:underline truncate">{row.name || "—"}</span>
        {canUnarchive && onUnarchive && row.id.startsWith("db:") ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
            disabled={unarchivePending}
            title="Desarquivar — voltar ao Acompanhamento"
            onClick={(event) => {
              event.stopPropagation();
              onUnarchive(row);
            }}
          >
            {unarchivePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <ArchiveRestore className="h-3.5 w-3.5 mr-1" />
                Desarquivar
              </>
            )}
          </Button>
        ) : null}
      </div>

      {row.estaProfileId ? (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 shrink-0 px-2 text-xs gap-1",
            estaFilled && "border-emerald-200 text-emerald-700 hover:text-emerald-800",
            !estaFilled && !estaDraft && "text-muted-foreground",
          )}
          asChild
        >
          <Link
            href={`/perfil/esta-formulario/${row.estaProfileId}`}
            title="Ver formulário ESTA / E-TA preenchido pelo cliente"
            onClick={(event) => event.stopPropagation()}
          >
            <FileText className="h-3.5 w-3.5" />
            {estaLabel}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function entryTime(value: string) {
  if (!value) {
    return 0;
  }

  const parsed = parse(value, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed.getTime() : 0;
}

function rowRecency(row: SheetClientRow) {
  if (typeof row.registeredAt === "number" && row.registeredAt > 0) {
    return row.registeredAt;
  }
  return entryTime(row.entryDate);
}

function DeleteCell({
  row,
  isPending,
  onDelete,
}: {
  row: SheetClientRow;
  isPending?: boolean;
  onDelete: (row: SheetClientRow) => Promise<void> | void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="Excluir cliente do Acompanhamento"
        disabled={isPending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setConfirmOpen(true);
        }}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isPending) {
            setConfirmOpen(open);
          }
        }}
      >
        <AlertDialogContent
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {row.name.trim() ? (
                <>
                  <span className="font-medium text-foreground">{row.name.trim()}</span> sai do
                  Acompanhamento e vai para Arquivados. Financeiro e Serviços e Custos permanecem.
                </>
              ) : (
                "O cliente sai do Acompanhamento e vai para Arquivados. Financeiro e Serviços e Custos permanecem."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void (async () => {
                  try {
                    await onDelete(row);
                    setConfirmOpen(false);
                  } catch {
                    // Erro tratado pelo caller (toast).
                  }
                })();
              }}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function SheetClientsTable({
  rows,
  emptyMessage = "Sem resultados",
  footerLabel = "cliente",
  footerSuffix,
  onRowClick,
  onSaveComment,
  commentPending,
  toolbarActions,
  banner,
  isLoading,
  errorMessage,
  canUnarchive,
  onUnarchive,
  unarchivePendingId,
  canDelete,
  onDelete,
  deletePendingId,
}: {
  rows: SheetClientRow[];
  emptyMessage?: string;
  footerLabel?: string;
  footerSuffix?: string;
  onRowClick?: (row: SheetClientRow) => void;
  onSaveComment?: (rowId: string, comment: string) => Promise<void>;
  commentPending?: boolean;
  toolbarActions?: ReactNode;
  banner?: ReactNode;
  isLoading?: boolean;
  errorMessage?: string | null;
  canUnarchive?: boolean;
  onUnarchive?: (row: SheetClientRow) => void;
  unarchivePendingId?: string | null;
  canDelete?: boolean;
  onDelete?: (row: SheetClientRow) => Promise<void> | void;
  deletePendingId?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const visibleColumns = useMemo(
    () => sheetColumnsWithDelete(Boolean(canDelete && onDelete)),
    [canDelete, onDelete],
  );
  const statusIndex = visibleColumns.findIndex((column) => column.key === "status");

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matched = term
      ? rows.filter((row) =>
          visibleColumns.some(({ key }) => {
            if (key === "delete") {
              return false;
            }
            if (key === "services") {
              return (row.services ?? []).some((service) =>
                ACOMPANHAMENTO_SERVICE_LABEL[service].toLowerCase().includes(term),
              );
            }
            return String(row[key] ?? "")
              .toLowerCase()
              .includes(term);
          }),
        )
      : [...rows];

    const newestByGroup = new Map<string, number>();
    for (const row of matched) {
      const key = (row.group?.trim() || row.id).toLowerCase();
      const time = rowRecency(row);
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
      const timeA = rowRecency(a);
      const timeB = rowRecency(b);
      return sort === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [rows, search, sort, visibleColumns]);

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
        {toolbarActions}
      </div>

      {banner}

      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          Carregando planilha...
        </div>
      ) : errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <Table containerClassName="max-h-[min(75vh,800px)]">
            <TableHeader className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
              <TableRow className="hover:bg-white border-b-0">
                {visibleColumns.map((column, index) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "sticky top-0 z-20 bg-white text-center whitespace-nowrap",
                      index === 0 && "left-0 z-30 min-w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                      index === statusIndex &&
                        "right-0 z-30 min-w-36 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                      column.key === "delete" && "w-12 min-w-12 px-1",
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
                    {visibleColumns.map((column, index) => (
                      <TableCell
                        key={`${row.id}-${column.key}`}
                        className={cn(
                          "text-center text-foreground whitespace-nowrap",
                          column.key === "barcodeIssued" && "min-w-[10.5rem]",
                          column.key === "services" && "min-w-[5.5rem]",
                          column.key === "delete" && "w-12 min-w-12 px-1",
                          index === 0 &&
                            "sticky left-0 z-10 min-w-64 text-left font-medium bg-white group-hover:bg-muted/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                          index === statusIndex &&
                            "sticky right-0 z-10 min-w-36 bg-white group-hover:bg-muted/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.12)]",
                        )}
                      >
                        {column.key === "name" ? (
                          <NameCell
                            row={row}
                            onSaveComment={onSaveComment}
                            commentPending={commentPending}
                            canUnarchive={canUnarchive}
                            unarchivePending={unarchivePendingId === row.id}
                            onUnarchive={onUnarchive}
                          />
                        ) : column.key === "services" ? (
                          <ServicesCell services={row.services ?? []} />
                        ) : column.key === "barcodeIssued" ? (
                          <BarcodeDateCell issued={row.barcodeIssued} done={row.barcodeDone} />
                        ) : column.key === "delete" && onDelete ? (
                          <DeleteCell
                            row={row}
                            isPending={deletePendingId === row.id}
                            onDelete={onDelete}
                          />
                        ) : column.key === "delete" ? null : (
                          String(row[column.key] || "—")
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !errorMessage ? (
        <p className="mt-3 mb-8 text-sm text-muted-foreground">
          {filteredRows.length} {footerLabel}
          {filteredRows.length === 1 ? "" : "s"}
          {footerSuffix ? ` ${footerSuffix}` : ""}
        </p>
      ) : null}
    </div>
  );
}
