import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function PassportArchived() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Estrutura pronta. Os arquivados de passaporte serão carregados em breve."
      footerLabel="arquivado"
    />
  );
}
