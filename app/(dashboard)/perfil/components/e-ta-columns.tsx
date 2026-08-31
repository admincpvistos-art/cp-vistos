"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { columns, type UserTable } from "./columns";

const formColumn: ColumnDef<UserTable> = {
  id: "estaForm",
  header: () => <span className="block text-center w-full">Formulário</span>,
  cell: ({ row }) => {
    const profileId = row.getValue("id") as string;

    return (
      <div className="flex justify-center">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href={`/perfil/esta-formulario/${profileId}`}>
            <FileText className="size-4" />
            Ver ESTA
          </Link>
        </Button>
      </div>
    );
  },
};

/** Colunas da aba ESTA/E-TA com acesso ao formulário preenchido pelo cliente. */
export const eTaColumns: ColumnDef<UserTable>[] = [...columns, formColumn];
