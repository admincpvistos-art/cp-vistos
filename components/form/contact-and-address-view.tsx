import { Form as FormType } from "@prisma/client";

import { cn } from "@/lib/utils";
import { buildLegacyPostalAddress } from "@/lib/form-postal-address";

function mailingLabel(form: FormType) {
  if (form.postalAddressConfirmation === false) return "É o mesmo da residencia";
  if (form.postalStreet) {
    return buildLegacyPostalAddress(form);
  }
  return form.otherPostalAddress && form.otherPostalAddress.length > 0
    ? form.otherPostalAddress
    : "Não preencheu o endereço";
}

interface ContactAndAddressViewProps {
  form: FormType;
  className?: string;
}

export function ContactAndAddressView({ form, className }: ContactAndAddressViewProps) {
  return (
    <>
      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Endereço Residencial</span>

          <span className="text-lg font-medium text-foreground">{form.address ? form.address : "Não Preenchido"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Número do Endereço</span>

          <span className="text-lg font-medium text-foreground">
            {form.addressNumber ? form.addressNumber : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Bairro</span>

          <span className="text-lg font-medium text-foreground">
            {form.district ? form.district : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Complemento</span>

          <span className="text-lg font-medium text-foreground">
            {form.complement ? form.complement : "Não Preenchido"}
          </span>
        </div>
      </div>

      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">CEP</span>

          <span className="text-lg font-medium text-foreground">{form.cep ? form.cep : "Não Preenchido"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Cidade</span>

          <span className="text-lg font-medium text-foreground">{form.city ? form.city : "Não Preenchido"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Estado</span>

          <span className="text-lg font-medium text-foreground">{form.state ? form.state : "Não Preenchido"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">País</span>

          <span className="text-lg font-medium text-foreground">{form.country ? form.country : "Não Preenchido"}</span>
        </div>
      </div>

      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Endereço de Correio</span>

          <span className="text-lg font-medium text-foreground">{mailingLabel(form)}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Celular</span>

          <span className="text-lg font-medium text-foreground">{form.cel ? form.cel : "Não Preenchido"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Telefone</span>

          <span className="text-lg font-medium text-foreground">{form.tel ? form.tel : "Não Preenchido"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Telefone comercial</span>

          <span className="text-lg font-medium text-foreground">{form.workPhone ? form.workPhone : "Não possui"}</span>
        </div>
      </div>

      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">E-mail</span>

          <span className="text-lg font-medium text-foreground break-words">
            {form.email ? form.email : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Outro Telefone</span>

          <span className="text-lg font-medium text-foreground">
            {form.fiveYearsOtherTelConfirmation && form.otherTel && form.otherTel.length > 0
              ? form.otherTel.map((tel) => tel).join(" | ")
              : "Não possui"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Outro E-mail</span>

          <span className="text-lg font-medium text-foreground break-words">
            {form.fiveYearsOtherEmailConfirmation && form.otherEmail && form.otherEmail.length > 0
              ? form.otherEmail
              : "Não possui"}
          </span>
        </div>
      </div>

      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-4 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Facebook</span>

          <span className="text-lg font-medium text-foreground">{form.facebook ? form.facebook : "Não possui"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">LinkedIn</span>

          <span className="text-lg font-medium text-foreground">{form.linkedin ? form.linkedin : "Não possui"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Instagram</span>

          <span className="text-lg font-medium text-foreground">{form.instagram ? form.instagram : "Não possui"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Outras Redes</span>

          <span className="text-lg font-medium text-foreground">
            {form.othersSocialMedia ? form.othersSocialMedia : "Não possui"}
          </span>
        </div>
      </div>
    </>
  );
}
