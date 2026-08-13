"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Search } from "lucide-react";

import { trpc } from "@/lib/trpc-client";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileFormBox } from "@/components/dashboard/profile-form-box";
import { FormChecklist } from "@/components/dashboard/form-checklist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function matchesSearch(name: string, searchValue: string) {
  const term = searchValue
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (term.length <= 2) {
    return true;
  }

  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .includes(term);
}

export default function ClientAreaPage() {
  const [searchValue, setSearchValue] = useState<string>("");
  const [category, setCategory] = useState("american_visa");
  const session = useSession();

  const { data } = trpc.clientRouter.getAreaData.useQuery();

  const visaChecklist = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.visa.checklist.filter((item) => matchesSearch(item.name, searchValue));
  }, [data, searchValue]);

  const passportChecklist = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.passport.checklist.filter((item) => matchesSearch(item.name, searchValue));
  }, [data, searchValue]);

  const showVisaCard = !!data?.visa.current && matchesSearch(data.visa.current.name, searchValue);
  const showPassportCard = !!data?.passport.current && matchesSearch(data.passport.current.name, searchValue);

  if (session.status === "loading") {
    return (
      <div className="w-screen h-[calc(100vh-96px)] flex flex-col gap-4 items-center justify-center">
        <Loader2 size={100} strokeWidth={1} className="animate-spin" />

        <span className="text-center text-2xl font-semibold text-primary">Um momento...</span>
      </div>
    );
  }

  return (
    <div className="w-full px-6 sm:px-16 mt-6 mb-12 lg:mb-24 lg:mt-10 lg:container lg:mx-auto">
      <div className="w-full flex flex-col items-center justify-between gap-6 mb-12 sm:flex-row lg:gap-12">
        <h1 className="text-3xl lg:text-4xl font-medium">Olá {session.data?.user?.name?.split(" ")[0]}</h1>

        <div className="h-12 flex items-center gap-2 border border-muted/70 rounded-xl transition duration-300 bg-background px-3 py-2 text-sm group focus-within:border-primary hover:border-primary w-full sm:max-w-xs">
          <Search className="w-5 h-5 text-border flex-shrink-0" strokeWidth={1.5} />

          <div className="w-[2px] flex-shrink-0 h-full bg-muted rounded-full" />

          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Pesquise seu formulário"
            className="flex h-full w-full transition border-0 duration-300 bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0  disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="w-full flex flex-col gap-10">
        {data === undefined ? (
          <div className="w-full grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="w-full h-80" />
            <Skeleton className="w-full h-80" />
          </div>
        ) : (
          <>
            <div className="w-full grid grid-cols-1 gap-6 md:grid-cols-2">
              {showVisaCard && data.visa.current ? (
                <ProfileFormBox
                  variant="visa"
                  profileId={data.visa.current.profileId}
                  memberUserId={data.visa.current.userId}
                  statusForm={data.visa.current.statusForm}
                  statusDS={data.visa.current.statusDS}
                  profileName={data.visa.current.name}
                  CASVDate={data.visa.current.CASVDate}
                  interviewDate={data.visa.current.interviewDate}
                  DSNumber={data.visa.current.DSNumber}
                  formStep={data.visa.current.formStep}
                  updatedAt={data.visa.current.updatedAt}
                />
              ) : null}

              {showPassportCard && data.passport.current ? (
                <ProfileFormBox
                  variant="passport"
                  profileId={data.passport.current.profileId}
                  memberUserId={data.passport.current.userId}
                  statusForm={data.passport.current.statusForm}
                  statusDS={data.passport.current.statusDS}
                  profileName={data.passport.current.name}
                  CASVDate={data.passport.current.CASVDate}
                  interviewDate={data.passport.current.interviewDate}
                  DSNumber={data.passport.current.DSNumber}
                  protocol={data.passport.current.protocol}
                  expireDate={data.passport.current.expireDate}
                  passportType={data.passport.current.passportType}
                  formStep={data.passport.current.formStep}
                  updatedAt={data.passport.current.updatedAt}
                />
              ) : null}
            </div>

            {!showVisaCard && !showPassportCard && searchValue.length > 2 ? (
              <div className="w-full flex items-center justify-center">
                <span className="text-xl font-medium text-foreground/60 md:text-2xl">Nenhum perfil encontrado</span>
              </div>
            ) : null}

            <Tabs value={category} onValueChange={setCategory}>
              <TabsList className="w-full flex-col h-fit sm:flex-row rounded-xl">
                <TabsTrigger value="american_visa" className="w-full h-10 rounded-lg sm:text-base sm:font-semibold">
                  Visto Americano
                </TabsTrigger>
                <TabsTrigger value="passport" className="w-full h-10 rounded-lg sm:text-base sm:font-semibold">
                  Passaporte
                </TabsTrigger>
              </TabsList>

              <TabsContent value="american_visa" className="mt-6">
                <FormChecklist variant="visa" items={visaChecklist} />
              </TabsContent>

              <TabsContent value="passport" className="mt-6">
                <FormChecklist variant="passport" items={passportChecklist} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
