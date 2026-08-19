"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { expireDateStringFromIssued } from "@/lib/barcode-validity";
import { trpc } from "@/lib/trpc-client";
import type { AcompanhamentoRecord } from "@/lib/acompanhamento-types";

const EMPTY: Omit<AcompanhamentoRecord, "id" | "userId" | "profileId" | "formStep"> = {
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

export function AcompanhamentoEditSheet({
  rowId,
  onClose,
}: {
  rowId: string | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState(EMPTY);

  const { data, isFetching } = trpc.acompanhamentoRouter.getRow.useQuery(
    { id: rowId ?? "" },
    { enabled: Boolean(rowId), retry: false },
  );

  const { mutate, isPending } = trpc.acompanhamentoRouter.updateRow.useMutation({
    onSuccess: () => {
      utils.acompanhamentoRouter.getClientesSheet.invalidate();
      toast.success("Acompanhamento atualizado");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível salvar");
    },
  });

  useEffect(() => {
    if (!data?.row) {
      return;
    }

    const { id: _id, userId: _userId, profileId: _profileId, formStep: _formStep, ...rest } = data.row;
    setForm(rest);
  }, [data?.row]);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "barcodeIssued") {
        next.barcodeExpire = expireDateStringFromIssued(value) ?? "";
      }
      return next;
    });
  }

  return (
    <Sheet open={Boolean(rowId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pr-10">
          <SheetTitle>Editar acompanhamento</SheetTitle>
          <SheetDescription>
            Os mesmos campos da planilha. A validade do barcode é calculada em 30 dias a partir da data de geração.
          </SheetDescription>
        </SheetHeader>

        {isFetching && !data ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form
            className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (!rowId) {
                return;
              }
              mutate({ id: rowId, ...form });
            }}
          >
            <Field label="NOME" value={form.name} onChange={(value) => set("name", value)} />
            <Field label="BARCODE" value={form.barcode} onChange={(value) => set("barcode", value)} />
            <Field
              label="DATA BARCODE"
              value={form.barcodeIssued}
              onChange={(value) => set("barcodeIssued", value)}
            />
            <Field label="Validade do barcode" value={form.barcodeExpire} disabled />
            <Field label="CASV" value={form.casv} onChange={(value) => set("casv", value)} />
            <Field label="DT. ENTREV." value={form.interview} onChange={(value) => set("interview", value)} />
            <Field label="REUNIÃO" value={form.meeting} onChange={(value) => set("meeting", value)} />
            <Field label="ENVIO" value={form.shipping} onChange={(value) => set("shipping", value)} />
            <Field label="TIPO" value={form.tipo} onChange={(value) => set("tipo", value)} />
            <Field label="RESP." value={form.resp} onChange={(value) => set("resp", value)} />
            <Field label="PGTO TAXA" value={form.tax} onChange={(value) => set("tax", value)} />
            <Field label="DS-160" value={form.ds160} onChange={(value) => set("ds160", value)} />
            <Field label="ALIMTO" value={form.alimto} onChange={(value) => set("alimto", value)} />
            <Field label="DOB" value={form.dob} onChange={(value) => set("dob", value)} />
            <Field label="PPT" value={form.passport} onChange={(value) => set("passport", value)} />
            <Field label="CONTA" value={form.account} onChange={(value) => set("account", value)} />
            <Field label="E-MAIL" value={form.email} onChange={(value) => set("email", value)} />
            <Field label="TEL." value={form.phone} onChange={(value) => set("phone", value)} />
            <Field label="DT. ENTRADA" value={form.entryDate} onChange={(value) => set("entryDate", value)} />
            <Field label="GRUPO" value={form.group} onChange={(value) => set("group", value)} />
            <Field label="PAGTO" value={form.pagto} onChange={(value) => set("pagto", value)} />
            <Field label="STATUS" value={form.status} onChange={(value) => set("status", value)} />
            <div className="sm:col-span-2 space-y-1.5">
              <Label>OBS</Label>
              <Textarea
                className="min-h-[90px]"
                value={form.obs}
                onChange={(event) => set("obs", event.target.value)}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
