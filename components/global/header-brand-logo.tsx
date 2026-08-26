"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

/**
 * Logo branca no header — avião percorre o arco do C (topo do globo → fim do C)
 * e para na posição do logo, como no desenho original.
 */
const C_ARC_PATH =
  "M 50 20 C 22 18, 8 34, 10 50 C 12 64, 30 72, 49 66";

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

          {/* Esconde o avião estático da PNG — o animado assume no fim do arco */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[33%] top-[53%] h-[13%] w-[17%] rounded-full bg-[#0B3A6E]"
          />

          <svg
            aria-hidden
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          >
            {/* guia do arco (só debug visual — opacidade zero em produção) */}
            <path
              d={C_ARC_PATH}
              fill="none"
              stroke="transparent"
              strokeWidth="0.5"
            />

            <motion.g
              style={{
                offsetPath: `path('${C_ARC_PATH}')`,
                offsetRotate: "auto",
                offsetAnchor: "10px 7px",
              }}
              initial={{ offsetDistance: "0%" }}
              animate={{
                offsetDistance: ["0%", "100%", "100%", "0%"],
              }}
              transition={{
                duration: 9,
                times: [0, 0.32, 0.78, 0.79],
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <g transform="translate(-10,-7)">
                <path
                  d="M2 7 L14 4.5 L17 7 L14 9.5 Z M5.5 6.5 L0 2.5 L1.5 6.5 L0 10.5 Z"
                  fill="#ffffff"
                />
              </g>
            </motion.g>
          </svg>
        </div>
      </div>
    </Link>
  );
}
