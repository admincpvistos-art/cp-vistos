import { format } from "date-fns";
import { Form as FormType } from "@prisma/client";

import { cn } from "@/lib/utils";

interface PassportViewProps {
  form: FormType;
  className?: string;
}

export function PassportView({ form, className }: PassportViewProps) {
  return (
    <>
      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-3 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Tipo de documento</span>
          <span className="text-lg font-medium text-foreground">
            {form.passportDocumentType ? form.passportDocumentType : "Regular"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Número do Passaporte
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportNumber ? form.passportNumber : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Cidade de Emissão
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportCity ? form.passportCity : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Número do livro</span>
          <span className="text-lg font-medium text-foreground">
            {form.bookNumber ? form.bookNumber : "Não se aplica"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-3 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            País de Emissão
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportIssuingCountry
              ? form.passportIssuingCountry
              : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Estado de Emissão
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportState ? form.passportState : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Data de Emissão
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportIssuingDate
              ? format(form.passportIssuingDate, "dd/MM/yyyy")
              : "Não preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Data de Expiração
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportExpireDate
              ? format(form.passportExpireDate, "dd/MM/yyyy")
              : "Sem expiração"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-3 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Já perdeu ou teve o passaporte roubado?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportLostConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Número do Passaporte Perdido/Roubado
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportLostConfirmation
              ? form.lostPassportNumber
                ? form.lostPassportNumber
                : "Não Preenchido"
              : "Não Possui Passaporte Perdido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            País do Passaporte Perdido/Roubado
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportLostConfirmation
              ? form.lostPassportCountry
                ? form.lostPassportCountry
                : "Não Preenchido"
              : "Não Possui Passaporte Perdido"}
          </span>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 gap-6">
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Explique o que ocorreu
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.passportLostConfirmation
              ? form.lostPassportDetails
                ? form.lostPassportDetails
                : "Não Preenchido"
              : "Não Possui Passaporte Perdido"}
          </span>
        </div>
      </div>
    </>
  );
}
