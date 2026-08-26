"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

/**
 * Logo branca no header do site, com contraste e avião em movimento.
 * Só para a landing / header público — não altera a logo azul do dashboard.
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
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-[4.4rem] w-[5rem] sm:h-[5rem] sm:w-[5.75rem]">
          <Image
            src="/assets/images/cp-vistos-logo.png"
            alt="CP Vistos"
            fill
            priority
            className="object-contain object-center"
          />

          {/* Cobre o avião estático da PNG para o movimento ficar limpo */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[20%] top-[32%] h-[36%] w-[36%] rounded-full bg-[#0B3A6E]"
          />

          {/* Trajetória + avião (keyframes em % do container) */}
          <span aria-hidden className="pointer-events-none absolute inset-0">
            <motion.span
              className="absolute block h-3 w-4 text-white sm:h-3.5 sm:w-[1.15rem]"
              style={{ left: "22%", top: "58%" }}
              animate={{
                left: ["22%", "18%", "24%", "38%", "48%"],
                top: ["58%", "46%", "30%", "24%", "36%"],
                rotate: [-25, -10, 15, 45, 70],
              }}
              transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 24 16" className="h-full w-full drop-shadow-sm">
                <path
                  d="M2 8 L16 5.2 L19 8 L16 10.8 Z M6 7.6 L1 3.2 L2.4 7.6 L1 12 Z"
                  fill="currentColor"
                />
              </svg>
            </motion.span>
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
