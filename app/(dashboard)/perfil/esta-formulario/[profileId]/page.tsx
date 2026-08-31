"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ESTA_STEPS } from "@/lib/esta-form";
import { trpc } from "@/lib/trpc-client";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-base text-foreground break-words">{value.trim() ? value : "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-secondary p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </section>
  );
}

export default function EstaFormularioAdminPage({ params }: { params: { profileId: string } }) {
  const profileId = params.profileId;

  const { data, isPending, error } = trpc.estaRouter.getFormAdmin.useQuery({ profileId });

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-medium">{error?.message || "Formulário ESTA não encontrado."}</p>
        <Button variant="outline" asChild>
          <Link href="/perfil/acompanhamento-clientes">Voltar</Link>
        </Button>
      </div>
    );
  }

  const form = data.form;

  return (
    <div className="flex flex-col gap-8 px-4 pb-12 pt-4 sm:px-6">
      <div className="flex flex-col gap-3">
        <Button variant="outline" size="sm" className="w-fit" asChild>
          <Link href="/perfil/acompanhamento-clientes">
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Formulário ESTA / E-TA</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.profileName}
            {data.process ? ` · Processo ${data.process}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Section title={ESTA_STEPS[0].label}>
          <ReadOnlyField label="Nome" value={form.firstName} />
          <ReadOnlyField label="Sobrenome" value={form.lastName} />
          <ReadOnlyField label="Número do passaporte" value={form.passportNumber} />
          <ReadOnlyField label="País emissor do passaporte" value={form.passportIssuingCountry} />
          <ReadOnlyField label="Data de emissão" value={form.passportIssueDate} />
          <ReadOnlyField label="Data de validade" value={form.passportExpireDate} />
          <ReadOnlyField label="País de cidadania" value={form.citizenshipCountry} />
          <ReadOnlyField label="CPF / documento nacional" value={form.nationalIdNumber} />
          <ReadOnlyField label="Sexo" value={form.sex} />
          <ReadOnlyField label="Data de nascimento" value={form.birthDate} />
        </Section>

        <Section title={ESTA_STEPS[1].label}>
          <ReadOnlyField label="Outra cidadania atual" value={form.otherCitizenshipNowConfirmation} />
          <ReadOnlyField label="Nacionalidade atual" value={form.otherCitizenshipNowCountry} />
          <ReadOnlyField label="Já possuiu outra cidadania" value={form.otherCitizenshipPastConfirmation} />
          <ReadOnlyField label="Nacionalidade anterior" value={form.otherCitizenshipPastCountry} />
          <ReadOnlyField label="Usou outro nome" value={form.otherNameUsedConfirmation} />
          <ReadOnlyField label="Outro nome" value={form.otherName} />
          <ReadOnlyField label="Outro documento de viagem" value={form.otherTravelDocConfirmation} />
          <ReadOnlyField label="País do documento" value={form.otherTravelDocCountry} />
          <ReadOnlyField label="Tipo do documento" value={form.otherTravelDocType} />
          <ReadOnlyField label="Número do documento" value={form.otherTravelDocNumber} />
          <ReadOnlyField label="Ano de validade" value={form.otherTravelDocExpireYear} />
        </Section>

        <Section title={ESTA_STEPS[2].label}>
          <ReadOnlyField label="Endereço" value={form.address} />
          <ReadOnlyField label="Número" value={form.addressNumber} />
          <ReadOnlyField label="Complemento" value={form.complement} />
          <ReadOnlyField label="Bairro" value={form.district} />
          <ReadOnlyField label="Cidade" value={form.city} />
          <ReadOnlyField label="Estado" value={form.state} />
          <ReadOnlyField label="CEP" value={form.cep} />
          <ReadOnlyField label="País" value={form.country} />
          <ReadOnlyField label="Telefone" value={form.phone} />
          <ReadOnlyField label="E-mail" value={form.email} />
          <ReadOnlyField label="Instagram" value={form.instagram} />
          <ReadOnlyField label="Facebook" value={form.facebook} />
          <ReadOnlyField label="LinkedIn" value={form.linkedin} />
          <ReadOnlyField label="Outra rede social" value={form.otherSocial} />
        </Section>

        <Section title={ESTA_STEPS[3].label}>
          <ReadOnlyField label="Global Entry / NEXUS / SENTRI" value={form.globalEntryMemberConfirmation} />
          <ReadOnlyField label="Nome do pai" value={form.fatherFullName} />
          <ReadOnlyField label="Nome da mãe" value={form.motherFullName} />
          <ReadOnlyField label="Cargo" value={form.jobTitle} />
          <ReadOnlyField label="Empregador" value={form.employerName} />
          <ReadOnlyField label="Endereço do empregador" value={form.employerAddress} />
          <ReadOnlyField label="Número" value={form.employerAddressNumber} />
          <ReadOnlyField label="Bairro" value={form.employerDistrict} />
          <ReadOnlyField label="Cidade" value={form.employerCity} />
          <ReadOnlyField label="Estado" value={form.employerState} />
          <ReadOnlyField label="CEP" value={form.employerCep} />
          <ReadOnlyField label="País" value={form.employerCountry} />
          <ReadOnlyField label="Telefone comercial" value={form.employerPhone} />
        </Section>

        <Section title={ESTA_STEPS[4].label}>
          <ReadOnlyField label="Escala para outro país" value={form.transitToOtherCountryConfirmation} />
          <ReadOnlyField label="Nome do contato nos EUA" value={form.usContactName} />
          <ReadOnlyField label="Telefone do contato" value={form.usContactPhone} />
          <ReadOnlyField label="Endereço do contato" value={form.usContactAddress} />
          <ReadOnlyField label="Número" value={form.usContactAddressNumber} />
          <ReadOnlyField label="Complemento" value={form.usContactComplement} />
          <ReadOnlyField label="Bairro" value={form.usContactDistrict} />
          <ReadOnlyField label="Cidade" value={form.usContactCity} />
          <ReadOnlyField label="Estado" value={form.usContactState} />
          <ReadOnlyField label="CEP / ZIP" value={form.usContactCep} />
          <ReadOnlyField label="País" value={form.usContactCountry} />
          <ReadOnlyField label="Endereço nos EUA igual ao contato" value={form.usAddressSameAsContactConfirmation} />
          <ReadOnlyField label="Endereço nos EUA" value={form.usStayAddress} />
          <ReadOnlyField label="Número (estadia)" value={form.usStayAddressNumber} />
          <ReadOnlyField label="Complemento (estadia)" value={form.usStayComplement} />
          <ReadOnlyField label="Bairro (estadia)" value={form.usStayDistrict} />
          <ReadOnlyField label="Cidade (estadia)" value={form.usStayCity} />
          <ReadOnlyField label="Estado (estadia)" value={form.usStayState} />
          <ReadOnlyField label="CEP / ZIP (estadia)" value={form.usStayCep} />
          <ReadOnlyField label="País (estadia)" value={form.usStayCountry} />
        </Section>

        <Section title={ESTA_STEPS[5].label}>
          <ReadOnlyField label="Nome de emergência" value={form.emergencyName} />
          <ReadOnlyField label="E-mail de emergência" value={form.emergencyEmail} />
          <ReadOnlyField label="Telefone de emergência" value={form.emergencyPhone} />
        </Section>
      </div>
    </div>
  );
}
