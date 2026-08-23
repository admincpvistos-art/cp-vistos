"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc-client";

type Props = {
  category: "american_visa" | "renovacao" | "passport" | "e_ta";
};

export function AmericanVisaProspects({ category = "american_visa" }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState("");

  const utils = trpc.useUtils();
  const { data, isLoading, isError, error } = trpc.prospectsRouter.getSheet.useQuery(
    { category },
    { retry: false },
  );

  const { mutate: createManual, isPending } = trpc.prospectsRouter.createManual.useMutation({
    onSuccess: () => {
      toast.success("Prospect incluído");
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setGroup("");
      utils.prospectsRouter.getSheet.invalidate();
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || "Não foi possível incluir");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome");
      return;
    }
    createManual({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      group: group.trim() || undefined,
      category,
    });
  }

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-8">
        {error.message || "Não foi possível carregar os prospects"}
      </p>
    );
  }

  return (
    <>
      <SheetClientsTable
        rows={data?.rows ?? []}
        emptyMessage="Nenhum prospect nesta aba."
        footerLabel="prospect"
        footerSuffix={
          category === "american_visa"
            ? "da planilha Excel (aba PROSPECT) + inclusões manuais"
            : "incluídos manualmente"
        }
        toolbarActions={
          <Button type="button" className="h-12" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Incluir cliente
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Incluir prospect</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prospect-name">Nome *</Label>
              <Input
                id="prospect-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prospect-email">E-mail</Label>
              <Input
                id="prospect-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prospect-phone">Telefone</Label>
              <Input
                id="prospect-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prospect-group">Grupo</Label>
              <Input
                id="prospect-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="opcional"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Incluir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
