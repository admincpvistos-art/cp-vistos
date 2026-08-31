"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "../../perfil/components/dashboard-header";
import { FormServerError } from "../../formulario/[profileId]/components/form-server-error";
import { EstaFormStep } from "./components/esta-form-step";

import { cn } from "@/lib/utils";
import { ESTA_STEPS } from "@/lib/esta-form";
import { trpc } from "@/lib/trpc-client";

export default function EstaFormPage({ params }: { params: { profileId: string } }) {
  const profileId = params.profileId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const formStep = searchParams.get("formStep");
  const isEditingParam = searchParams.get("isEditing");
  const isEditing: boolean = isEditingParam ? JSON.parse(isEditingParam) : false;

  const {
    data,
    isPending,
    error,
  } = trpc.estaRouter.getForm.useQuery(
    { profileId },
    { enabled: Boolean(profileId) },
  );

  useEffect(() => {
    if (profileId && !formStep && data) {
      router.replace(`/formulario-esta/${profileId}?formStep=${data.formStep}`);
    }
  }, [formStep, data, profileId, router]);

  if (!profileId) {
    return <FormServerError />;
  }

  if (error?.data?.code === "FORBIDDEN" || error?.data?.code === "NOT_FOUND") {
    return (
      <div className="w-full min-h-[calc(100vh-96px)] flex flex-col items-center justify-center gap-4 px-6">
        <span className="text-xl font-semibold text-center max-w-md">
          {error.message || "Não foi possível carregar o formulário ESTA."}
        </span>
        <a href="/area-do-cliente" className="text-muted-foreground font-medium underline">
          Voltar para a área do cliente
        </a>
      </div>
    );
  }

  if (data?.formLocked) {
    return (
      <>
        <DashboardHeader profileId={profileId} isForm />
        <div className="w-full min-h-[calc(100vh-96px)] flex flex-col items-center justify-center gap-4 px-6 pt-20">
          <span className="text-xl font-semibold text-center max-w-md">
            Formulário ESTA enviado e bloqueado. Aguarde o desbloqueio do administrador.
          </span>
          <a href="/area-do-cliente" className="text-primary font-medium underline">
            Voltar para a área do cliente
          </a>
        </div>
      </>
    );
  }

  const loading = isPending || data === undefined || !formStep;
  const currentStep = data?.formStep ?? 0;
  const stepDisabled = (step: number) => step > currentStep;

  function goToStep(step: number) {
    if (stepDisabled(step)) return;
    router.push(`/formulario-esta/${profileId}?formStep=${step}`);
  }

  return (
    <>
      <DashboardHeader
        profileId={profileId}
        isEditing={isEditing}
        currentStep={currentStep}
        formStep={formStep}
        isForm
      />

      <div className="w-full h-full min-h-[calc(100vh-80px)] p-6 flex flex-col pt-24 sm:pt-28 sm:px-16 sm:py-12 lg:container lg:mx-auto lg:min-h-[calc(100vh-96px)]">
        <div className={cn("w-full flex flex-col items-center gap-4 mb-6 sm:mb-12 lg:mb-24", isEditing && "hidden")}>
          <h1 className="text-2xl sm:text-3xl text-center font-semibold text-foreground">Formulário ESTA / E-TA</h1>

          {loading ? (
            <div className="hidden lg:flex items-center gap-4">
              {ESTA_STEPS.map((step) => (
                <Skeleton key={step.step} className="size-4 rounded-full" />
              ))}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-4">
              <TooltipProvider>
                {ESTA_STEPS.map((step) => {
                  const disabled = stepDisabled(step.step);

                  return (
                    <Tooltip key={step.step} delayDuration={0}>
                      <TooltipTrigger
                        type="button"
                        disabled={disabled}
                        onClick={() => goToStep(step.step)}
                        className={cn(
                          "size-4 flex-shrink-0 rounded-full border border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
                          {
                            "bg-primary hover:bg-primary": formStep === step.step.toString(),
                          },
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

        {!loading && formStep !== null && (
          <EstaFormStep
            step={Number(formStep)}
            profileId={profileId}
            isEditing={isEditing}
          />
        )}
      </div>
    </>
  );
}
