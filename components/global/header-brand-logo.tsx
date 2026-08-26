"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

/**
 * Recorte do avião da PNG original (mesma escala da logo no header).
 * Não desenhamos ícone novo — só exibimos os pixels do avião que já existem.
 */
function LogoPlaneCrop() {
  return (
    <>
      {/* mobile / default */}
      <div
        aria-hidden
        className="pointer-events-none overflow-hidden sm:hidden"
        style={{ width: "0.78rem", height: "0.78rem" }}
      >
        <div
          className="relative h-[4.4rem] w-[5rem] shrink-0"
          style={{ marginLeft: "-1.52rem", marginTop: "-2.18rem" }}
        >
          <Image
            src="/assets/images/cp-vistos-logo.png"
            alt=""
            fill
            className="object-contain object-center"
          />
        </div>
      </div>

      {/* sm+ */}
      <div
        aria-hidden
        className="pointer-events-none hidden overflow-hidden sm:block"
        style={{ width: "0.88rem", height: "0.88rem" }}
      >
        <div
          className="relative h-[5rem] w-[5.75rem] shrink-0"
          style={{ marginLeft: "-1.74rem", marginTop: "-2.48rem" }}
        >
          <Image
            src="/assets/images/cp-vistos-logo.png"
            alt=""
            fill
            className="object-contain object-center"
          />
        </div>
      </div>
    </>
  );
}

/**
 * Logo branca no header: fundo azul, maior, avião original animado na curva do C.
 */
export function HeaderBrandLogo() {
  return (
    <Link
      href="/"
      className="relative z-40 flex items-center"
      aria-label="CP Vistos — início"
    >
      <motion.div
        className="relative flex items-center justify-center rounded-2xl bg-[#0B3A6E] px-2.5 py-1.5 shadow-[0_10px_28px_rgba(11,58,110,0.32)] ring-1 ring-white/20 sm:px-3.5 sm:py-2"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-[4.4rem] w-[5rem] sm:h-[5rem] sm:w-[5.75rem]">
          <Image
            src="/assets/images/cp-vistos-logo.png"
            alt="CP Vistos"
            fill
            priority
            className="object-contain object-center"
          />

          {/* Cobre só o avião estático — o recorte animado fica por cima */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[33%] top-[50%] z-[1] h-[11%] w-[11%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0B3A6E]"
          />

          {/*
            Órbita suave na curva interna do C.
            O recorte usa a mesma PNG; só a janela se move.
          */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-[18%] top-[22%] z-[2] h-[52%] w-[48%]"
            style={{ transformOrigin: "44% 62%" }}
            animate={{ rotate: [24, 148, 24] }}
            transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute left-[80%] top-[84%] -translate-x-1/2 -translate-y-1/2">
              <LogoPlaneCrop />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}
