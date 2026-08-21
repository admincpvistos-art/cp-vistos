import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function E_TA_Prospects() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Estrutura pronta. Os prospects de ESTA / E-TA serão carregados em breve."
      footerLabel="prospect"
    />
  );
}
