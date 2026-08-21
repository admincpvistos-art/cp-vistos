import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function AmericanVisaRenewalProspects() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Estrutura pronta. Os prospects de renovação serão carregados em breve."
      footerLabel="prospect"
    />
  );
}
