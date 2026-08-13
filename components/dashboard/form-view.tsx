"use client";

import Link from "next/link";
import { Edit, MoveLeft } from "lucide-react";
import { Form as FormType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PersonalDataView } from "@/components/form/personal-data-view";
import { ContactAndAddressView } from "@/components/form/contact-and-address-view";
import { PassportView } from "@/components/form/passport-view";
import { AboutTravelView } from "@/components/form/about-travel-view";
import { TravelCompanyView } from "@/components/form/travel-company-view";
import { PreviousTravelView } from "@/components/form/previous-travel-view";
import { USAContactView } from "@/components/form/usa-contact-view";
import { FamilyView } from "@/components/form/family-view";
import { WorkEducationView } from "@/components/form/work-education-view";
import { AdditionalInformationView } from "@/components/form/additional-information-view";
import { SecurityView } from "../form/security-view";

interface Props {
  form: FormType;
  profileId: string;
  formLocked?: boolean;
}

function EditStepButton({
  profileId,
  step,
  formLocked,
}: {
  profileId: string;
  step: number;
  formLocked?: boolean;
}) {
  if (formLocked) {
    return null;
  }

  return (
    <Button size="xl" className="w-full sm:w-fit flex items-center gap-2" asChild>
      <Link href={`/formulario/${profileId}?formStep=${step}&isEditing=true`}>
        Editar <Edit className="size-5" strokeWidth={1.5} />
      </Link>
    </Button>
  );
}

export function FormView({ form, profileId, formLocked = false }: Props) {
  return (
    <div className="w-full flex flex-col gap-9 bg-secondary py-6 px-8 rounded-xl sm:py-8 sm:px-11">
      <div className="w-full flex flex-col items-center justify-between gap-4 md:flex-row-reverse">
        <h2 className="text-2xl text-center text-foreground w-full font-semibold md:text-right md:w-fit md:text-3xl">
          Resumo do formulário
        </h2>

        <Button size="xl" className="w-full flex items-center gap-2 sm:w-fit" asChild>
          <Link href="/area-do-cliente">
            <MoveLeft className="size-5" strokeWidth={1.5} />
            Voltar para painel
          </Link>
        </Button>
      </div>

      {formLocked ? (
        <p className="text-sm text-muted-foreground -mt-4">
          Formulário enviado e bloqueado. A edição só é liberada por um administrador.
        </p>
      ) : null}

      <Accordion type="single" collapsible className="flex flex-col gap-6">
        <AccordionItem
          value="personal-data"
          className="bg-white p-6 sm:p-6 flex flex-col gap-9 border-0 rounded-lg"
        >
          <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
            Dados Pessoais
          </AccordionTrigger>

          <AccordionContent className="w-full flex flex-col gap-9">
            <PersonalDataView form={form} />
            <EditStepButton profileId={profileId} step={0} formLocked={formLocked} />
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
            <ContactAndAddressView form={form} />
            <EditStepButton profileId={profileId} step={1} formLocked={formLocked} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="passport" className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg">
          <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
            Passaporte
          </AccordionTrigger>

          <AccordionContent className="w-full flex flex-col gap-9">
            <PassportView form={form} />
            <EditStepButton profileId={profileId} step={2} formLocked={formLocked} />
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
            <AboutTravelView form={form} />
            <EditStepButton profileId={profileId} step={3} formLocked={formLocked} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="travel-company"
          className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg"
        >
          <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
            Companhia de Viagem
          </AccordionTrigger>

          <AccordionContent className="w-full flex flex-col gap-9">
            <TravelCompanyView form={form} />
            <EditStepButton profileId={profileId} step={4} formLocked={formLocked} />
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
            <PreviousTravelView form={form} />
            <EditStepButton profileId={profileId} step={5} formLocked={formLocked} />
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
            <USAContactView form={form} />
            <EditStepButton profileId={profileId} step={6} formLocked={formLocked} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="family" className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg">
          <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
            Informações da Família
          </AccordionTrigger>

          <AccordionContent className="w-full flex flex-col gap-9">
            <FamilyView form={form} />
            <EditStepButton profileId={profileId} step={7} formLocked={formLocked} />
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
            <WorkEducationView form={form} />
            <EditStepButton profileId={profileId} step={8} formLocked={formLocked} />
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
            <AdditionalInformationView form={form} />
            <EditStepButton profileId={profileId} step={9} formLocked={formLocked} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security" className="bg-white p-6 flex flex-col gap-9 border-0 rounded-lg">
          <AccordionTrigger className="text-lg text-left text-foreground font-semibold hover:no-underline">
            Segurança
          </AccordionTrigger>

          <AccordionContent className="w-full flex flex-col gap-9">
            <SecurityView form={form} />
            <EditStepButton profileId={profileId} step={10} formLocked={formLocked} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
