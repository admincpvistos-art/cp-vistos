import { format } from "date-fns";
import { Form as FormType } from "@prisma/client";

import { cn } from "@/lib/utils";
import { splitPersonName } from "@/lib/person-name";

interface FamilyViewProps {
  form: FormType;
  className?: string;
}

export function FamilyView({ form, className }: FamilyViewProps) {
  const fatherSplit = splitPersonName(form.fatherCompleteName);
  const motherSplit = splitPersonName(form.motherCompleteName);
  const fatherFirst = form.fatherFirstName || fatherSplit.firstName;
  const fatherLast = form.fatherLastName || fatherSplit.lastName;
  const motherFirst = form.motherFirstName || motherSplit.firstName;
  const motherLast = form.motherLastName || motherSplit.lastName;

  return (
    <>
      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Nome do Pai
          </span>

          <span className="text-lg font-medium text-foreground">
            {fatherFirst || "Não preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Sobrenome do Pai
          </span>

          <span className="text-lg font-medium text-foreground">
            {fatherLast || "Não preenchido"}
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
            Data de Nascimento do Pai
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.fatherBirthdate
              ? format(form.fatherBirthdate, "dd/MM/yyyy")
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
            Pai se encontra nos EUA?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.fatherLiveInTheUSAConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Situação do Pai
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.fatherUSASituation && form.fatherUSASituation.length > 0
              ? form.fatherUSASituation
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
            Nome da Mãe
          </span>

          <span className="text-lg font-medium text-foreground">
            {motherFirst || "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Sobrenome da Mãe
          </span>

          <span className="text-lg font-medium text-foreground">
            {motherLast || "Não Preenchido"}
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
            Data de Nascimento da Mãe
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.motherBirthdate
              ? format(form.motherBirthdate, "dd/MM/yyyy")
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
            Mãe se encontra nos EUA?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.motherLiveInTheUSAConfirmation ? "Sim" : "Não"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Situação do Mãe
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.motherUSASituation && form.motherUSASituation.length > 0
              ? form.motherUSASituation
              : "Não Preenchido"}
          </span>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 gap-6">
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Há alguém da família nos EUA?
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.familyLivingInTheUSAConfirmation ? "Sim" : "Não"}
          </span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-9">
        {form.familyLivingInTheUSAConfirmation &&
        form.familyLivingInTheUSA &&
        form.familyLivingInTheUSA.length > 0 ? (
          form.familyLivingInTheUSA.map((familyLivingInTheUSA, index) => (
            <div
              key={`familyLivingInTheUSA-${index}`}
              className="w-full bg-[#D3D3E2] p-5 flex flex-col gap-4"
            >
              <div className="w-full flex flex-col sm:flex-row items-center gap-2">
                <div className="w-8 min-w-[32px] h-8 min-h-[32px] rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {index + 1}
                  </span>
                </div>

                <span className="text-foreground text-lg text-center font-medium">
                  Familiar
                </span>
              </div>

              <div
                className={cn(
                  "w-full grid grid-cols-1 sm:grid-cols-3 gap-6",
                  className,
                )}
              >
                <div className="w-full flex flex-col gap-1">
                  <span className="text-sm text-foreground/70 font-medium">
                    Nome do Parente
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {familyLivingInTheUSA.name}
                  </span>
                </div>

                <div className="w-full flex flex-col gap-1">
                  <span className="text-sm text-foreground/70 font-medium">
                    Parentesco
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {familyLivingInTheUSA.relation}
                  </span>
                </div>

                <div className="w-full flex flex-col gap-1">
                  <span className="text-sm text-foreground/70 font-medium">
                    Situação do Parente
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {familyLivingInTheUSA.situation}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full bg-[#D3D3E2] p-5 flex items-center justify-center">
            <span className="text-foreground text-lg text-center font-semibold">
              Não possui outro familiar
            </span>
          </div>
        )}
      </div>

      <div
        className={cn(
          "w-full grid grid-cols-1 sm:grid-cols-2 gap-6",
          className,
        )}
      >
        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Nome Completo (Cônjuge/Parceiro/Ex-Cônjuge)
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.partnerCompleteName && form.partnerCompleteName.length > 0
              ? form.partnerCompleteName
              : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Data de Nascimento (Cônjuge/Parceiro/Ex-Cônjuge)
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.partnerBirthdate
              ? format(form.partnerBirthdate, "dd/MM/yyyy")
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
            Nacionalidade (Cônjuge/Parceiro/Ex-Cônjuge)
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.partnerNationality && form.partnerNationality.length > 0
              ? form.partnerNationality
              : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Cidade de Nascimento (Cônjuge/Parceiro/Ex-Cônjuge)
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.partnerCity && form.partnerCity.length > 0
              ? form.partnerCity
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
            Estado de Nascimento (Cônjuge/Parceiro/Ex-Cônjuge)
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.partnerState && form.partnerState.length > 0
              ? form.partnerState
              : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            País de Nascimento (Cônjuge/Parceiro/Ex-Cônjuge)
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.partnerCountry && form.partnerCountry.length > 0
              ? form.partnerCountry
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
            Data da União (Cônjuge/Parceiro/Ex-Cônjuge)
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.unionDate
              ? format(form.unionDate, "dd/MM/yyyy")
              : "Não Preenchido"}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1">
          <span className="text-sm text-foreground/60 font-medium">
            Data da Separação (Cônjuge/Parceiro/Ex-Cônjuge)
          </span>

          <span className="text-lg font-medium text-foreground">
            {form.divorceDate
              ? format(form.divorceDate, "dd/MM/yyyy")
              : "Não Preenchido"}
          </span>
        </div>
      </div>
    </>
  );
}
