import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function AmericanVisaArchived() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Estrutura pronta. Os arquivados de visto americano serão carregados em breve."
      footerLabel="arquivado"
    />
  );
}
