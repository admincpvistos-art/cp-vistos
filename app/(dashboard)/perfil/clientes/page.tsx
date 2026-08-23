import { redirect } from "next/navigation";

/** Página Clientes Ativos removida — redireciona para o Acompanhamento. */
export default function ClientesPage() {
  redirect("/perfil/acompanhamento-clientes");
}
