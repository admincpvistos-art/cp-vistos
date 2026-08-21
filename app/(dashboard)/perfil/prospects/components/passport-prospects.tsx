import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function PassportProspects() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Estrutura pronta. Os prospects de passaporte serão carregados em breve."
      footerLabel="prospect"
    />
  );
}
