import { ptBR } from "date-fns/locale";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format, getYear, isValid, parse } from "date-fns";
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import type { formType, profileFormSchemaType } from "../page";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileFormProps {
  currentProfile: number;
  setCurrentProfile: Dispatch<SetStateAction<number>>;
  isProfileSameAsAccount: string;
  setIsProfileSameAsAccount: Dispatch<SetStateAction<string>>;
  profiles: profileFormSchemaType[];
  category: "" | "Visto Americano" | "Passaporte" | "E-TA";
  form: formType;
  handleCPF: (e: ChangeEvent<HTMLInputElement>) => string;
}

export function ProfileForm({
  currentProfile,
  setCurrentProfile,
  isProfileSameAsAccount,
  setIsProfileSameAsAccount,
  profiles,
  category,
  form,
  handleCPF,
}: ProfileFormProps) {
  const [birthDateCalendar, setBirthDateCalendar] = useState<Date | undefined>(undefined);
  const [issuanceDateCalendar, setIssuanceDateCalendar] = useState<Date | undefined>(undefined);
  const [expireDateCalendar, setExpireDateCalendar] = useState<Date | undefined>(undefined);
  const [scheduleDateCalendar, setScheduleDateCalendar] = useState<Date | undefined>(undefined);
  const [entryDateCalendar, setEntryDateCalendar] = useState<Date | undefined>(undefined);

  const currentYear = getYear(new Date());

  const visaType = form.watch(`profiles.${currentProfile}.visaType`);

  useEffect(() => {
    if (birthDateCalendar !== undefined) {
      const dateFormatted = format(birthDateCalendar, "dd/MM/yyyy");

      form.setValue(`profiles.${currentProfile}.birthDate`, dateFormatted);
    }
  }, [birthDateCalendar]);

  useEffect(() => {
    if (issuanceDateCalendar !== undefined) {
      const dateFormatted = format(issuanceDateCalendar, "dd/MM/yyyy");

      form.setValue(`profiles.${currentProfile}.issuanceDate`, dateFormatted);
    }
  }, [issuanceDateCalendar]);

  useEffect(() => {
    if (expireDateCalendar !== undefined) {
      const dateFormatted = format(expireDateCalendar, "dd/MM/yyyy");

      form.setValue(`profiles.${currentProfile}.expireDate`, dateFormatted);
    }
  }, [expireDateCalendar]);

  useEffect(() => {
    if (scheduleDateCalendar !== undefined) {
      const dateFormatted = format(scheduleDateCalendar, "dd/MM/yyyy");

      form.setValue(`profiles.${currentProfile}.scheduleDate`, dateFormatted);
    }
  }, [scheduleDateCalendar]);

  useEffect(() => {
    if (entryDateCalendar !== undefined) {
      const dateFormatted = format(entryDateCalendar, "dd/MM/yyyy");

      form.setValue(`profiles.${currentProfile}.entryDate`, dateFormatted);
    }
  }, [entryDateCalendar]);

  function handleDeleteProfile(index: number) {
    const profileUpdated = profiles.filter((_, idx) => idx !== index);

    form.setValue("profiles", profileUpdated);

    setCurrentProfile((prev) => prev - 1);
  }

  function formatDate(e: ChangeEvent<HTMLInputElement>) {
    const numbersOnly = e.target.value.replace(/\D/g, "");

    // Limita a 8 dígitos (ddmmaaaa)
    const limitedNumbers = numbersOnly.slice(0, 8);

    // Formata a data com regex
    const formattedDate = limitedNumbers.replace(/^(\d{0,2})(\d{0,2})(\d{0,4})/, (_, d, m, y) => {
      if (!m) return d;
      if (!y) return `${d}/${m}`;
      return `${d}/${m}/${y}`;
    });

    return formattedDate;
  }

  function handleTime(event: ChangeEvent<HTMLInputElement>) {
    let value = event.target.value.replace(/[^0-9:]/g, "");

    return value;
  }

  function handleDateBlur(field: "birthDate" | "issuanceDate" | "expireDate" | "scheduleDate" | "entryDate") {
    const currentDate = form.getValues(`profiles.${currentProfile}.${field}`);

    if (currentDate) {
      const [day, month, year] = currentDate.split("/");

      if (!day) {
        form.setError(`profiles.${currentProfile}.${field}`, { message: "Data inválida" }, { shouldFocus: true });

        return;
      }

      if (!month) {
        form.setError(`profiles.${currentProfile}.${field}`, { message: "Data inválida" }, { shouldFocus: true });

        return;
      }

      if (!year) {
        form.setError(`profiles.${currentProfile}.${field}`, { message: "Data inválida" }, { shouldFocus: true });

        return;
      }

      if (
        day.length !== 2 ||
        month.length !== 2 ||
        year.length !== 4 ||
        Number(day) === 0 ||
        Number(month) === 0 ||
        Number(year) === 0
      ) {
        form.setError(`profiles.${currentProfile}.${field}`, { message: "Data inválida" }, { shouldFocus: true });

        return;
      } else {
        form.clearErrors(`profiles.${currentProfile}.${field}`);
      }

      if (currentDate?.length === 10) {
        const dateFormatted = parse(currentDate, "dd/MM/yyyy", new Date());

        if (!isValid(dateFormatted)) {
          form.setError(`profiles.${currentProfile}.${field}`, { message: "Data inválida" }, { shouldFocus: true });

          return;
        }

        if (field === "birthDate") {
          setBirthDateCalendar(dateFormatted);
        }

        if (field === "issuanceDate") {
          setIssuanceDateCalendar(dateFormatted);
        }

        if (field === "expireDate") {
          setExpireDateCalendar(dateFormatted);
        }

        if (field === "scheduleDate") {
          setScheduleDateCalendar(dateFormatted);
        }

        if (field === "entryDate") {
          setEntryDateCalendar(dateFormatted);
        }
      }
    }
  }

  return (
    <div className="w-full flex flex-col gap-9">
      <h2 className="text-xl font-semibold sm:text-2xl">Cadastro do Perfil</h2>

      {profiles.length > 1 ? (
        <div className="w-full grid grid-cols-1 gap-12 lg:grid-cols-2">
          {profiles.slice(0, currentProfile).map((profile, index) => (
            <div key={index} className="w-full bg-secondary rounded-2xl p-8 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xl font-semibold text-card-foreground text-left">{profile.profileName}</span>

                <span className="text-sm font-medium text-card-foreground/70 text-left">{profile.category}</span>
              </div>

              <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteProfile(index)}>
                <Trash2 className="text-card-foreground w-6 h-6" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <RadioGroup
          defaultValue={isProfileSameAsAccount}
          onValueChange={setIsProfileSameAsAccount}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-1">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true">Usar mesmos dados da conta</Label>
          </div>

          <div className="flex items-center gap-1">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false">Inserir novos dados</Label>
          </div>
        </RadioGroup>
      )}

      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
        <FormField
          control={form.control}
          name={`profiles.${currentProfile}.category`}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel className="truncate">Categoria*</FormLabel>

              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                    <SelectValue placeholder="Selecione a categoria do perfil" />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  <SelectItem value="Visto Americano">Visto Americano</SelectItem>
                  <SelectItem value="Passaporte">Passaporte</SelectItem>
                  <SelectItem value="E-TA">ESTA / E-TA</SelectItem>
                </SelectContent>
              </Select>

              <FormMessage className="font-normal text-destructive" />
            </FormItem>
          )}
        />
      </div>

      {/* NOTE: Apresenta em todos */}
      <div className="w-full flex flex-col gap-6">
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.profileName`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Nome*</FormLabel>

                <FormControl>
                  <Input
                    placeholder="Insira o nome do perfil"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    disabled={JSON.parse(isProfileSameAsAccount) && profiles.length === 1}
                  />
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.profileCpf`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">CPF*</FormLabel>

                <FormControl>
                  <Input
                    placeholder="Insira o CPF do perfil"
                    maxLength={14}
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      const newValue = handleCPF(event);

                      form.setValue(`profiles.${currentProfile}.profileCpf`, newValue);
                    }}
                    disabled={JSON.parse(isProfileSameAsAccount) && profiles.length === 1}
                  />
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          {/* TODO: formatar como a data é salva, e como é recebido */}
          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.birthDate`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Data de Nascimento</FormLabel>

                <FormControl>
                  <div className="w-full relative">
                    <Input
                      {...field}
                      className="pl-14"
                      maxLength={10}
                      placeholder="Insira a data de nascimento"
                      onChange={(e) => {
                        let valueFormatted = formatDate(e);

                        form.setValue(`profiles.${currentProfile}.birthDate`, valueFormatted);
                      }}
                      onBlur={() => handleDateBlur("birthDate")}
                    />

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex items-center gap-2 h-12 py-2 absolute left-2 top-1/2 -translate-y-1/2"
                        >
                          <CalendarIcon strokeWidth={1.5} className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                          <div className="h-full w-[2px] bg-secondary" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          locale={ptBR}
                          selected={birthDateCalendar}
                          onSelect={setBirthDateCalendar}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={currentYear}
                          month={birthDateCalendar}
                          classNames={{
                            day_hidden: "invisible",
                            dropdown: "px-2 py-1.5 bg-muted text-primary text-sm focus-visible:outline-none",
                            caption_dropdowns: "flex gap-3",
                            vhidden: "hidden",
                            caption_label: "hidden",
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* NOTE: Apresenta somente em Visto Americano e E-TA */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-[calc(70%-12px)_calc(30%-12px)] gap-6">
          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.profileAddress`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Endereço</FormLabel>

                <FormControl>
                  <Input
                    placeholder="Insira o endereço do perfil"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    disabled={JSON.parse(isProfileSameAsAccount) && profiles.length === 1}
                  />
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.passport`}
            render={({ field }) => (
              <FormItem
                className={cn("flex flex-col gap-1", category !== "Visto Americano" && category !== "E-TA" && "hidden")}
              >
                <FormLabel className="truncate">Passaporte</FormLabel>

                <FormControl>
                  <Input placeholder="Insira o passaporte" {...field} />
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.entryDate`}
            render={({ field }) => (
              <FormItem className={cn("flex flex-col gap-1", category !== "Passaporte" && "hidden")}>
                <FormLabel className="truncate">Data de entrada</FormLabel>

                <FormControl>
                  <div className="w-full relative">
                    <Input
                      {...field}
                      className="pl-14"
                      maxLength={10}
                      placeholder="Insira a data de entrada"
                      onChange={(e) => {
                        let valueFormatted = formatDate(e);

                        form.setValue(`profiles.${currentProfile}.entryDate`, valueFormatted);
                      }}
                      onBlur={() => handleDateBlur("entryDate")}
                    />

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex items-center gap-2 h-12 py-2 absolute left-2 top-1/2 -translate-y-1/2"
                        >
                          <CalendarIcon strokeWidth={1.5} className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                          <div className="h-full w-[2px] bg-secondary" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          locale={ptBR}
                          selected={entryDateCalendar}
                          onSelect={setEntryDateCalendar}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={currentYear}
                          month={entryDateCalendar}
                          classNames={{
                            day_hidden: "invisible",
                            dropdown: "px-2 py-1.5 bg-muted text-primary text-sm focus-visible:outline-none",
                            caption_dropdowns: "flex gap-3",
                            vhidden: "hidden",
                            caption_label: "hidden",
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* NOTE: Apresenta somente em Visto Americano */}
        <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", category !== "Visto Americano" && "hidden")}>
          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.visaType`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Tipo de Visto*</FormLabel>

                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                      <SelectValue placeholder="Selecione o tipo de visto" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="Renovação">Renovação</SelectItem>
                    <SelectItem value="Primeiro Visto">Primeiro Visto</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.visaClass`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Classe do Visto*</FormLabel>

                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn("text-left", field.value === "" && "[&>span]:text-muted-foreground")}>
                      <SelectValue placeholder="Selecione a classe do visto" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="B1 Babá">B1 Babá</SelectItem>

                    <SelectItem value="B1/B2 Turismo">B1/B2 Turismo</SelectItem>

                    <SelectItem value="O1 Capacidade Extraordinária">O1 Capacidade Extraordinária</SelectItem>

                    <SelectItem value="O2 Estrangeiro Acompanhante/Assistente">
                      O2 Estrangeiro Acompanhante/Assistente
                    </SelectItem>

                    <SelectItem value="O3 Cônjuge ou Filho de um O1 ou O2">
                      O3 Cônjuge ou Filho de um O1 ou O2
                    </SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.DSNumber`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1 sm:order-3 xl:order-1">
                <FormLabel className="truncate">Barcode</FormLabel>

                <FormControl>
                  <Input placeholder="Insira o número da DS" {...field} />
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* NOTE: Apresenta somente em Visto Americano */}
        <div
          className={cn("w-full grid grid-cols-1 sm:grid-cols-2 gap-6", {
            hidden: visaType !== "Renovação" || category !== "Visto Americano",
          })}
        >
          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.issuanceDate`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Data de Emissão</FormLabel>

                <FormControl>
                  <div className="w-full relative">
                    <Input
                      {...field}
                      className="pl-14"
                      maxLength={10}
                      placeholder="Insira a data de emissão"
                      onChange={(e) => {
                        let valueFormatted = formatDate(e);

                        form.setValue(`profiles.${currentProfile}.issuanceDate`, valueFormatted);
                      }}
                      onBlur={() => handleDateBlur("issuanceDate")}
                    />

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex items-center gap-2 h-12 py-2 absolute left-2 top-1/2 -translate-y-1/2"
                        >
                          <CalendarIcon strokeWidth={1.5} className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                          <div className="h-full w-[2px] bg-secondary" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          locale={ptBR}
                          selected={issuanceDateCalendar}
                          onSelect={setIssuanceDateCalendar}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={currentYear}
                          month={issuanceDateCalendar}
                          classNames={{
                            day_hidden: "invisible",
                            dropdown: "px-2 py-1.5 bg-muted text-primary text-sm focus-visible:outline-none",
                            caption_dropdowns: "flex gap-3",
                            vhidden: "hidden",
                            caption_label: "hidden",
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.expireDate`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1 sm:order-2 xl:order-3">
                <FormLabel className="truncate">Data de Expiração</FormLabel>

                <FormControl>
                  <div className="w-full relative">
                    <Input
                      {...field}
                      className="pl-14"
                      maxLength={10}
                      placeholder="Insira a data de expiração"
                      onChange={(e) => {
                        let valueFormatted = formatDate(e);

                        form.setValue(`profiles.${currentProfile}.expireDate`, valueFormatted);
                      }}
                      onBlur={() => handleDateBlur("expireDate")}
                    />

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex items-center gap-2 h-12 py-2 absolute left-2 top-1/2 -translate-y-1/2"
                        >
                          <CalendarIcon strokeWidth={1.5} className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                          <div className="h-full w-[2px] bg-secondary" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          locale={ptBR}
                          selected={expireDateCalendar}
                          onSelect={setExpireDateCalendar}
                          disabled={(date) => date > new Date("2200-01-01") || date < new Date("1900-01-01")}
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={2200}
                          month={expireDateCalendar}
                          classNames={{
                            day_hidden: "invisible",
                            dropdown: "px-2 py-1.5 bg-muted text-primary text-sm focus-visible:outline-none",
                            caption_dropdowns: "flex gap-3",
                            vhidden: "hidden",
                            caption_label: "hidden",
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* NOTE: Apresenta somente em Passaporte */}
        <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", category !== "Passaporte" && "hidden")}>
          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.responsibleCpf`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">CPF do responsável</FormLabel>

                <FormControl>
                  <Input
                    placeholder="Insira o CPF do responsável"
                    maxLength={14}
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    disabled={field.disabled}
                    onChange={(event) => {
                      const newValue = handleCPF(event);

                      form.setValue(`profiles.${currentProfile}.responsibleCpf`, newValue);
                    }}
                  />
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.protocol`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Protocolo</FormLabel>

                <FormControl>
                  <Input placeholder="Insira o protocolo" {...field} />
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.paymentStatus`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Status do pagamento</FormLabel>

                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                      <SelectValue placeholder="Selecione o status do pagamento" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>

                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* NOTE: Apresenta somente em Passaporte */}
        <div className={cn("w-full grid grid-cols-1 sm:grid-cols-3 gap-6", category !== "Passaporte" && "hidden")}>
          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.scheduleDate`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Data do agendamento</FormLabel>

                <FormControl>
                  <div className="w-full relative">
                    <Input
                      {...field}
                      className="pl-14"
                      maxLength={10}
                      placeholder="Insira a data do agendamento"
                      onChange={(e) => {
                        let valueFormatted = formatDate(e);

                        form.setValue(`profiles.${currentProfile}.scheduleDate`, valueFormatted);
                      }}
                      onBlur={() => handleDateBlur("scheduleDate")}
                    />

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex items-center gap-2 h-12 py-2 absolute left-2 top-1/2 -translate-y-1/2"
                        >
                          <CalendarIcon strokeWidth={1.5} className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                          <div className="h-full w-[2px] bg-secondary" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          locale={ptBR}
                          selected={scheduleDateCalendar}
                          onSelect={setScheduleDateCalendar}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={currentYear}
                          month={scheduleDateCalendar}
                          classNames={{
                            day_hidden: "invisible",
                            dropdown: "px-2 py-1.5 bg-muted text-primary text-sm focus-visible:outline-none",
                            caption_dropdowns: "flex gap-3",
                            vhidden: "hidden",
                            caption_label: "hidden",
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.scheduleTime`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Horário do agendamento</FormLabel>

                <FormControl>
                  <Input
                    placeholder="Insira o horário do agendamento"
                    maxLength={5}
                    ref={field.ref}
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    disabled={field.disabled}
                    onChange={(event) => {
                      const newValue = handleTime(event);

                      form.setValue(`profiles.${currentProfile}.scheduleTime`, newValue);
                    }}
                  />
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.scheduleLocation`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Local do agendamento</FormLabel>

                <FormControl>
                  <Input placeholder="Insira o local do agendamento" {...field} />
                </FormControl>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* NOTE: Apresenta somente em E-TA */}
        <div
          className={cn("w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", category !== "E-TA" && "hidden")}
        >
          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.ETAStatus`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Status</FormLabel>

                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="Em Análise">Em Análise</SelectItem>

                    <SelectItem value="Aprovado">Aprovado</SelectItem>

                    <SelectItem value="Reprovado">Reprovado</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`profiles.${currentProfile}.process`}
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="truncate">Classificação</FormLabel>

                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn(field.value === "" && "[&>span]:text-muted-foreground")}>
                      <SelectValue placeholder="Selecione a classificação" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="ESTA">ESTA</SelectItem>
                    <SelectItem value="E-TA">E-TA</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage className="font-normal text-destructive" />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
