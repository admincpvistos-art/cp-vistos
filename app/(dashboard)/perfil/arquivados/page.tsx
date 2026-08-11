"use client";

import { redirect, usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";

import { E_TA_Archived } from "./components/e-ta-archived";
import { PassportArchived } from "./components/passport-archived";
import { AmericanVisaArchived } from "./components/american-visa-archived";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientDetailsModal } from "@/components/dashboard/client-details-modal";

function ArchivedComponent() {
  const [category, setCategory] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const session = useSession();

  useEffect(() => {
    let queryCategory = searchParams.get("category");

    if (
      !queryCategory ||
      (queryCategory !== "american_visa" && queryCategory !== "passport" && queryCategory !== "e_ta")
    ) {
      queryCategory = "american_visa";

      router.push(pathname + `?category=${queryCategory}`);
    }

    setCategory(queryCategory);
  }, [searchParams, router]);

  useEffect(() => {
    if (session.status === "unauthenticated") {
      toast.error("Usuário não autorizado");
      redirect("/");
    }
  }, [session]);

  function handleCategory(value: string) {
    setCategory(value);

    router.push(pathname + `?category=${value}`);
  }

  return (
    <>
      <div className="w-full px-6 sm:px-16 lg:px-40 lg:container lg:mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6 mt-6 lg:mt-12">Clientes Arquivados</h1>

        <Tabs value={category} onValueChange={handleCategory}>
          <TabsList className="w-full flex-col h-fit sm:flex-row rounded-xl">
            <TabsTrigger value="american_visa" className="w-full h-10 rounded-lg sm:text-base sm:font-semibold">
              Visto Americano
            </TabsTrigger>
            <TabsTrigger value="passport" className="w-full h-10 rounded-lg sm:text-base sm:font-semibold">
              Passaporte
            </TabsTrigger>
            <TabsTrigger value="e_ta" className="w-full h-10 rounded-lg sm:text-base sm:font-semibold">
              E-TA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="american_visa">
            <AmericanVisaArchived />
          </TabsContent>

          <TabsContent value="passport">
            <PassportArchived />
          </TabsContent>

          <TabsContent value="e_ta">
            <E_TA_Archived />
          </TabsContent>
        </Tabs>
      </div>

      <ClientDetailsModal />
    </>
  );
}

export default function ArchivedPage() {
  return (
    <Suspense>
      <ArchivedComponent />
    </Suspense>
  );
}
