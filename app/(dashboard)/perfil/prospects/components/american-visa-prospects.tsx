import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function AmericanVisaProspects() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Estrutura pronta. Os prospects de visto americano serão carregados em breve."
      footerLabel="prospect"
    />
  );
}
