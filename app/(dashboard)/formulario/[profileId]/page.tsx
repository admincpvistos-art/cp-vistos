"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FamilyWrapper } from "./components/family/family-wrapper";
import { PassportWrapper } from "./components/passport/passport-wrapper";
import { SecurityWrapper } from "./components/security/security-wrapper";
import { DashboardHeader } from "../../perfil/components/dashboard-header";
import { USAContactWrapper } from "./components/usa-contact/use-contact-wrapper";
import { AboutTravelWrapper } from "./components/about-travel/about-travel-wrapper";
import { PersonalDataWrapper } from "./components/personal-data/personal-data-wrapper";
import { TravelCompanyWrapper } from "./components/travel-company/travel-company-wrapper";
import { WorkEducationWrapper } from "./components/work-education/work-education-wrapper";
import { PreviousTravelWrapper } from "./components/previous-travel/previous-travel-wrapper";
import { ContactAndAddressWrapper } from "./components/contact-and-address/contact-and-address-wrapper";
import { AdditionalInformationWrapper } from "./components/additional-information/additional-information-wrapper";

import { cn } from "@/lib/utils";
import { STEPS } from "@/constants";
import { trpc } from "@/lib/trpc-client";
import useFormStore from "@/constants/stores/useFormStore";
import { FormServerError } from "./components/form-server-error";
import { Skeleton } from "@/components/ui/skeleton";

export default function FormPage({ params }: { params: { profileId: string } }) {
  const profileId = params.profileId;

  const searchParams = useSearchParams();
  const formStep = searchParams.get("formStep");
  const isEditingParam = searchParams.get("isEditing");
  const isEditing: boolean = isEditingParam ? JSON.parse(isEditingParam) : false;

  const { setRedirectStep } = useFormStore();

  if (!profileId) {
    return <FormServerError />;
  }

  const { data: formSteps, isPending: isCurrentStepPending, error: currentStepError } =
    trpc.formsRouter.getCurrentStep.useQuery({
      profileId,
    });
  const { data: isMinor, isPending: checkIsMinorPending } = trpc.formsRouter.checkIsMinor.useQuery(
    { profileId },
    { enabled: currentStepError?.data?.code !== "FORBIDDEN" },
  );

  if (currentStepError?.data?.code === "FORBIDDEN") {
    return (
      <div className="w-full min-h-[calc(100vh-96px)] flex flex-col items-center justify-center gap-4 px-6">
        <span className="text-xl font-semibold text-center max-w-md">
          Formulário enviado e bloqueado. Aguarde o desbloqueio do administrador.
        </span>
        <a href={`/resumo-formulario/${profileId}`} className="text-primary font-medium underline">
          Ver resumo
        </a>
        <a href="/area-do-cliente" className="text-muted-foreground font-medium underline">
          Voltar para a área do cliente
        </a>
      </div>
    );
  }

  const loading = formSteps === undefined || checkIsMinorPending || isCurrentStepPending;

  const currentStep = formSteps ?? 0;

  const stepDisabled = (step: number) => step > currentStep;

  return (
    <>
      <DashboardHeader
        profileId={profileId}
        isEditing={isEditing}
        currentStep={currentStep}
        formStep={formStep}
        isForm
      />

      <div className="w-full h-full min-h-[calc(100vh-80px)] p-6 flex flex-col pt-20 sm:pt-36 sm:px-16 sm:py-12 lg:container lg:mx-auto lg:min-h-[calc(100vh-96px)]">
        <div className={cn("w-full flex flex-col items-center gap-4 mb-6 sm:mb-12 lg:mb-24", isEditing && "hidden")}>
          <h1 className="text-2xl sm:text-3xl text-center font-semibold text-foreground">Complete seu cadastro</h1>

          {loading ? (
            <div className="hidden lg:flex items-center gap-4">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="size-4 rounded-full" />
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-4">
              <TooltipProvider>
                {isMinor
                  ? STEPS.filter((step) => step.step !== 8).map((step) => {
                      const disabled = stepDisabled(step.step);

                      return (
                        <Tooltip key={step.step} delayDuration={0}>
                          <TooltipTrigger
                            disabled={disabled}
                            onClick={() => setRedirectStep(step.step)}
                            className={cn(
                              "size-4 flex-shrink-0 rounded-full border border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
                              {
                                "bg-primary hover:bg-primary": formStep === step.step.toString(),
                              }
                            )}
                          />

                          <TooltipContent side="bottom">
                            <p className="font-medium">{step.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })
                  : STEPS.map((step) => {
                      const disabled = stepDisabled(step.step);

                      return (
                        <Tooltip key={step.step} delayDuration={0}>
                          <TooltipTrigger
                            disabled={disabled}
                            onClick={() => setRedirectStep(step.step)}
                            className={cn(
                              "size-4 flex-shrink-0 rounded-full border border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
                              {
                                "bg-primary hover:bg-primary": formStep === step.step.toString(),
                              }
                            )}
                          />

                          <TooltipContent side="bottom">
                            <p className="font-medium">{step.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
              </TooltipProvider>
            </div>
          )}
        </div>

        {formStep === "0" && <PersonalDataWrapper profileId={profileId} isEditing={isEditing} loading={loading} />}
        {formStep === "1" && <ContactAndAddressWrapper profileId={profileId} isEditing={isEditing} loading={loading} />}
        {formStep === "2" && <PassportWrapper profileId={profileId} isEditing={isEditing} loading={loading} />}
        {formStep === "3" && <AboutTravelWrapper profileId={profileId} isEditing={isEditing} loading={loading} />}
        {formStep === "4" && <TravelCompanyWrapper profileId={profileId} isEditing={isEditing} loading={loading} />}
        {formStep === "5" && <PreviousTravelWrapper profileId={profileId} isEditing={isEditing} loading={loading} />}
        {formStep === "6" && <USAContactWrapper profileId={profileId} isEditing={isEditing} loading={loading} />}
        {formStep === "7" && (
          <FamilyWrapper profileId={profileId} isEditing={isEditing} isMinor={isMinor} loading={loading} />
        )}
        {formStep === "8" && <WorkEducationWrapper profileId={profileId} isEditing={isEditing} loading={loading} />}
        {formStep === "9" && (
          <AdditionalInformationWrapper profileId={profileId} isEditing={isEditing} loading={loading} />
        )}
        {formStep === "10" && <SecurityWrapper profileId={profileId} isEditing={isEditing} loading={loading} />}
      </div>
    </>
  );
}
