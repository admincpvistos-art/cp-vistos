import Link from "next/link";
import Image from "next/image";

/** Logo branca estática no header, com fundo azul. */
export function HeaderBrandLogo() {
  return (
    <Link
      href="/"
      className="relative z-40 flex items-center"
      aria-label="CP Vistos — início"
    >
      <div className="relative flex items-center justify-center rounded-2xl bg-[#0B3A6E] px-2.5 py-1.5 shadow-[0_10px_28px_rgba(11,58,110,0.32)] ring-1 ring-white/20 sm:px-3.5 sm:py-2">
        <div className="relative h-[4.4rem] w-[5rem] sm:h-[5rem] sm:w-[5.75rem]">
          <Image
            src="/assets/images/cp-vistos-logo.png"
            alt="CP Vistos"
            fill
            priority
            className="object-contain object-center"
          />
        </div>
      </div>
    </Link>
  );
}
