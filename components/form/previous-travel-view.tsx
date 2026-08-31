import { format } from "date-fns";
import { Form as FormType } from "@prisma/client";

import { cn } from "@/lib/utils";

interface PreviousTravelViewProps {
  form: FormType;
  className?: string;
}

export function PreviousTravelView({
  form,
  className,
}: PreviousTravelViewProps) {
  return (
    <>
      <div className="w-full grid grid-cols-1 gap-6">
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Já foi para os EUA?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.hasBeenOnUSAConfirmation ? "Sim" : "Não"}
          </span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-9">
        {form.hasBeenOnUSAConfirmation &&
        form.USALastTravel &&
        form.USALastTravel.length > 0 ? (
          form.USALastTravel.map((lastTravel, index) => (
            <div
              key={`USALastTravel-${index}`}
              className="w-full bg-[#D3D3E2] p-5 flex flex-col gap-4"
            >
              <div className="w-full flex flex-col sm:flex-row items-center gap-2">
                <div className="w-8 min-w-[32px] h-8 min-h-[32px] rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {index + 1}
                  </span>
                </div>

                <span className="text-foreground text-lg text-center font-medium">
                  Viagem
                </span>
              </div>

              <div
                className={cn(
                  "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
                  className,
                )}
              >
                <div className="w-full flex flex-col gap-1">
                  <span className="text-sm text-foreground/70 font-medium">
                    Data prevista de chegada nos EUA
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {lastTravel.arriveDate
                      ? format(lastTravel.arriveDate, "dd/MM/yyyy")
                      : "Não Preenchido"}
                  </span>
                </div>

                <div className="w-full flex flex-col gap-1">
                  <span className="text-sm text-foreground/70 font-medium">
                    Tempo estimado de permanência nos EUA
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {lastTravel.estimatedTime}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full bg-[#D3D3E2] p-5 flex items-center justify-center">
            <span className="text-foreground text-lg text-center font-semibold">
              Não possui viagem anterior
            </span>
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-1 gap-6">
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Já obteve uma licença americana para dirigir nos EUA?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.americanLicenseToDriveConfirmation ? "Sim" : "Não"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Número da licença
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.americanLicenseToDriveConfirmation
              ? form.americanLicense
                ? form.americanLicense.licenseNumber
                : "Não Preenchido"
              : "Não Possui"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Estado</span>

          <span className="text-lg font-medium text-foreground">
            {form.americanLicenseToDriveConfirmation
              ? form.americanLicense
                ? form.americanLicense.state
                : "Não Preenchido"
              : "Não Possui"}
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
            Já obteve visto nos EUA?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.USAVisaConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Data de Emissão do Visto
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.visaIssuingDate
              ? format(form.visaIssuingDate, "dd/MM/yyyy")
              : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Número do Visto
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.visaNumber && form.visaNumber.length > 0
              ? form.visaNumber
              : "Não sei o número"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Ainda possui o visto?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.USAVisaConfirmation ? (form.alreadyHaveVisa ? "Sim" : "Não") : "—"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Está solicitando o novo visto do mesmo país ou localização daquele
            concedido previamente?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.newVisaConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Este país é o mesmo onde está localizada sua residencia principal?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.sameCountryResidenceConfirmation ? "Sim" : "Não"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Está solicitando o mesmo tipo de visto concedido anteriormente?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.sameVisaTypeConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Forneceu digitais dos 10 dedos?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.fingerprintsProvidedConfirmation ? "Sim" : "Não"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Já teve um visto perdido ou roubado?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.lostVisaConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            O que ocorreu com o visto perdido ou roubado
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.lostVisaDetails && form.lostVisaDetails.length > 0
              ? form.lostVisaDetails
              : "Não Preenchido"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Já teve um visto revogado ou cancelado?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.canceledVisaConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            O que ocorreu com o visto revogado ou cancelado
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.canceledVisaDetails && form.canceledVisaDetails.length > 0
              ? form.canceledVisaDetails
              : "Não Preenchido"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Já teve um visto negado?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.deniedVisaConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            O que ocorreu com o visto negado
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.deniedVisaDetails && form.deniedVisaDetails.length > 0
              ? form.deniedVisaDetails
              : "Não Preenchido"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Posto Consular no Brasil
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.consularPost && form.consularPost.length > 0
              ? form.consularPost
              : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Categoria/tipo de visto negado
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.deniedVisaType && form.deniedVisaType.length > 0
              ? form.deniedVisaType
              : "Não Preenchido"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Alguém já solicitou alguma petição de imigração em seu nome perante
            o Departamento de Imigração dos Estados Unidos?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.immigrationRequestByAnotherPersonConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">Motivo</span>

          <span className="text-lg font-medium text-foreground">
            {form.immigrationRequestByAnotherPersonDetails &&
            form.immigrationRequestByAnotherPersonDetails.length > 0
              ? form.immigrationRequestByAnotherPersonDetails
              : "Não Preenchido"}
          </span>
        </div>
      </div>
    </>
  );
}
