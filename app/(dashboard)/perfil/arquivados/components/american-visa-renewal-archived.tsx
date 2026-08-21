import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function AmericanVisaRenewalArchived() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Estrutura pronta. Os arquivados de renovação serão carregados em breve."
      footerLabel="arquivado"
    />
  );
}
