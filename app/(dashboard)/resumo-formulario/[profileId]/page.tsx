"use client";

import { FormView } from "@/components/dashboard/form-view";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "../../perfil/components/dashboard-header";

import { trpc } from "@/lib/trpc-client";

export default function FormResumePage({ params }: { params: { profileId: string } }) {
  const profileId = params.profileId;

  const { data } = trpc.formsRouter.getForm.useQuery({ profileId });

  return (
    <>
      <DashboardHeader />

      <div className="w-full h-full p-6 pt-20 sm:pt-36 sm:px-16 sm:pb-12 lg:container lg:mx-auto">
        {!data ? (
          <div className="w-full flex flex-col gap-9 bg-secondary py-8 px-11 rounded-xl">
            <div className="w-full flex flex-col items-center justify-between gap-4 md:flex-row-reverse">
              <h2 className="text-2xl text-center text-foreground w-full font-semibold sm:text-left sm:w-fit sm:text-3xl">
                Resumo do formulário
              </h2>

              <Skeleton className="w-full h-12 bg-primary/30 rounded-2xl sm:w-60" />
            </div>

            <div className="w-full flex flex-col gap-9">
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
              <Skeleton className="w-full h-[108px] bg-primary/30 rounded-xl" />
            </div>
          </div>
        ) : (
          <FormView form={data.form} profileId={profileId} formLocked={data.formLocked} />
        )}
      </div>
    </>
  );
}
