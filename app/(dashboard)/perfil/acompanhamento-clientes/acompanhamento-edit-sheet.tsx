"use client";

import { ChangeEvent, useEffect, useState, type ReactNode } from "react";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { expireDateStringFromIssued } from "@/lib/barcode-validity";
import { ARQUIVADOS_CATEGORY_LABEL, SERVICE_TO_ARQUIVADOS_CATEGORY } from "@/lib/arquivados-categories";
import { trpc } from "@/lib/trpc-client";
import {
  ACOMPANHAMENTO_SERVICE_LABEL,
  ACOMPANHAMENTO_SERVICE_OPTIONS,
  emptyAccountFields,
  type AcompanhamentoAccountFields,
  type AcompanhamentoRecord,
  type AcompanhamentoService,
} from "@/lib/acompanhamento-types";

type SheetForm = Omit<
  AcompanhamentoRecord,
  "id" | "userId" | "profileId" | "formStep" | "accountFields"
> & {
  accountFields: AcompanhamentoAccountFields;
};

const EMPTY: SheetForm = {
  name: "",
  barcode: "",
  barcodeIssued: "",
  barcodeExpire: "",
  casv: "",
  interview: "",
  meeting: "",
  shipping: "",
  tipo: "",
  resp: "",
  tax: "",
  ds160: "",
  alimto: "",
  obs: "",
  dob: "",
  passport: "",
  account: "",
  email: "",
  phone: "",
  entryDate: "",
  group: "",
  pagto: "",
  status: "",
  barcodeDone: false,
  sheetComment: "",
  services: [],
  accountFields: emptyAccountFields(),
};

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} disabled={disabled} onChange={(event) => onChange?.(event.target.value)} />
    </div>
  );
}

function formatCpf(event: ChangeEvent<HTMLInputElement>) {
  let value = event.target.value.replace(/[^\d]/g, "");
  value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return value;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="sm:col-span-2 text-sm font-semibold text-foreground pt-2 border-t">{children}</h3>;
}

