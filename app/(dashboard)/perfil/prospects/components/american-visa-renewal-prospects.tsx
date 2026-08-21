import { SheetClientsTable } from "@/components/dashboard/sheet-clients-table";

export function AmericanVisaRenewalProspects() {
  return (
    <SheetClientsTable
      rows={[]}
      emptyMessage="Prospects da planilha Excel foram concentrados na aba Visto Americano."
      footerLabel="prospect"
    />
  );
}
