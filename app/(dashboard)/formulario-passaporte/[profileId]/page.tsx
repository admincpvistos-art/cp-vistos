"use client";

import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, Send } from "lucide-react";
import { useEffect } from "react";

import { DashboardHeader } from "../../perfil/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc-client";

const formSchema = z.object({
  serviceType: z.string().optional(),
  fullName: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  birthCity: z.string().optional(),
  birthState: z.string().optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  rg: z.string().optional(),
  rgIssuer: z.string().optional(),
  rgDate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  currentPassportNumber: z.string().optional(),
  currentPassportExpire: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function formatStoredDate(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return format(date, "dd/MM/yyyy");
}

export default function PassportFormPage({ params }: { params: { profileId: string } }) {
  const profileId = params.profileId;
  const router = useRouter();

  const { data, isPending } = trpc.clientRouter.getPassportForm.useQuery({ profileId });
  const utils = trpc.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceType: "",
      fullName: "",
      cpf: "",
      birthDate: "",
      birthCity: "",
      birthState: "",
      motherName: "",
      fatherName: "",
      rg: "",
      rgIssuer: "",
      rgDate: "",
      phone: "",
      email: "",
      address: "",
      currentPassportNumber: "",
      currentPassportExpire: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!data?.form) {
      return;
    }

    form.reset({
      serviceType: data.form.serviceType ?? "",
      fullName: data.form.fullName ?? "",
      cpf: data.form.cpf ?? "",
      birthDate: formatStoredDate(data.form.birthDate),
      birthCity: data.form.birthCity ?? "",
      birthState: data.form.birthState ?? "",
      motherName: data.form.motherName ?? "",
      fatherName: data.form.fatherName ?? "",
      rg: data.form.rg ?? "",
      rgIssuer: data.form.rgIssuer ?? "",
      rgDate: formatStoredDate(data.form.rgDate),
      phone: data.form.phone ?? "",
      email: data.form.email ?? "",
      address: data.form.address ?? "",
      currentPassportNumber: data.form.currentPassportNumber ?? "",
      currentPassportExpire: formatStoredDate(data.form.currentPassportExpire),
      notes: data.form.notes ?? "",
    });
  }, [data, form]);

  const { mutate: saveForm, isPending: isSaving } = trpc.clientRouter.savePassportForm.useMutation({
    onSuccess(result) {
      toast.success(result.message);
      utils.clientRouter.getAreaData.invalidate();
      router.push("/area-do-cliente");
    },
    onError(error) {
      toast.error(error.message || "Não foi possível salvar");
    },
  });

  const { mutate: submitForm, isPending: isSubmitting } = trpc.clientRouter.submitPassportForm.useMutation({
    onSuccess(result) {
      toast.success(result.message);
      utils.clientRouter.getAreaData.invalidate();
      router.push("/area-do-cliente");
    },
    onError(error) {
      toast.error(error.message || "Não foi possível enviar");
    },
  });

  const serviceType = form.watch("serviceType");
  const locked = data?.formLocked;
  const busy = isSaving || isSubmitting;

  function payload(): FormValues & { profileId: string } {
    return { profileId, ...form.getValues() };
  }

  if (isPending) {
    return (
      <>
        <DashboardHeader />
        <div className="w-full min-h-[calc(100vh-96px)] flex items-center justify-center pt-20">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (locked) {
    return (
      <>
        <DashboardHeader />
        <div className="w-full min-h-[calc(100vh-96px)] flex flex-col items-center justify-center gap-4 px-6 pt-20">
          <span className="text-xl font-semibold text-center max-w-md">
            Formulário de passaporte enviado e bloqueado. Aguarde o desbloqueio do administrador.
          </span>
          <Button onClick={() => router.push("/area-do-cliente")}>Voltar para a área do cliente</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />

      <div className="w-full px-6 pt-24 pb-16 sm:px-16 lg:container lg:mx-auto">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="w-fit" onClick={() => router.push("/area-do-cliente")}>
              <ArrowLeft className="mr-2 size-4" />
              Voltar
            </Button>
            <h1 className="text-2xl sm:text-3xl font-semibold">Formulário de Passaporte</h1>
            <p className="text-sm text-muted-foreground">
              {data?.profileName ? `Cliente: ${data.profileName}. ` : null}
              Preencha os dados para primeiro passaporte ou renovação. O envio para a conta administrativa específica
              será configurado em seguida.
            </p>
          </div>

          <Form {...form}>
            <form className="flex flex-col gap-8 bg-secondary rounded-2xl p-6 sm:p-8">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de serviço</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                      >
                        <label className="flex items-center gap-2 rounded-xl border border-muted bg-background px-4 py-3 cursor-pointer">
                          <RadioGroupItem value="primeiro" />
                          Primeiro passaporte
                        </label>
                        <label className="flex items-center gap-2 rounded-xl border border-muted bg-background px-4 py-3 cursor-pointer">
                          <RadioGroupItem value="renovacao" />
                          Renovação
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000.000.000-00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de nascimento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="dd/mm/aaaa" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade de nascimento</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF de nascimento</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da mãe</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do pai</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rgIssuer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Órgão emissor</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rgDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de emissão do RG</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="dd/mm/aaaa" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {serviceType === "renovacao" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="currentPassportNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do passaporte atual</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentPassportExpire"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validade do passaporte atual</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="dd/mm/aaaa" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" disabled={busy} onClick={() => saveForm(payload())}>
                  {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                  Salvar
                </Button>
                <Button type="button" disabled={busy} onClick={() => submitForm(payload())}>
                  {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                  Enviar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
