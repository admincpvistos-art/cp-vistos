import { motion } from "framer-motion";
import Image from "next/image";

import { FormAnimation } from "@/constants/animations/modal";
import { Button } from "@/components/ui/button";
import useClientDetailsModalStore from "@/constants/stores/useClientDetailsModalStore";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { buildLegacyPostalAddress } from "@/lib/form-postal-address";

interface Props {
  handleClose: () => void;
}

export function ClientDetailsForm({ handleClose }: Props) {
  const { client, unsetToForm, setToResume } = useClientDetailsModalStore();

  if (!client || !client.form) {
    return <div>loading...</div>;
  }

  function handleBack() {
    unsetToForm();
    setToResume();
  }

  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={FormAnimation}>
      <div className="w-full grid grid-cols-2 grid-rows-2 gap-4 mb-9 sm:flex sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={handleBack} variant="link" size="icon" className="row-start-1 row-end-2">
          <Image src="/assets/icons/arrow-left-dark.svg" alt="Voltar" width={24} height={24} />
        </Button>

        <h1 className="text-2xl font-semibold text-foreground text-center sm:text-3xl row-end-3 row-start-2 col-span-2">
          Formulário
        </h1>

        <Button onClick={handleClose} variant="link" size="icon" className="row-start-1 row-end-2 justify-self-end">
          <Image src="/assets/icons/cross-blue.svg" alt="Fechar" width={24} height={24} />
        </Button>
      </div>

      <div className="w-full flex flex-col gap-12">
        <div className="w-full flex flex-col gap-9">
          <h3 className="text-2xl font-semibold text-foreground">Dados Pessoais</h3>

          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Primeiro Nome</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.firstName ? client.form.firstName : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Sobrenome</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.lastName ? client.form.lastName : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">CPF</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.cpf ? client.form.cpf.replace(/[\.\-]/g, "") : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Código ou Nome de Guerra</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.warNameConfirmation
                    ? client.form.warName
                      ? client.form.warName
                      : "Não Preenchido"
                    : "Não Possui"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Nome completo em alfabeto nativo</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.fullNameNative
                    ? client.form.fullNameNative
                    : "Não se aplica / igual ao passaporte"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">
                  Outros Nomes (Religioso(a), Solteiro(a), etc...)
                </span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.otherNamesConfirmation
                    ? client.form.otherNames.length > 0
                      ? client.form.otherNames.join(" | ")
                      : "Não Preenchido"
                    : "Não Possui"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Sexo</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.sex ? client.form.sex : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Estado Civil</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.maritalStatus ? client.form.maritalStatus : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Data de Nascimento</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.birthDate ? format(client.form.birthDate, "dd/MM/yyyy") : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Cidade de Nascimento</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.birthCity ? client.form.birthCity : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Estado de Nascimento</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.birthState ? client.form.birthState : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">País de Nascimento</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.birthCountry ? client.form.birthCountry : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">País de Origem (Nacionalidade)</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.originCountry ? client.form.originCountry : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">
                  Número do passaporte em caso de outra nacionalidade
                </span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.otherNationalityConfirmation
                    ? client.form.otherNationalityPassport
                      ? client.form.otherNationalityPassport
                      : "Não Preenchido"
                    : "Não Possui"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">
                  Residente de um país diferente de sua nacionalidade
                </span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.otherCountryResidentConfirmation ? "Sim" : "Não"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">U.S. Social Security Number</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.USSocialSecurityNumber ? client.form.USSocialSecurityNumber : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">U.S. Taxpayer ID Number</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.USTaxpayerIDNumber ? client.form.USTaxpayerIDNumber : "Não Preenchido"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-9">
          <h3 className="text-2xl font-semibold text-foreground">Endereço e Contatos</h3>

          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Endereço Residencial</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.address ? client.form.address : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Número do Endereço</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.addressNumber ? client.form.addressNumber : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Bairro</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.district ? client.form.district : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Complemento</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.complement ? client.form.complement : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">CEP</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.cep ? client.form.cep.replace(/[\-]/g, "") : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Cidade</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.city ? client.form.city : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Estado</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.state ? client.form.state : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">País</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.country ? client.form.country : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Endereço de Correio</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.postalAddressConfirmation
                    ? client.form.postalStreet
                      ? buildLegacyPostalAddress(client.form)
                      : client.form.otherPostalAddress
                        ? client.form.otherPostalAddress
                        : "Não Preenchido"
                    : "É o mesmo endereço da residencia"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Celular</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.cel ? client.form.cel : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Telefone</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.tel ? client.form.tel : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Telefone comercial</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.workPhone ? client.form.workPhone : "Não possui"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">E-mail</span>

                <span className="text-lg font-medium text-foreground break-words">
                  {client.form.email ? client.form.email : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Outro Telefone</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.fiveYearsOtherTelConfirmation
                    ? client.form.otherTel
                      ? client.form.otherTel.map((tel) => tel).join(" | ")
                      : "Não Preenchido"
                    : "Não Possui"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Outro E-mail</span>

                <span className="text-lg font-medium text-foreground break-words">
                  {client.form.fiveYearsOtherEmailConfirmation
                    ? client.form.otherEmail
                      ? client.form.otherEmail
                      : "Não Preenchido"
                    : "Não Possui"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Facebook</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.facebook ? client.form.facebook : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">LinkedIn</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.linkedin ? client.form.linkedin : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Instagram</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.instagram ? client.form.instagram : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Outras Redes</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.othersSocialMedia ? client.form.othersSocialMedia : "Não Preenchido"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-9">
          <h3 className="text-2xl font-semibold text-foreground">Passaporte</h3>

          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Tipo de documento</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportDocumentType ? client.form.passportDocumentType : "Regular"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Número do Passaporte</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportNumber ? client.form.passportNumber : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Cidade de Emissão</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportCity ? client.form.passportCity : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Estado de Emissão</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportState ? client.form.passportState : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Número do livro</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.bookNumber ? client.form.bookNumber : "Não se aplica"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">País de Emissão</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportIssuingCountry ? client.form.passportIssuingCountry : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Data de Emissão</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportIssuingDate
                    ? format(client.form.passportIssuingDate, "dd/MM/yyyy")
                    : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Data de Expiração</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportExpireDate
                    ? format(client.form.passportExpireDate, "dd/MM/yyyy")
                    : "Sem expiração"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Já perdeu ou teve o passaporte roubado?</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportLostConfirmation ? "Sim" : "Não"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Número do Passaporte Perdido/Roubado</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportLostConfirmation
                    ? client.form.lostPassportNumber
                      ? client.form.lostPassportNumber
                      : "Não Preenchido"
                    : "Não Possui Passaporte Perdido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">País do Passaporte Perdido/Roubado</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportLostConfirmation
                    ? client.form.lostPassportCountry
                      ? client.form.lostPassportCountry
                      : "Não Preenchido"
                    : "Não Possui Passaporte Perdido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Explique o que ocorreu</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.passportLostConfirmation
                    ? client.form.lostPassportDetails
                      ? client.form.lostPassportDetails
                      : "Não Preenchido"
                    : "Não Possui Passaporte Perdido"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-9">
          <h3 className="text-2xl font-semibold text-foreground">Sobre a Viagem</h3>

          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Possui itinerário de viagem?</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.travelItineraryConfirmation ? "Sim" : "Não"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Data prevista de chegada nos EUA</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.USAPreviewArriveDate
                    ? format(client.form.USAPreviewArriveDate, "dd/MM/yyyy")
                    : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Número do voo de chegada</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.travelItineraryConfirmation
                    ? client.form.arriveFlyNumber
                      ? client.form.arriveFlyNumber
                      : "Não Preenchido"
                    : "Não Possui"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Cidade de chegada</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.travelItineraryConfirmation
                    ? client.form.arriveCity
                      ? client.form.arriveCity
                      : "Não Preenchido"
                    : "Não Possui"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Data prevista de retorno ao Brasil</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.travelItineraryConfirmation
                    ? client.form.USAPreviewReturnDate
                      ? format(client.form.USAPreviewReturnDate, "dd/MM/yyyy")
                      : "Não Preenchido"
                    : "Não Possui"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Número do voo de partida</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.travelItineraryConfirmation
                    ? client.form.returnFlyNumber
                      ? client.form.returnFlyNumber
                      : "Não Preenchido"
                    : "Não Possui"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Cidade de partida</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.travelItineraryConfirmation
                    ? client.form.returnCity
                      ? client.form.returnCity
                      : "Não Expiração"
                    : "Não Possui"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Tempo estimado de permanência nos EUA</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.estimatedTimeOnUSA ? client.form.estimatedTimeOnUSA : "Não Sei"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Locais que irá visitar</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.visitLocations ? client.form.visitLocations : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Endereço completo onde ficará nos EUA</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.USACompleteAddress ? client.form.USACompleteAddress : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">ZIP Code de onde ficará nos EUA</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.USAZipCode ? client.form.USAZipCode.replace(/[\-]/g, "") : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Cidade nos EUA</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.USACity ? client.form.USACity : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Estado nos EUA</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.USAState ? client.form.USAState : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Nome ou empresa que pagará a viagem</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.payerNameOrCompany ? client.form.payerNameOrCompany : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Telefone Residencial</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.payerTel ? client.form.payerTel : "Não Preenchido"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Endereço Completo</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.payerAddress ? client.form.payerAddress : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">Relação com o solicitante</span>

                <span className="text-lg font-medium text-foreground">
                  {client.form.payerRelation ? client.form.payerRelation : "Não Preenchido"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-foreground/50 font-medium">E-mail</span>

                <span className="text-lg font-medium text-foreground break-words">
                  {client.form.payerEmail ? client.form.payerEmail : "Não Preenchido"}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-9">
            <h3 className="text-2xl font-semibold text-foreground">Companhia de Viagem</h3>

            <div className="w-full flex flex-col gap-6">
              <div className="w-full flex flex-col gap-6">
                {client.form.otherPeopleTravelingConfirmation && client.form.otherPeopleTraveling.length > 0 ? (
                  client.form.otherPeopleTraveling.map((otherPerson, index) => (
                    <div key={`otherPerson-${index}`} className="w-full bg-[#D3D3E2] p-2 flex flex-col gap-4">
                      <div className="w-full flex items-center gap-2">
                        <div className="w-8 min-w-[32px] h-8 min-h-[32px] rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-lg font-medium">{index + 1}</span>
                        </div>

                        <span className="text-foreground text-lg font-medium">Pessoa Acompanhante</span>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Nome completo da outra pessoa</span>

                          <span className="text-lg font-medium text-foreground">{otherPerson.name}</span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Relação com a outra pessoa</span>

                          <span className="text-lg font-medium text-foreground">{otherPerson.relation}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full bg-[#D3D3E2] p-5 flex items-center justify-center">
                    <span className="text-foreground text-lg text-center font-semibold">
                      Não possui pessoa acompanhante
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Esta viajando como integrante de um grupo de viagem?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.groupMemberConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Nome da organização ou grupo</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.groupMemberConfirmation
                      ? client.form.groupName
                        ? client.form.groupName
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-9">
            <h3 className="text-2xl font-semibold text-foreground">Viagens Anteriores</h3>

            <div className="w-full flex flex-col gap-6">
              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Já foi para os EUA?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.hasBeenOnUSAConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-6">
                {client.form.hasBeenOnUSAConfirmation && client.form.USALastTravel.length > 0 ? (
                  client.form.USALastTravel.map((travel, index) => (
                    <div key={`USALastTravel-${index}`} className="w-full bg-[#D3D3E2] p-5 flex flex-col gap-4">
                      <div className="w-full flex items-center gap-2">
                        <div className="w-8 min-w-[32px] h-8 min-h-[32px] rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-lg font-medium">{index + 1}</span>
                        </div>

                        <span className="text-foreground text-lg font-medium">Viagem</span>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">
                            Data prevista de chegada nos EUA
                          </span>

                          <span className="text-lg font-medium text-foreground">
                            {travel.arriveDate ? format(travel.arriveDate, "dd/MM/yyyy") : "Não Preenchido"}
                          </span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">
                            Tempo estimado de permanência nos EUA
                          </span>

                          <span className="text-lg font-medium text-foreground">{travel.estimatedTime}</span>
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
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Já obteve uma licença americana para dirigir nos EUA?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.americanLicenseToDriveConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Número da licença</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.americanLicenseToDriveConfirmation
                      ? client.form.americanLicense && client.form.americanLicense.licenseNumber
                        ? client.form.americanLicense.licenseNumber
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Estado</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.americanLicenseToDriveConfirmation
                      ? client.form.americanLicense && client.form.americanLicense.state
                        ? client.form.americanLicense.state
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Já obteve visto nos EUA?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.USAVisaConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Data de Emissão do Visto</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.USAVisaConfirmation
                      ? client.form.visaIssuingDate
                        ? format(client.form.visaIssuingDate, "dd/MM/yyyy")
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Número do Visto</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.USAVisaConfirmation
                      ? client.form.visaNumber
                        ? client.form.visaNumber
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Ainda possui o visto?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.USAVisaConfirmation ? (client.form.alreadyHaveVisa ? "Sim" : "Não") : "—"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Está solicitando o novo visto do mesmo país ou localização daquele concedido previamente?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.newVisaConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Este país é o mesmo onde está localizada sua residencia principal?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.sameCountryResidenceConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Está solicitando o mesmo tipo de visto concedido anteriormente?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.sameVisaTypeConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Forneceu digitais dos 10 dedos?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.fingerprintsProvidedConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Já teve um visto perdido ou roubado?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.lostVisaConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    O que ocorreu com o visto perdido ou roubado
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.lostVisaConfirmation
                      ? client.form.lostVisaDetails
                        ? client.form.lostVisaDetails
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Já teve um visto revogado ou cancelado?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.canceledVisaConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    O que ocorreu com o visto revogado ou cancelado
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.canceledVisaConfirmation
                      ? client.form.canceledVisaDetails
                        ? client.form.canceledVisaDetails
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Já teve um visto negado?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.deniedVisaConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">O que ocorreu com o visto negado</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.deniedVisaConfirmation
                      ? client.form.deniedVisaDetails
                        ? client.form.deniedVisaDetails
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Posto Consular no Brasil</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.consularPost ? client.form.consularPost : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Categoria/tipo de visto negado</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.deniedVisaType ? client.form.deniedVisaType : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Alguém já solicitou alguma petição de imigração em seu nome perante o Departamento de Imigração dos
                    Estados Unidos?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.immigrationRequestByAnotherPersonConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Motivo</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.immigrationRequestByAnotherPersonDetails
                      ? client.form.immigrationRequestByAnotherPersonDetails
                      : "Não Preenchido"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-9">
            <h3 className="text-2xl font-semibold text-foreground">Contatos nos Estados Unidos</h3>

            <div className="w-full flex flex-col gap-6">
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Nome completo da pessoa ou organização</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.organizationOrUSAResidentName
                      ? client.form.organizationOrUSAResidentName
                      : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Relação do contato com você</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.organizationOrUSAResidentRelation
                      ? client.form.organizationOrUSAResidentRelation
                      : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Endereço completo do contato</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.organizationOrUSAResidentAddress
                      ? client.form.organizationOrUSAResidentAddress
                      : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">ZIP Code do contato</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.organizationOrUSAResidentZipCode
                      ? client.form.organizationOrUSAResidentZipCode.replace(/[\-]/g, "")
                      : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Cidade do contato</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.organizationOrUSAResidentCity
                      ? client.form.organizationOrUSAResidentCity
                      : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Estado do contato</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.organizationOrUSAResidentState
                      ? client.form.organizationOrUSAResidentState
                      : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Telefone do contato</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.organizationOrUSAResidentTel
                      ? client.form.organizationOrUSAResidentTel
                      : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">E-mail do contato</span>

                  <span className="text-lg font-medium text-foreground break-words">
                    {client.form.organizationOrUSAResidentEmail
                      ? client.form.organizationOrUSAResidentEmail
                      : "Não Preenchido"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-9">
            <h3 className="text-2xl font-semibold text-foreground">Informações da Família</h3>

            <div className="w-full flex flex-col gap-6">
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Nome Completo do Pai</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.fatherCompleteName ? client.form.fatherCompleteName : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Data de Nascimento do Pai</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.fatherBirthdate ? format(client.form.fatherBirthdate, "dd/MM/yyyy") : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Pai se encontra nos EUA?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.fatherLiveInTheUSAConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Situação do Pai</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.fatherUSASituation ? client.form.fatherUSASituation : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Nome Completo do Mãe</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.motherCompleteName ? client.form.motherCompleteName : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Data de Nascimento do Mãe</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.motherBirthdate ? format(client.form.motherBirthdate, "dd/MM/yyyy") : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Mãe se encontra nos EUA?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.motherLiveInTheUSAConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Situação do Mãe</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.motherUSASituation ? client.form.motherUSASituation : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Há alguém da família nos EUA?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.familyLivingInTheUSAConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-9">
                {client.form.familyLivingInTheUSAConfirmation && client.form.familyLivingInTheUSA.length > 0 ? (
                  client.form.familyLivingInTheUSA.map((familyLivingInTheUSA, index) => (
                    <div key={`familyLivingInTheUSA-${index}`} className="w-full bg-[#D3D3E2] p-5 flex flex-col gap-4">
                      <div className="w-full flex items-center gap-2">
                        <div className="w-8 min-w-[32px] h-8 min-h-[32px] rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-lg font-medium">{index + 1}</span>
                        </div>

                        <span className="text-foreground text-lg font-medium">Familiar</span>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Nome do Parente</span>

                          <span className="text-lg font-medium text-foreground">{familyLivingInTheUSA.name}</span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Parentesco</span>

                          <span className="text-lg font-medium text-foreground">{familyLivingInTheUSA.relation}</span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Situação do Parente</span>

                          <span className="text-lg font-medium text-foreground">{familyLivingInTheUSA.situation}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full bg-[#D3D3E2] p-5 flex items-center justify-center">
                    <span className="text-foreground text-lg text-center font-semibold">Não possui outro familiar</span>
                  </div>
                )}
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Nome Completo (Cônjuge/Parceiro/Ex-Cônjuge)
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.partnerCompleteName ? client.form.partnerCompleteName : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Data de Nascimento (Cônjuge/Parceiro/Ex-Cônjuge)
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.partnerBirthdate
                      ? format(client.form.partnerBirthdate, "dd/MM/yyyy")
                      : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Nacionalidade (Cônjuge/Parceiro/Ex-Cônjuge)
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.partnerNationality ? client.form.partnerNationality : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Cidade de Nascimento (Cônjuge/Parceiro/Ex-Cônjuge)
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.partnerCity ? client.form.partnerCity : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Estado de Nascimento (Cônjuge/Parceiro/Ex-Cônjuge)
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.partnerState ? client.form.partnerState : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    País de Nascimento (Cônjuge/Parceiro/Ex-Cônjuge)
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.partnerCountry ? client.form.partnerCountry : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Data da União (Cônjuge/Parceiro/Ex-Cônjuge)
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.unionDate ? format(client.form.unionDate, "dd/MM/yyyy") : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Data da Separação (Cônjuge/Parceiro/Ex-Cônjuge)
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.divorceDate ? format(client.form.divorceDate, "dd/MM/yyyy") : "Não Preenchido"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-9">
            <h3 className="text-2xl font-semibold text-foreground">Trabalho e Educação</h3>

            <div className="w-full flex flex-col gap-6">
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Ocupação atual</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.occupation ? client.form.occupation : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Cargo/Função</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.office ? client.form.office : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Nome do empregador ou empresa atual</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.companyOrBossName ? client.form.companyOrBossName : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Endereço completo da empresa</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.companyAddress ? client.form.companyAddress : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Cidade da empresa</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.companyCity ? client.form.companyCity : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Estado da empresa</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.companyState ? client.form.companyState : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">País da empresa</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.companyCountry ? client.form.companyCountry : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Cep da empresa</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.companyCep ? client.form.companyCep.replace(/[\-]/g, "") : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Telefone da empresa</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.companyTel ? client.form.companyTel : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Data de admissão</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.admissionDate ? format(client.form.admissionDate, "dd/MM/yyyy") : "Não Preenchido"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Data de aposentadoria</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.retireeDate ? format(client.form.retireeDate, "dd/MM/yyyy") : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Renda mensal (R$)</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.monthlySalary ? formatPrice(client.form.monthlySalary) : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Descreva quais são as suas funções dentro da sua empresa, se possui funcionários registrados e
                    outras informações relacionadas ao seu negócio
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.jobDetails ? client.form.jobDetails : "Não Preenchido"}
                  </span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-9">
                {client.form.previousJobConfirmation && client.form.previousJobs.length > 0 ? (
                  client.form.previousJobs.map((previousJobs, index) => (
                    <div key={`previousJobs-${index}`} className="w-full bg-[#D3D3E2] p-5 flex flex-col gap-4">
                      <div className="w-full flex items-center gap-2">
                        <div className="w-8 min-w-[32px] h-8 min-h-[32px] rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-lg font-medium">{index + 1}</span>
                        </div>

                        <span className="text-foreground text-lg font-medium">Emprego Anterior</span>
                      </div>

                      <div className="w-full grid grid-cols-1 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Nome do empregador ou empresa</span>

                          <span className="text-base text-foreground">{previousJobs.companyName}</span>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Endereço completo da empresa</span>

                          <span className="text-lg font-medium text-foreground">{previousJobs.companyAddress}</span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Cidade da empresa</span>

                          <span className="text-lg font-medium text-foreground">{previousJobs.companyCity}</span>
                        </div>
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Estado da empresa</span>

                          <span className="text-lg font-medium text-foreground">{previousJobs.companyState}</span>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">País da empresa</span>

                          <span className="text-lg font-medium text-foreground">{previousJobs.companyCountry}</span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">CEP da empresa</span>

                          <span className="text-lg font-medium text-foreground">
                            {previousJobs.companyCep.replace(/[\-]/g, "")}
                          </span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Telefone da empresa</span>

                          <span className="text-lg font-medium text-foreground">
                            {previousJobs.companyTel ? previousJobs.companyTel : "Não Preenchido"}
                          </span>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-base text-foreground font-medium">Cargo / Função</span>

                          <span className="text-base text-foreground">{previousJobs.office}</span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-base text-foreground font-medium">Nome completo do supervisor</span>

                          <span className="text-base text-foreground">{previousJobs.supervisorName}</span>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-base text-foreground font-medium">Data de admissão</span>

                          <span className="text-base text-foreground">
                            {previousJobs.admissionDate
                              ? format(previousJobs.admissionDate, "dd/MM/yyyy")
                              : "Não Preenchido"}
                          </span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-base text-foreground font-medium">Data de demissão</span>

                          <span className="text-base text-foreground">
                            {previousJobs.resignationDate
                              ? format(previousJobs.resignationDate, "dd/MM/yyyy")
                              : "Não Preenchido"}
                          </span>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-1 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-base text-foreground font-medium">Descrição da tarefa exercida</span>

                          <span className="text-base text-foreground">{previousJobs.jobDescription}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full bg-[#D3D3E2] p-5 flex items-center justify-center">
                    <span className="text-foreground text-lg text-center font-semibold">
                      Não possui emprego anterior
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col gap-9">
                {client.form.courses && client.form.courses.length > 0 ? (
                  client.form.courses.map((course, index) => (
                    <div key={`courses-${index}`} className="w-full bg-[#FDF0D2] p-5 flex flex-col gap-4">
                      <div className="w-full flex items-center gap-2">
                        <div className="w-8 min-w-[32px] h-8 min-h-[32px] rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-lg font-medium">{index + 1}</span>
                        </div>

                        <span className="text-foreground text-lg font-medium">Instituição de Ensino Anterior</span>
                      </div>

                      <div className="w-full grid grid-cols-1 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Nome completo da instituição</span>

                          <span className="text-lg font-medium text-foreground">{course.institutionName}</span>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">
                            Endereço completo da instituição
                          </span>

                          <span className="text-base text-foreground">{course.address}</span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Cidade da instituição</span>

                          <span className="text-lg font-medium text-foreground">{course.city}</span>
                        </div>
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Estado da instituição</span>

                          <span className="text-lg font-medium text-foreground">{course.state}</span>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">País da instituição</span>

                          <span className="text-lg font-medium text-foreground">{course.country}</span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">CEP da instituição</span>

                          <span className="text-lg font-medium text-foreground">{course.cep.replace(/[\-]/g, "")}</span>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Nome do curso</span>

                          <span className="text-lg font-medium text-foreground">{course.courseName}</span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Data de início</span>

                          <span className="text-lg font-medium text-foreground">
                            {course.initialDate ? format(course.initialDate, "dd/MM/yyyy") : "Não Preenchido"}
                          </span>
                        </div>

                        <div className="w-full flex flex-col gap-1">
                          <span className="text-sm text-foreground/70 font-medium">Data de término</span>

                          <span className="text-lg font-medium text-foreground">
                            {course.finishDate ? format(course.finishDate, "dd/MM/yyyy") : "Não Preenchido"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full bg-[#FDF0D2] p-5 flex items-center justify-center">
                    <span className="text-foreground text-lg text-center font-semibold">
                      Não possui ensino anterior
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-9">
            <h3 className="text-2xl font-semibold text-foreground">Informação Adicional</h3>

            <div className="w-full flex flex-col gap-6">
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Você participa de algum clã ou tribo?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.tribeParticipateConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Quais idiomas você fala?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.languages.length > 0 ? client.form.languages.join(" | ") : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Viajou nos últimos 5 anos para outro país?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.fiveYearsOtherCountryTravelsConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Países que viajou</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.fiveYearsOtherCountryTravels.length > 0
                      ? client.form.fiveYearsOtherCountryTravels.join(" | ")
                      : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Contribui ou faz parte de alguma instituição de caridade ou organização social?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.socialOrganizationConfirmation ? "Sim" : "Não"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Organizações que você faz parte</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.socialOrganization.length > 0
                      ? client.form.socialOrganization.join(" | ")
                      : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Você tem treinamento com arma de fogo?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.weaponTrainingConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Mais detalhes sobre o treinamento</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.weaponTrainingConfirmation
                      ? client.form.weaponTrainingDetails
                        ? client.form.weaponTrainingDetails
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Já prestou serviço militar?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.militaryServiceConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">País que serviu</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.militaryServiceConfirmation
                      ? client.form.militaryServiceCountry
                        ? client.form.militaryServiceCountry
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Local que serviu</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.militaryServiceConfirmation
                      ? client.form.militaryServiceLocal
                        ? client.form.militaryServiceLocal
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Patente</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.militaryServiceConfirmation
                      ? client.form.militaryServicePatent
                        ? client.form.militaryServicePatent
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Especialidade</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.militaryServiceConfirmation
                      ? client.form.militaryServiceSpecialty
                        ? client.form.militaryServiceSpecialty
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Data de início</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.militaryServiceConfirmation
                      ? client.form.militaryServiceStartDate
                        ? format(client.form.militaryServiceStartDate, "dd/MM/yyyy")
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Data de Término</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.militaryServiceConfirmation
                      ? client.form.militaryServiceEndDate
                        ? format(client.form.militaryServiceEndDate, "dd/MM/yyyy")
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já serviu, foi membro ou esteve envolvido em uma unidade paramilitar, unidade de vigilantes,
                    grupo rebelde, grupo guerrilheiro ou organização insurgente?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.insurgencyOrganizationConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Mais detalhes sobre sua participação</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.insurgencyOrganizationConfirmation
                      ? client.form.insurgencyOrganizationDetails
                        ? client.form.insurgencyOrganizationDetails
                        : "Não Preenchido"
                      : "Não Possui"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-9">
            <h3 className="text-2xl font-semibold text-foreground">Segurança</h3>

            <div className="w-full flex flex-col gap-6">
              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Possui alguma doença contagiosa (cancroide, gonorreia, granuloma inguinal, hanseníase infecciosa,
                    linfogranuloma venéreo, sífilis em estágio infeccioso, tuberculose ativa e outras doenças, conforme
                    determinado pelo Departamento de Saúde e Serviços Humanos?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.contagiousDiseaseConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Possui algum problema físico ou mental que possa interferir em sua segurança ou de outras pessoas?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.phisicalMentalProblemConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já foi preso ou condenado por algum delito ou crime, mesmo que tenha sido objeto de perdão,
                    anistia ou outra ação semelhante?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.crimeConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">Já teve problemas com drogas?</span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.drugsProblemConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já violou ou esteve envolvido em alguma conspiração para violar qualquer lei relacionada ao
                    controle de substâncias?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.lawViolateConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você está vindo para os Estados Unidos para se envolver em prostituição ou vício comercializado
                    ilegalmente ou esteve envolvido em prostituição ou procura de prostitutas nos últimos 10 anos?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.prostitutionConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já esteve envolvido ou pretende se envolver em lavagem de dinheiro?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.moneyLaundryConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já cometeu ou conspirou para cometer um crime de tráfico de pessoas nos Estados Unidos ou fora
                    dos Estados Unidos?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.peopleTrafficConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já ajudou, encorajou, ajudou ou conspirou conscientemente com um indivíduo que cometeu ou
                    conspirou para cometer um crime grave de tráfico de pessoas nos Estados Unidos ou fora?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.helpPeopleTrafficConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você é cônjuge, filho ou filha de um indivíduo que cometeu ou conspirou para cometer um crime de
                    tráfico de pessoas nos Estados Unidos ou fora e, nos últimos cinco anos, beneficiou-se
                    conscientemente das atividades de tráfico?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.parentPeopleTrafficConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você procura se envolver em espionagem, sabotagem, violações de controle de exportação ou qualquer
                    outra atividade ilegal enquanto estiver nos Estados Unidos?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.spyConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você procura se envolver em atividades terroristas enquanto estiver nos Estados Unidos ou já se
                    envolveu em atividades terroristas?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.terrorismConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já prestou ou pretende fornecer assistência financeira ou outro tipo de apoio a terroristas ou
                    organizações terroristas?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.financialAssistanceConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você é membro ou representante de uma organização terrorista?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.terrorismMemberConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você é cônjuge, filho ou filha de um indivíduo que se envolveu em atividades terroristas, inclusive
                    fornecendo assistência financeira ou outro apoio a terroristas ou organizações terroristas, nos
                    últimos cinco anos?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.parentTerrorismConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já ordenou, incitou, cometeu, ajudou ou de alguma forma participou de genocídio?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.genocideConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já cometeu, ordenou, incitou, ajudou ou participou de alguma forma em tortura?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.tortureConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você cometeu, ordenou, incitou, ajudou ou de alguma forma participou em assassinatos extrajudiciais,
                    assassinatos políticos ou outros atos de violência?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.assassinConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já se envolveu no recrutamento ou na utilização de crianças-soldados?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.childSoldierConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você, enquanto servia como funcionário do governo, foi responsável ou executou diretamente, em
                    qualquer momento, violações particularmente graves da liberdade religiosa?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.religionLibertyConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já esteve diretamente envolvido no estabelecimento ou na aplicação de controles populacionais
                    que forçaram uma mulher a se submeter a um aborto contra a sua livre escolha ou um homem ou uma
                    mulher a se submeter à esterilização contra a sua livre vontade?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.abortConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já esteve diretamente envolvido no transplante coercitivo de órgãos humanos ou tecidos
                    corporais?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.coerciveTransplantConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já tentou obter ou ajudar outras pessoas a obter um visto, entrada nos Estados Unidos ou
                    qualquer outro benefício de imigração dos Estados Unidos por meio de fraude, deturpação intencional
                    ou outros meios ilegais?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.visaFraudConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já foi removido ou deportado de algum país?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.deportedConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já recebeu a custódia de uma criança cidadã dos EUA fora dos Estados Unidos de uma pessoa que
                    recebeu a custódia legal de um tribunal dos EUA?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.childCustodyConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você votou nos Estados Unidos violando alguma lei ou regulamento?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.lawViolationConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground/50 font-medium">
                    Você já renunciou à cidadania dos Estados Unidos para evitar impostos?
                  </span>

                  <span className="text-lg font-medium text-foreground">
                    {client.form.avoidTaxConfirmation ? "Sim" : "Não"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
