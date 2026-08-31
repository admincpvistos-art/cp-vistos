import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, FileX2, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FamilyView } from "@/components/form/family-view";
import { PassportView } from "@/components/form/passport-view";
import { SecurityView } from "@/components/form/security-view";
import { USAContactView } from "@/components/form/usa-contact-view";
import { AboutTravelView } from "@/components/form/about-travel-view";
import { PersonalDataView } from "@/components/form/personal-data-view";
import { TravelCompanyView } from "@/components/form/travel-company-view";
import { WorkEducationView } from "@/components/form/work-education-view";
import { PreviousTravelView } from "@/components/form/previous-travel-view";
import { ContactAndAddressView } from "@/components/form/contact-and-address-view";
import { AdditionalInformationView } from "@/components/form/additional-information-view";

import { trpc } from "@/lib/trpc-client";

interface FinishFormConfirmationProps {
  profileId: string;
  isPending: boolean;
  submit: () => void;
}

export function FinishFormConfirmation({ profileId, isPending, submit }: FinishFormConfirmationProps) {
  const { data, isLoading } = trpc.formsRouter.getForm.useQuery({ profileId });

  const searchParams = useSearchParams();
  const router = useRouter();
  const open = searchParams.get("confirmation");
  const form = data?.form;
  const formNotFound = !data || !form;
  const loading = isLoading || isPending;

  function openConfirmation() {
    router.push(`/formulario/${profileId}?formStep=10&confirmation=true`);
  }

  function closeConfirmation() {
    router.push(`/formulario/${profileId}?formStep=10`);
  }

  return (
    <AlertDialog open={!!open}>
      <AlertDialogTrigger asChild>
        <Button
          size="xl"
          type="button"
          className="w-full flex items-center gap-2 sm:w-fit"
          disabled={loading}
          onClick={openConfirmation}
        >
          {false ? (
            <>
              Enviando
              <Loader2 className="size-5 animate-spin" strokeWidth={1.5} />
            </>
          ) : (
            <>
              Finalizar
              <ArrowRight className="size-5" strokeWidth={1.5} />
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="h-full flex flex-col justify-between sm:h-[80vh] sm:rounded-3xl">
        <AlertDialogHeader className="flex-1 space-y-0 h-[calc(100%-104px-16px)] relative sm:h-[calc(100%-48px-16px)]">
          <div className="h-full w-full relative grid grid-cols-1 grid-rows-[32px_calc(100%-100px-32px-48px)_100px] sm:grid-rows-[32px_calc(100%-60px-32px-48px)_60px] gap-6">
            <AlertDialogTitle className="font-bold text-2xl">Confirme os dados</AlertDialogTitle>

            <div className="p-4 rounded-2xl bg-neutral-100 h-full">
              <ScrollArea className="w-full h-full">
                {isLoading ? (
                  <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
                    <Loader2 className="animate-spin size-12" strokeWidth={1.5} />

                    <span className="text-muted-foreground text-center font-medium">Carregando informações...</span>
                  </div>
                ) : !formNotFound ? (
                  <Accordion type="single" collapsible className="flex flex-col gap-6">
                    <AccordionItem
                      value="personal-data"
                      className="bg-white p-6 sm:p-6 flex flex-col gap-9 border-0 rounded-lg"
                    >
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Dados Pessoais
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <PersonalDataView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="contacts-and-address"
                      className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg"
                    >
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Endereço e Contatos
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <ContactAndAddressView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="passport" className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg">
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Passaporte
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <PassportView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="about-travel"
                      className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg"
                    >
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Sobre a Viagem
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <AboutTravelView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="travel-company"
                      className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg"
                    >
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Acompanhante da Viagem
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <TravelCompanyView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="previous-travel"
                      className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg"
                    >
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Viagens Anteriores
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <PreviousTravelView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="usa-contacts"
                      className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg"
                    >
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Contato nos Estados Unidos
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <USAContactView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="family" className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg">
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Informações da Família
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <FamilyView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="work-education"
                      className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg"
                    >
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Trabalho e Educação
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <WorkEducationView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="additional-information"
                      className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg"
                    >
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Informação Adicional
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <AdditionalInformationView form={data.form} className="sm:grid-cols-2 lg:grid-cols-2" />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="security" className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg">
                      <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
                        Segurança
                      </AccordionTrigger>

                      <AccordionContent className="w-full flex flex-col gap-9">
                        <SecurityView form={data.form} className="lg:grid-cols-1" />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
                    <FileX2 className="size-12 text-muted-foreground" strokeWidth={1.5} />

                    <span className="text-muted-foreground text-center font-medium">Formulário não encontrado</span>
                  </div>
                )}
              </ScrollArea>
            </div>

            <AlertDialogDescription className="text-sm text-muted-foreground font-medium">
              Antes de enviar, revise atentamente todas as informações fornecidas. Ao confirmar, você declara que os
              dados informados estão corretos e completos.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button size="xl" variant="outline" type="button" disabled={loading} onClick={closeConfirmation}>
              Cancelar
            </Button>
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button size="xl" disabled={formNotFound || loading} type="button" onClick={submit}>
              Confirmar
              {loading && <Loader2 className="animate-spin size-4 ml-2" strokeWidth={1.5} />}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
