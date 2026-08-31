import { format } from "date-fns";
import { Form as FormType } from "@prisma/client";

import { cn } from "@/lib/utils";

interface PersonalDataViewProps {
  form: FormType;
  className?: string;
}

export function PersonalDataView({ form, className }: PersonalDataViewProps) {
  return (
    <>
      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Primeiro Nome</span>

          <span className="text-lg font-medium text-foreground">
            {form.firstName ? form.firstName : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Sobrenome</span>

          <span className="text-lg font-medium text-foreground">
            {form.lastName ? form.lastName : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">CPF</span>

          <span className="text-lg font-medium text-foreground">{form.cpf ? form.cpf : "Não Preenchido"}</span>
        </div>
      </div>

      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-2 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Código ou Nome de Guerra</span>

          <span className="text-lg font-medium text-foreground">
            {form.warNameConfirmation ? (form.warName ? form.warName : "Não Preenchido") : "Não possui"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Nome em alfabeto nativo</span>

          <span className="text-lg font-medium text-foreground">
            {form.fullNameNative ? form.fullNameNative : "Não se aplica / igual ao passaporte"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Outros Nomes (Religioso, Solteiro, etc...)</span>

          <span className="text-lg font-medium text-foreground">
            {form.otherNames && form.otherNames.length > 0 ? form.otherNames.join(" | ") : "Não possui"}
          </span>
        </div>
      </div>

      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Sexo</span>

          <span className="text-lg font-medium text-foreground">{form.sex ? form.sex : "Não Preenchido"}</span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Estado Civil</span>

          <span className="text-lg font-medium text-foreground">
            {form.maritalStatus ? form.maritalStatus : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Data de Nascimento</span>

          <span className="text-lg font-medium text-foreground">
            {form.birthDate ? format(form.birthDate, "dd/MM/yyyy") : "Não Preenchido"}
          </span>
        </div>
      </div>

      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Cidade de Nascimento</span>

          <span className="text-lg font-medium text-foreground">
            {form.birthCity ? form.birthCity : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Estado de Nascimento</span>

          <span className="text-lg font-medium text-foreground">
            {form.birthState ? form.birthState : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">País de Nascimento</span>

          <span className="text-lg font-medium text-foreground">
            {form.birthCountry ? form.birthCountry : "Não Preenchido"}
          </span>
        </div>
      </div>

      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">País de Origem (Nacionalidade)</span>

          <span className="text-lg font-medium text-foreground">
            {form.originCountry ? form.originCountry : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Número do passaporte em caso de outra nacionalidade
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.otherNationalityPassport && form.otherNationalityPassport.length > 0
              ? form.otherNationalityPassport
              : "Não possui"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Autorização de viagem negada pelo Departamento de Segurança Interna por meio do Sistema Eletrônico de
            Autorização de Viagem (ESTA)
          </span>

          <span className="text-lg font-medium text-foreground">{form.ESTAVisaDeniedConfirmation ? "Sim" : "Não"}</span>
        </div>
      </div>

      <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", className)}>
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Residente de um país diferente de sua nacionalidade
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.otherCountryResidentConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">U.S. Social Security Number</span>

          <span className="text-lg font-medium text-foreground">
            {form.USSocialSecurityNumber ? form.USSocialSecurityNumber : "Não possui"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">U.S. Taxpayer ID Number</span>

          <span className="text-lg font-medium text-foreground">
            {form.USTaxpayerIDNumber ? form.USTaxpayerIDNumber : "Não possui"}
          </span>
        </div>
      </div>
    </>
  );
}
