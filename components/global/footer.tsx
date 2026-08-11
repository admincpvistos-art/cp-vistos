import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-primary pt-[520px] sm:pt-[500px]">
      <div className="w-full px-6 pt-12 pb-9 flex items-end justify-between gap-4 sm:gap-12 sm:px-16 lg:container">
        <div className="flex flex-col gap-6 sm:gap-9">
          <Link href="/" className="relative h-[56px] w-[102px] sm:h-[70px] sm:w-[128px]">
            <Image
              src="/assets/images/cp-vistos-logo.png"
              alt="CP Vistos"
              fill
              className="object-contain object-center"
            />
          </Link>

          <span className="text-white text-sm">CNPJ: 68.362.865/0001-31</span>

          <ul className="flex items-center gap-6">
            <li>
              <a href="https://www.instagram.com/cpvistos/" target="_blank" rel="noreferrer noopener">
                <Image
                  src="/assets/icons/Instagram.svg"
                  alt="Instagram"
                  width={24}
                  height={24}
                  className="object-contain object-center"
                />
              </a>
            </li>

            <li>
              <a href="https://wa.link/2i5gt9" target="_blank" rel="noreferrer noopener">
                <Image
                  src="/assets/icons/Whatsapp.svg"
                  alt="Whatsapp"
                  width={24}
                  height={24}
                  className="object-contain object-center"
                />
              </a>
            </li>

            <li>
              <a href="mailto:contato@cpvistos.com.br">
                <Image
                  src="/assets/icons/Gmail.svg"
                  alt="Gmail"
                  width={24}
                  height={24}
                  className="object-contain object-center"
                />
              </a>
            </li>
          </ul>
        </div>

        {/* TODO: adicionar pagina de política de privacidade e termos de uso, e adicionar links para redirecionar para paginas */}
        <nav className="flex flex-col items-end gap-6 sm:flex-row">
          <Link
            href="/politica-de-privacidade"
            className="text-base font-medium text-white text-end relative group lg:text-xl"
          >
            Política de Privacidade
            <div className="absolute -bottom-[2px] right-0 h-[2px] bg-white rounded-full w-0 transition-all group-hover:w-full" />
          </Link>

          <Link href="/termos-de-uso" className="text-base font-medium text-white text-end relative group lg:text-xl">
            Termos de Uso
            <div className="absolute -bottom-[2px] right-0 h-[2px] bg-white rounded-full w-0 transition-all group-hover:w-full" />
          </Link>
        </nav>
      </div>
    </footer>
  );
}
