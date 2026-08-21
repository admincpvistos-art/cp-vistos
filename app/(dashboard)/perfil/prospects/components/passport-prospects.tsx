import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function PassportProspects() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Prospects da planilha Excel foram concentrados na aba Visto Americano."
      footerLabel="prospect"
    />
  );
}
