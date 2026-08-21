import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function E_TA_Archived() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Estrutura pronta. Os arquivados de ESTA / E-TA serão carregados em breve."
      footerLabel="arquivado"
    />
  );
}
