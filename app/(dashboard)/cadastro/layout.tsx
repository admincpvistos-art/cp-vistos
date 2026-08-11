import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function CadastroLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#F5F8FD]">
      <header className="w-full flex items-center justify-center pt-8 sm:pt-10 pb-2">
        <Link href="/" className="relative w-40 h-20 sm:w-52 sm:h-24">
          <Image
            src="/assets/images/cp-vistos-logo-azul.png"
            alt="CP Vistos"
            fill
            priority
            className="object-contain object-center"
          />
        </Link>
      </header>
      {children}
    </div>
  );
}
