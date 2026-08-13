import { Edit, NotepadText, RotateCw, MessageCircleMore, FileText, Plus, UserRoundPlusIcon, Lock, Unlock } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Category, ETAStatus, PaymentStatus, StatusDS, VisaStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { ConfirmActiveStatusModal } from "./confirm-active-status-modal";
import { ConfirmArchiveStatusModal } from "./confirm-archive-status-modal";
import { ConfirmProspectStatusModal } from "./confirm-prospect-status-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import useUserStore from "@/constants/stores/useUserStore";
import { FormAnimation } from "@/constants/animations/modal";
import useClientDetailsModalStore from "@/constants/stores/useClientDetailsModalStore";

import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";

interface Props {
  handleClose: () => void;
}

export function ClientDetailsResume({ handleClose }: Props) {
  const {
    client,
    setClient,
    unsetToResume,
    setToAnnotation,
    setToEditAccount,
    setToComment,
    setToEditProfile,
    setToForm,
    setToNewProfile,
  } = useClientDetailsModalStore();
  const { role } = useUserStore();

  const [statusDS, setStatusDS] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [profileSelected, setProfileSelected] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [ETAStatusValue, setETAStatusValue] = useState("");
  const [isConfirmArchiveStatusOpen, setConfirmArchiveStatusOpen] = useState(false);
  const [isConfirmProspectStatusOpen, setConfirmProspectStatusOpen] = useState(false);
  const [isConfirmActiveStatusOpen, setConfirmActiveStatusOpen] = useState(false);

  const utils = trpc.useUtils();

  useEffect(() => {
    if (client) {
      if (client.birthDate) {
        console.log({ birthDate: client.birthDate.toISOString() });
        console.log({ birthDate: client.birthDate });
        console.log({ birthDate: format(client.birthDate, "dd/MM/yyyy") });
      }

      setStatusDS(client.statusDS);
      setVisaStatus(client.visaStatus);
      setPaymentStatus(client.paymentStatus);
      setETAStatusValue(client.ETAStatus);
    }
  }, [client]);

  const { mutate: setFormLocked, isPending: isFormLockPending } = trpc.userRouter.setFormLocked.useMutation({
    onSuccess({ client }) {
      setClient(client);
      toast.success(client.formLocked ? "Formulário bloqueado" : "Formulário desbloqueado para edição");
    },
    onError(error) {
      toast.error(error.message || "Não foi possível alterar o bloqueio do formulário");
    },
  });

  const { mutate: changeProfile, isPending } = trpc.userRouter.getClientDetails.useMutation({
    onSuccess({ client }) {
      console.log({ clientBirthDate: client.birthDate });

      setClient(client);
    },
    onError(error) {
      console.error(error.data);

      if (error.data && error.data.code === "NOT_FOUND") {
        toast.error(error.message);
      } else {
        toast.error("Ocorreu um erro ao abrir os detalhes do perfil!");
      }
    },
  });
  const { mutate: updateDSValidationDate, isPending: isDSValidPending } =
    trpc.userRouter.updateDSValidationDate.useMutation({
      onSuccess: (data) => {
        setClient(data.updatedClient);
        utils.userRouter.getActiveClients.invalidate();
        toast.success("Data do Barcode atualizada");
      },
      onError: (error) => {
        console.error(error);

        if (error.data && error.data.code === "NOT_FOUND") {
          toast.error(error.message);
        } else {
          toast.error("Ocorreu um erro ao atualizar a data do Barcode");
        }
      },
    });
  const { mutate: updateStatusDS, isPending: isStatusDSUpdating } = trpc.userRouter.updateStatusDS.useMutation({
    onSuccess: (data) => {
      setClient(data.updatedClient);
      setStatusDS(data.status);
      utils.userRouter.getActiveClients.invalidate();
    },
    onError: (error) => {
      console.error(error);

      if (error.data && error.data.code === "NOT_FOUND") {
        toast.error(error.message);
      } else {
        toast.error("Ocorreu um erro ao atualizar o status do DS");
      }
    },
  });
  const { mutate: updateVisaStatus, isPending: isVisaStatusUpdating } = trpc.userRouter.updateVisaStatus.useMutation({
    onSuccess: (data) => {
      setClient(data.updatedClient);
      setVisaStatus(data.status);
      utils.userRouter.getActiveClients.invalidate();
    },
    onError: (error) => {
      console.error(error);

      if (error.data && error.data.code === "NOT_FOUND") {
        toast.error(error.message);
      } else {
        toast.error("Ocorreu um erro ao atualizar o status do visto");
      }
    },
  });
  const { mutate: updatePaymentStatus, isPending: isPaymentStatusUpdating } =
    trpc.userRouter.updatePaymentStatus.useMutation({
      onSuccess: (data) => {
        setClient(data.updatedClient);
        setPaymentStatus(data.status);
        utils.userRouter.getActiveClients.invalidate();
      },
      onError: (error) => {
        console.error(error);

        if (error.data && error.data.code === "NOT_FOUND") {
          toast.error(error.message);
        } else {
          toast.error("Ocorreu um erro ao atualizar o status do pagamento");
        }
      },
    });
  const { mutate: updateETAStatus, isPending: isETAStatusUpdating } = trpc.userRouter.updateETAStatus.useMutation({
    onSuccess: (data) => {
      setClient(data.updatedClient);
      setETAStatusValue(data.status);
      utils.userRouter.getActiveClients.invalidate();
    },
    onError: (error) => {
      console.error(error);

      if (error.data && error.data.code === "NOT_FOUND") {
        toast.error(error.message);
      } else {
        toast.error("Ocorreu um erro ao atualizar o status");
      }
    },
  });

  const isLoading =
    isVisaStatusUpdating ||
    isStatusDSUpdating ||
    isDSValidPending ||
    isPaymentStatusUpdating ||
    isETAStatusUpdating ||
    isPending ||
    isFormLockPending;

  function handleAnnotation() {
    unsetToResume();
    setToAnnotation();
  }

  function handleEditAccount() {
    unsetToResume();
    setToEditAccount();
  }

  function handleComment() {
    unsetToResume();
    setToComment();
  }

  function handleEditProfile() {
    unsetToResume();
    setToEditProfile();
  }

  function handleForm() {
    unsetToResume();
    setToForm();
  }

  function handleNewProfile() {
    unsetToResume();
    setToNewProfile();
  }

  if (!client) {
    return <div>loading...</div>;
  }

  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={FormAnimation} className="w-full">
      <div className="w-full flex flex-col-reverse gap-4 mb-9 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Conta: {client.user.name}</h1>

        <Button onClick={handleClose} variant="link" size="icon" className="self-end" disabled={isLoading}>
          <Image src="/assets/icons/cross-blue.svg" alt="Fechar" width={24} height={24} />
        </Button>
      </div>

      <div className="w-full flex flex-col gap-9">
        <div className="w-full flex flex-col gap-6">
          <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col">
              <span className="text-sm text-foreground/50 font-medium">E-mail</span>

              <span className="text-lg font-medium text-foreground break-words">{client.user.email}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-foreground/50 font-medium">CPF</span>

              <span className="text-lg font-medium text-foreground">
                {client.user.cpf ? client.user.cpf.replace(/[\.\-]/g, "") : "---"}
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-foreground/50 font-medium">Senha</span>

              <span className="text-lg font-medium text-foreground">{client.user.password}</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col">
              <span className="text-sm text-foreground/50 font-medium">E-mail de agendamento</span>

              <span className="text-lg font-medium text-foreground break-words">
                {client.user.emailScheduleAccount}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-foreground/50 font-medium">Senha de agendamento</span>

              <span className="text-lg font-medium text-foreground">{client.user.passwordScheduleAccount}</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-foreground/50 font-medium">Endereço</span>

              <span className="text-lg font-medium text-foreground">
                {client.user.address ? client.user.address : "---"}
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div
              className={cn("flex flex-col", {
                hidden: role !== "ADMIN",
              })}
            >
              <span className="text-sm text-foreground/50 font-medium">Valor</span>

              <span className="text-lg font-medium text-foreground">
                {client.user.budget ? formatPrice(client.user.budget) : "Não informado"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-foreground/50 font-medium">Conta de agendamento</span>

              <span className="text-lg font-medium text-foreground">
                {client.user.scheduleAccount === "active"
                  ? "Ativo"
                  : client.user.scheduleAccount === "inactive"
                  ? "Inativo"
                  : "Não informado"}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-6 sm:flex-row">
          <Button
            size="xl"
            className={cn("w-full flex items-center gap-2 sm:w-fit", {
              hidden: role !== "ADMIN",
            })}
            disabled={isLoading}
            onClick={handleAnnotation}
          >
            <NotepadText className="w-5 h-5" strokeWidth={1.5} />
            Anotações
          </Button>

          <Button
            variant="outline"
            size="xl"
            className="w-full flex items-center gap-2 sm:w-fit"
            disabled={isLoading}
            onClick={handleEditAccount}
          >
            <Edit className="w-5 h-5" strokeWidth={1.5} />
            Editar Conta
          </Button>

          <Button
            variant="outline"
            size="xl"
            className="w-full flex items-center gap-2 sm:w-fit"
            disabled={isLoading}
            onClick={handleNewProfile}
          >
            <Plus className="w-5 h-5" strokeWidth={1.5} />
            Adicionar Perfil
          </Button>
        </div>

        <div className="w-full h-px bg-[#E6EBEE]" />

        {client.category === Category.american_visa && (
          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Perfil: {client.name}</h2>

              {client.user.profiles.length > 0 && (
                <Select
                  value={profileSelected}
                  disabled={isLoading}
                  onValueChange={(value) => {
                    setProfileSelected("");
                    changeProfile({ profileId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione outro perfil" />
                  </SelectTrigger>

                  <SelectContent className="z-[99999]">
                    {client.user.profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Barcode</span>

                <span className="text-base font-medium text-foreground">{client.DSNumber}</span>
              </div>

              <div className="w-full flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground/50">Data do barcode</span>

                  <span className="text-base font-medium text-foreground">
                    {client.DSValid ? format(client.DSValid, "dd/MM/yyyy") : "Expirado"}
                  </span>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-lg"
                        disabled={isLoading}
                        onClick={() => updateDSValidationDate({ profileId: client.id })}
                      >
                        <RotateCw
                          className={cn("w-6 h-6", {
                            "animate-spin": isDSValidPending,
                          })}
                          strokeWidth={1.5}
                        />
                      </Button>
                    </TooltipTrigger>

                    <TooltipContent>
                      <p className="font-medium">Revalidar Barcode</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Data de Nascimento</span>

                <span className="text-base font-medium text-foreground">
                  {client.birthDate ? format(client.birthDate.toISOString(), "dd/MM/yyyy") : "--/--/----"}
                </span>
              </div>

              <div className="w-full flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground/50">Data do pagamento do boleto</span>

                  <span className="text-base font-medium text-foreground">
                    {client.taxDate ? format(client.taxDate, "dd/MM/yyyy") : "Pendente"}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Passaporte</span>

                <span className="text-base font-medium text-foreground">
                  {client.passport ? client.passport : "---"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Classe do Visto</span>

                <span className="text-base font-medium text-foreground line-clamp-2">
                  {client.visaClass === "B1"
                    ? "B1 Babá"
                    : client.visaClass === "B2_B1"
                    ? "B1/B2 Turismo"
                    : client.visaClass === "O1"
                    ? "O1 Capacidade Extraordinária"
                    : client.visaClass === "O2"
                    ? "O2 Estrangeiro Acompanhante/Assistente"
                    : client.visaClass === "O3"
                    ? "O3 Cônjuge ou Filho de um O1 ou O2"
                    : "Não informado"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Tipo de Visto</span>

                <span className="text-base font-medium text-foreground">
                  {client.visaType === "renovacao"
                    ? "Renovação"
                    : client.visaType === "primeiro_visto"
                    ? "Primeiro Visto"
                    : "Não informado"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Opção de Envio</span>

                <span className="text-base font-medium text-foreground">
                  {client.shipping === "pickup"
                    ? "Retirada"
                    : client.shipping === "sedex"
                    ? "SEDEX"
                    : client.shipping === "c_pickup"
                    ? "C-Retirada"
                    : client.shipping === "c_sedex"
                    ? "C-SEDEX"
                    : "A Verificar"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Data CASV</span>

                <span className="text-base font-medium text-foreground line-clamp-2">
                  {client.CASVDate ? format(client.CASVDate, "dd/MM/yyyy") : "--/--/----"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Data da Entrevista</span>

                <span className="text-base font-medium text-foreground">
                  {client.interviewDate
                    ? client.interviewTime
                      ? `${format(client.interviewDate, "dd/MM/yyyy")} - ${client.interviewTime}`
                      : format(client.interviewDate, "dd/MM/yyyy")
                    : "--/--/----"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground/50 flex items-center gap-2">
                  Status do DS
                  {isStatusDSUpdating && <RotateCw className="h-3 w-3 animate-spin" strokeWidth={1.5} />}
                </span>

                <Select
                  defaultValue={client.statusDS}
                  value={statusDS}
                  onValueChange={(value) => {
                    updateStatusDS({
                      profileId: client.id,
                      status: value as StatusDS,
                    });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className={cn(!client.statusDS && "[&>span]:text-muted-foreground")}>
                    <SelectValue placeholder="Selecione o status do DS" />
                  </SelectTrigger>

                  <SelectContent className="z-[99999]">
                    <SelectItem value="awaiting">Aguardando</SelectItem>
                    <SelectItem value="filling">Preenchendo</SelectItem>
                    <SelectItem value="filled">Preenchido</SelectItem>
                    <SelectItem value="emitted">Emitido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground/50 flex items-center gap-2">
                  Status do Visto
                  {isVisaStatusUpdating && <RotateCw className="h-3 w-3 animate-spin" strokeWidth={1.5} />}
                </span>

                <Select
                  defaultValue={client.visaStatus}
                  value={visaStatus}
                  onValueChange={(value) => {
                    updateVisaStatus({
                      profileId: client.id,
                      status: value as VisaStatus,
                    });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className={cn(!client.visaStatus && "[&>span]:text-muted-foreground")}>
                    <SelectValue placeholder="Selecione o status do visto" />
                  </SelectTrigger>

                  <SelectContent className="z-[99999]">
                    <SelectItem value="awaiting">Aguardando</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="disapproved">Reprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-full flex flex-col-reverse gap-6 sm:flex-col">
              {client.status === "archived" ? (
                <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfirmActiveStatusModal
                    isOpen={isConfirmActiveStatusOpen}
                    setOpen={setConfirmActiveStatusOpen}
                    profileId={client.id}
                    btnLabel="Desarquivar"
                    type="archived"
                    title="Tem certeza que deseja desarquivar esse perfil?"
                    description="O perfil será armazenado na página de clientes ativos."
                    isLoading={isLoading}
                  />

                  <ConfirmProspectStatusModal
                    isOpen={isConfirmProspectStatusOpen}
                    setOpen={setConfirmProspectStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />
                </div>
              ) : client.status === "prospect" ? (
                <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfirmArchiveStatusModal
                    isOpen={isConfirmArchiveStatusOpen}
                    setOpen={setConfirmArchiveStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />

                  <ConfirmActiveStatusModal
                    isOpen={isConfirmActiveStatusOpen}
                    setOpen={setConfirmActiveStatusOpen}
                    profileId={client.id}
                    btnLabel="Ativar"
                    type="prospect"
                    title="Tem certeza que deseja ativar esse perfil?"
                    description="O perfil será armazenado na página de clientes ativos."
                    isLoading={isLoading}
                  />
                </div>
              ) : (
                <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfirmArchiveStatusModal
                    isOpen={isConfirmArchiveStatusOpen}
                    setOpen={setConfirmArchiveStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />

                  <ConfirmProspectStatusModal
                    isOpen={isConfirmProspectStatusOpen}
                    setOpen={setConfirmProspectStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />
                </div>
              )}

              <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Button
                  variant="outline"
                  size="xl"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                  onClick={handleComment}
                >
                  <MessageCircleMore className="w-5 h-5" strokeWidth={1.5} />
                  Comentários
                </Button>

                <Button
                  variant="outline"
                  size="xl"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                  onClick={handleEditProfile}
                >
                  <Edit className="w-5 h-5" strokeWidth={1.5} />
                  Editar Perfil
                </Button>
              </div>

              <Button disabled={isLoading} size="xl" className="flex items-center gap-2" onClick={handleForm}>
                <FileText className="w-5 h-5" strokeWidth={1.5} />
                Formulário
              </Button>

              {role === "ADMIN" && client.statusForm === "filled" ? (
                <Button
                  variant="outline"
                  disabled={isLoading}
                  size="xl"
                  className="flex items-center gap-2"
                  onClick={() =>
                    setFormLocked({
                      profileId: client.id,
                      locked: client.formLocked === false,
                    })
                  }
                >
                  {client.formLocked !== false ? (
                    <>
                      <Unlock className="w-5 h-5" strokeWidth={1.5} />
                      Desbloquear formulário
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" strokeWidth={1.5} />
                      Bloquear formulário
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {client.category === Category.passport && (
          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Perfil: {client.name}</h2>

              {client.user.profiles.length > 0 && (
                <Select
                  value={profileSelected}
                  disabled={isLoading}
                  onValueChange={(value) => {
                    setProfileSelected("");
                    changeProfile({ profileId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione outro perfil" />
                  </SelectTrigger>

                  <SelectContent className="z-[99999]">
                    {client.user.profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">CPF</span>

                <span className="text-base font-medium text-foreground">{client.cpf}</span>
              </div>

              <div className="w-full flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground/50">CPF do responsável</span>

                  <span className="text-base font-medium text-foreground">{client.responsibleCpf}</span>
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Protocolo</span>

                <span className="text-base font-medium text-foreground">{client.protocol}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Data de entrada</span>

                <span className="text-base font-medium text-foreground">
                  {client.entryDate ? format(client.entryDate, "dd/MM/yyyy") : "--/--/----"}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Data do agendamento</span>

                <span className="text-base font-medium text-foreground">
                  {client.scheduleDate
                    ? client.scheduleTime
                      ? `${format(client.scheduleDate, "dd/MM/yyyy")} - ${client.scheduleTime}`
                      : format(client.scheduleDate, "dd/MM/yyyy")
                    : "--/--/----"}
                </span>
              </div>

              <div className="w-full flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground/50">Local do agendamento</span>

                  <span className="text-base font-medium text-foreground">{client.scheduleLocation}</span>
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground/50 flex items-center gap-2">
                  Status do pagamento
                  {isPaymentStatusUpdating && <RotateCw className="h-3 w-3 animate-spin" strokeWidth={1.5} />}
                </span>

                <Select
                  defaultValue={client.paymentStatus}
                  value={paymentStatus}
                  onValueChange={(value) => {
                    updatePaymentStatus({
                      profileId: client.id,
                      status: value as PaymentStatus,
                    });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className={cn(!client.paymentStatus && "[&>span]:text-muted-foreground")}>
                    <SelectValue placeholder="Selecione o status do pagamento" />
                  </SelectTrigger>

                  <SelectContent className="z-[99999]">
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-full flex flex-col-reverse gap-6 sm:flex-col">
              {client.status === "archived" ? (
                <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfirmActiveStatusModal
                    isOpen={isConfirmActiveStatusOpen}
                    setOpen={setConfirmActiveStatusOpen}
                    profileId={client.id}
                    btnLabel="Desarquivar"
                    type="archived"
                    title="Tem certeza que deseja desarquivar esse perfil?"
                    description="O perfil será armazenado na página de clientes ativos."
                    isLoading={isLoading}
                  />

                  <ConfirmProspectStatusModal
                    isOpen={isConfirmProspectStatusOpen}
                    setOpen={setConfirmProspectStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />
                </div>
              ) : client.status === "prospect" ? (
                <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfirmArchiveStatusModal
                    isOpen={isConfirmArchiveStatusOpen}
                    setOpen={setConfirmArchiveStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />

                  <ConfirmActiveStatusModal
                    isOpen={isConfirmActiveStatusOpen}
                    setOpen={setConfirmActiveStatusOpen}
                    profileId={client.id}
                    btnLabel="Ativar"
                    type="prospect"
                    title="Tem certeza que deseja ativar esse perfil?"
                    description="O perfil será armazenado na página de clientes ativos."
                    isLoading={isLoading}
                  />
                </div>
              ) : (
                <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfirmArchiveStatusModal
                    isOpen={isConfirmArchiveStatusOpen}
                    setOpen={setConfirmArchiveStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />

                  <ConfirmProspectStatusModal
                    isOpen={isConfirmProspectStatusOpen}
                    setOpen={setConfirmProspectStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />
                </div>
              )}

              <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Button
                  variant="outline"
                  size="xl"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                  onClick={handleComment}
                >
                  <MessageCircleMore className="w-5 h-5" strokeWidth={1.5} />
                  Comentários
                </Button>

                <Button
                  variant="outline"
                  size="xl"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                  onClick={handleEditProfile}
                >
                  <Edit className="w-5 h-5" strokeWidth={1.5} />
                  Editar Perfil
                </Button>
              </div>
            </div>
          </div>
        )}

        {client.category === Category.e_ta && (
          <div className="w-full flex flex-col gap-6">
            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Perfil: {client.name}</h2>

              {client.user.profiles.length > 0 && (
                <Select
                  value={profileSelected}
                  disabled={isLoading}
                  onValueChange={(value) => {
                    setProfileSelected("");
                    changeProfile({ profileId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione outro perfil" />
                  </SelectTrigger>

                  <SelectContent className="z-[99999]">
                    {client.user.profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">CPF</span>

                <span className="text-base font-medium text-foreground">{client.cpf}</span>
              </div>

              <div className="w-full flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground/50">Processo</span>

                  <span className="text-base font-medium text-foreground">{client.process}</span>
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground/50">Passaporte</span>

                <span className="text-base font-medium text-foreground">{client.passport}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground/50 flex items-center gap-2">
                  Status
                  {isETAStatusUpdating && <RotateCw className="h-3 w-3 animate-spin" strokeWidth={1.5} />}
                </span>

                <Select
                  defaultValue={client.ETAStatus}
                  value={ETAStatusValue}
                  onValueChange={(value) => {
                    updateETAStatus({
                      profileId: client.id,
                      status: value as ETAStatus,
                    });
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className={cn(!client.ETAStatus && "[&>span]:text-muted-foreground")}>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>

                  <SelectContent className="z-[99999]">
                    <SelectItem value="analysis">Em Análise</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="disapproved">Reprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-full flex flex-col-reverse gap-6 sm:flex-col">
              {client.status === "archived" ? (
                <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfirmActiveStatusModal
                    isOpen={isConfirmActiveStatusOpen}
                    setOpen={setConfirmActiveStatusOpen}
                    profileId={client.id}
                    btnLabel="Desarquivar"
                    type="archived"
                    title="Tem certeza que deseja desarquivar esse perfil?"
                    description="O perfil será armazenado na página de clientes ativos."
                    isLoading={isLoading}
                  />

                  <ConfirmProspectStatusModal
                    isOpen={isConfirmProspectStatusOpen}
                    setOpen={setConfirmProspectStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />
                </div>
              ) : client.status === "prospect" ? (
                <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfirmArchiveStatusModal
                    isOpen={isConfirmArchiveStatusOpen}
                    setOpen={setConfirmArchiveStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />

                  <ConfirmActiveStatusModal
                    isOpen={isConfirmActiveStatusOpen}
                    setOpen={setConfirmActiveStatusOpen}
                    profileId={client.id}
                    btnLabel="Ativar"
                    type="prospect"
                    title="Tem certeza que deseja ativar esse perfil?"
                    description="O perfil será armazenado na página de clientes ativos."
                    isLoading={isLoading}
                  />
                </div>
              ) : (
                <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ConfirmArchiveStatusModal
                    isOpen={isConfirmArchiveStatusOpen}
                    setOpen={setConfirmArchiveStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />

                  <ConfirmProspectStatusModal
                    isOpen={isConfirmProspectStatusOpen}
                    setOpen={setConfirmProspectStatusOpen}
                    profileId={client.id}
                    isLoading={isLoading}
                  />
                </div>
              )}

              <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Button
                  variant="outline"
                  size="xl"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                  onClick={handleComment}
                >
                  <MessageCircleMore className="w-5 h-5" strokeWidth={1.5} />
                  Comentários
                </Button>

                <Button
                  variant="outline"
                  size="xl"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                  onClick={handleEditProfile}
                >
                  <Edit className="w-5 h-5" strokeWidth={1.5} />
                  Editar Perfil
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