export function AcompanhamentoEditSheet({
  rowId,
  creating = false,
  canArchive = true,
  onClose,
}: {
  rowId: string | null;
  creating?: boolean;
  canArchive?: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<SheetForm>(EMPTY);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const open = creating || Boolean(rowId);

  const { data, isFetching } = trpc.acompanhamentoRouter.getRow.useQuery(
    { id: rowId ?? "" },
    { enabled: Boolean(rowId) && !creating, retry: false },
  );

  const { mutate: createRow, isPending: isCreating } =
    trpc.acompanhamentoRouter.createRow.useMutation({
      onSuccess: () => {
        utils.acompanhamentoRouter.getClientesSheet.invalidate();
        toast.success("Cliente adicionado ao acompanhamento");
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Não foi possível criar o cliente");
      },
    });

  const { mutate: updateRow, isPending: isUpdating } =
    trpc.acompanhamentoRouter.updateRow.useMutation({
      onSuccess: () => {
        utils.acompanhamentoRouter.getClientesSheet.invalidate();
        utils.acompanhamentoRouter.getRow.invalidate({ id: rowId ?? "" });
        toast.success("Acompanhamento atualizado");
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Não foi possível salvar");
      },
    });

  const { mutate: archiveRow, isPending: isArchiving } =
    trpc.acompanhamentoRouter.archiveRow.useMutation({
      onSuccess: (result) => {
        utils.acompanhamentoRouter.getClientesSheet.invalidate();
        utils.arquivadosRouter.getSheet.invalidate();
        const tabs = result.labels.join(", ");
        toast.success(
          result.labels.length > 1
            ? `Cliente arquivado em: ${tabs}`
            : `Cliente arquivado em Arquivados — ${tabs}`,
        );
        setArchiveConfirmOpen(false);
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Não foi possível arquivar");
      },
    });

  useEffect(() => {
    if (creating) {
      setForm(EMPTY);
      return;
    }

    if (!data?.row) {
      return;
    }

    const {
      id: _id,
      userId: _userId,
      profileId: _profileId,
      formStep: _formStep,
      accountFields,
      ...rest
    } = data.row;

    setForm({
      ...rest,
      accountFields: accountFields ?? emptyAccountFields({
        email: rest.email,
        cel: rest.phone,
        emailScheduleAccount: rest.account,
      }),
    });
  }, [creating, data?.row]);

  function setSheet<K extends Exclude<keyof SheetForm, "barcodeDone" | "services" | "accountFields">>(
    key: K,
    value: SheetForm[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "barcodeIssued" && typeof value === "string") {
        next.barcodeExpire = expireDateStringFromIssued(value) ?? "";
      }
      if (key === "email" && typeof value === "string") {
        next.accountFields = { ...current.accountFields, email: value };
      }
      if (key === "phone" && typeof value === "string") {
        next.accountFields = { ...current.accountFields, cel: value };
      }
      if (key === "account" && typeof value === "string") {
        next.accountFields = { ...current.accountFields, emailScheduleAccount: value };
      }
      return next;
    });
  }

  function setAccount<K extends keyof AcompanhamentoAccountFields>(
    key: K,
    value: AcompanhamentoAccountFields[K],
  ) {
    setForm((current) => ({
      ...current,
      accountFields: { ...current.accountFields, [key]: value },
      ...(key === "email" ? { email: String(value) } : {}),
      ...(key === "cel" ? { phone: String(value) } : {}),
      ...(key === "emailScheduleAccount" ? { account: String(value) } : {}),
    }));
  }

  function toggleService(service: AcompanhamentoService, checked: boolean) {
    setForm((current) => {
      const services = checked
        ? Array.from(new Set([...current.services, service]))
        : current.services.filter((item) => item !== service);
      return { ...current, services };
    });
  }

  function validateBeforeSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do cliente");
      return false;
    }

    const account = form.accountFields;
    if (account.password && account.password !== account.passwordConfirm) {
      toast.error("As senhas da conta não coincidem");
      return false;
    }
    if (
      account.passwordScheduleAccount &&
      account.passwordScheduleAccount !== account.passwordConfirmScheduleAccount
    ) {
      toast.error("As senhas da conta de agendamento não coincidem");
      return false;
    }
    if (account.cpf.trim() && account.cpf.trim().length !== 14) {
      toast.error("CPF inválido");
      return false;
    }

    return true;
  }

  const isPending = isCreating || isUpdating || isArchiving;
  const payload = {
    ...form,
    accountFields: form.accountFields,
  };

  const archiveDestinations = form.services.map((service) => ({
    service,
    label: ARQUIVADOS_CATEGORY_LABEL[SERVICE_TO_ARQUIVADOS_CATEGORY[service]],
    serviceLabel: ACOMPANHAMENTO_SERVICE_LABEL[service],
  }));

  function requestArchive() {
    if (!rowId || creating) {
      return;
    }
    if (!form.services.length) {
      toast.error("Marque ao menos um serviço — ele define as abas de Arquivados");
      return;
    }
    if (!validateBeforeSave()) {
      return;
    }
    setArchiveConfirmOpen(true);
  }

  function confirmArchive() {
    if (!rowId || !form.services.length) {
      return;
    }
    archiveRow({ id: rowId, ...payload });
  }

  return (
    <>
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pr-10">
          <SheetTitle>{creating ? "Adicionar cliente" : "Editar acompanhamento"}</SheetTitle>
          <SheetDescription>
            Planilha, serviços, comentário e dados da conta do cliente — no mesmo painel lateral.
          </SheetDescription>
        </SheetHeader>

        {!creating && isFetching && !data ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (!validateBeforeSave()) {
                return;
              }

              if (creating) {
                createRow(payload);
                return;
              }

              if (!rowId) {
                return;
              }

              updateRow({ id: rowId, ...payload });
            }}
          >
            <SectionTitle>Serviços contratados</SectionTitle>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-muted p-3">
              {ACOMPANHAMENTO_SERVICE_OPTIONS.map((option) => {
                const checked = form.services.includes(option.value);
                const id = `service-${option.value}`;
                return (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(value) => toggleService(option.value, value === true)}
                    />
                    <Label htmlFor={id} className="cursor-pointer font-normal">
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>

            <SectionTitle>Comentário</SectionTitle>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Comentário (balão na planilha)</Label>
              <Textarea
                className="min-h-[80px]"
                value={form.sheetComment}
                maxLength={500}
                onChange={(event) => setSheet("sheetComment", event.target.value)}
                placeholder="Aparece ao passar o mouse no balão ao lado do nome"
              />
            </div>

            <SectionTitle>Dados da planilha</SectionTitle>
            <Field label="NOME" value={form.name} onChange={(value) => setSheet("name", value)} />
            <Field label="BARCODE" value={form.barcode} onChange={(value) => setSheet("barcode", value)} />
            <Field
              label="DATA BARCODE"
              value={form.barcodeIssued}
              onChange={(value) => setSheet("barcodeIssued", value)}
            />
            <Field label="Validade do barcode" value={form.barcodeExpire} disabled />
            <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-muted p-3">
              <Checkbox
                id="barcode-done"
                checked={Boolean(form.barcodeDone)}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, barcodeDone: checked === true }))
                }
              />
              <div className="space-y-1">
                <Label htmlFor="barcode-done" className="cursor-pointer leading-none">
                  Marcar barcode como feito
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ao salvar, a data do barcode na planilha mostra um check no lugar dos alertas de prazo.
                </p>
              </div>
            </div>
            <Field label="CASV" value={form.casv} onChange={(value) => setSheet("casv", value)} />
            <Field label="DT. ENTREV." value={form.interview} onChange={(value) => setSheet("interview", value)} />
            <Field label="REUNIÃO" value={form.meeting} onChange={(value) => setSheet("meeting", value)} />
            <Field label="ENVIO" value={form.shipping} onChange={(value) => setSheet("shipping", value)} />
            <Field label="TIPO" value={form.tipo} onChange={(value) => setSheet("tipo", value)} />
            <Field label="RESP." value={form.resp} onChange={(value) => setSheet("resp", value)} />
            <Field label="PGTO TAXA" value={form.tax} onChange={(value) => setSheet("tax", value)} />
            <Field label="DS-160" value={form.ds160} onChange={(value) => setSheet("ds160", value)} />
            <Field label="ALIMTO" value={form.alimto} onChange={(value) => setSheet("alimto", value)} />
            <Field label="DOB" value={form.dob} onChange={(value) => setSheet("dob", value)} />
            <Field label="PPT" value={form.passport} onChange={(value) => setSheet("passport", value)} />
            <Field label="CONTA" value={form.account} onChange={(value) => setSheet("account", value)} />
            <Field label="E-MAIL" value={form.email} onChange={(value) => setSheet("email", value)} />
            <Field label="TEL." value={form.phone} onChange={(value) => setSheet("phone", value)} />
            <Field label="DT. ENTRADA" value={form.entryDate} onChange={(value) => setSheet("entryDate", value)} />
            <Field label="GRUPO" value={form.group} onChange={(value) => setSheet("group", value)} />
            <Field label="PAGTO" value={form.pagto} onChange={(value) => setSheet("pagto", value)} />
            <Field label="STATUS" value={form.status} onChange={(value) => setSheet("status", value)} />
            <div className="sm:col-span-2 space-y-1.5">
              <Label>OBS</Label>
              <Textarea
                className="min-h-[90px]"
                value={form.obs}
                onChange={(event) => setSheet("obs", event.target.value)}
              />
            </div>

            <SectionTitle>Dados da conta</SectionTitle>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input
                maxLength={14}
                value={form.accountFields.cpf}
                onChange={(event) => setAccount("cpf", formatCpf(event))}
                placeholder="000.000.000-00"
              />
            </div>
            <Field
              label="Celular"
              value={form.accountFields.cel}
              onChange={(value) => setAccount("cel", value)}
            />
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Endereço</Label>
              <Input
                value={form.accountFields.address}
                onChange={(event) => setAccount("address", event.target.value)}
              />
            </div>
            <Field
              label="E-mail da conta"
              value={form.accountFields.email}
              onChange={(value) => setAccount("email", value)}
            />
            <Field
              label="Senha"
              value={form.accountFields.password}
              onChange={(value) => setAccount("password", value)}
            />
            <Field
              label="Confirmar senha"
              value={form.accountFields.passwordConfirm}
              onChange={(value) => setAccount("passwordConfirm", value)}
            />
            <Field
              label="E-mail (agendamento)"
              value={form.accountFields.emailScheduleAccount}
              onChange={(value) => setAccount("emailScheduleAccount", value)}
            />
            <Field
              label="Senha (agendamento)"
              value={form.accountFields.passwordScheduleAccount}
              onChange={(value) => setAccount("passwordScheduleAccount", value)}
            />
            <Field
              label="Confirmar senha (agendamento)"
              value={form.accountFields.passwordConfirmScheduleAccount}
              onChange={(value) => setAccount("passwordConfirmScheduleAccount", value)}
            />
            <Field
              label="Valor do serviço"
              value={form.accountFields.budget}
              onChange={(value) => setAccount("budget", value)}
            />
            <div className="space-y-1.5">
              <Label>Status do pagamento</Label>
              <Select
                value={form.accountFields.budgetPaid || undefined}
                onValueChange={(value) =>
                  setAccount("budgetPaid", value as AcompanhamentoAccountFields["budgetPaid"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta de agendamento</Label>
              <Select
                value={form.accountFields.scheduleAccount || undefined}
                onValueChange={(value) =>
                  setAccount(
                    "scheduleAccount",
                    value as AcompanhamentoAccountFields["scheduleAccount"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativado">Ativado</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
              {!creating && rowId && canArchive ? (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  disabled={isPending}
                  onClick={requestArchive}
                >
                  {isArchiving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar cliente
                    </>
                  )}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && !isArchiving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : creating ? (
                    "Adicionar"
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>

    <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar cliente?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                O cliente sai só do Acompanhamento e vai para Arquivados conforme os
                serviços. Permanece no Financeiro e em Serviços e Custos.
                {form.name.trim() ? (
                  <>
                    {" "}
                    — <span className="font-medium text-foreground">{form.name.trim()}</span>
                  </>
                ) : null}
                :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {archiveDestinations.map((item) => (
                  <li key={item.service}>
                    {item.serviceLabel} → Arquivados — {item.label}
                  </li>
                ))}
              </ul>
              {archiveDestinations.length > 1 ? (
                <p>Com vários serviços, o cliente é replicado em cada aba.</p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isArchiving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isArchiving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();
              confirmArchive();
            }}
          >
            {isArchiving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Arquivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
