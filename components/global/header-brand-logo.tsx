"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

/** Posição final do avião na PNG (centro do recorte). */
const PLANE_REST = { left: "34.5%", top: "61%", rotate: 38 };

/** Trilha interna do C — avião percorre de cima para a posição final. */
const PLANE_TRACK = {
  left: ["20%", "17%", "15%", "17%", "24%", "30%", `${PLANE_REST.left}`, `${PLANE_REST.left}`],
  top: ["30%", "38%", "48%", "55%", "59%", "61%", `${PLANE_REST.top}`, `${PLANE_REST.top}`],
  rotate: [-125, -95, -55, -15, 18, 32, PLANE_REST.rotate, PLANE_REST.rotate],
};

/** Recorte fixo do avião original — janela grande o bastante para o avião inteiro. */
function LogoPlaneSprite({
  logoW,
  logoH,
  cropX,
  cropY,
  windowSize,
}: {
  logoW: string;
  logoH: string;
  cropX: string;
  cropY: string;
  windowSize: string;
}) {
  return (
    <div
      className="overflow-hidden"
      style={{ width: windowSize, height: windowSize }}
    >
      <div
        className="relative shrink-0"
        style={{
          width: logoW,
          height: logoH,
          marginLeft: cropX,
          marginTop: cropY,
        }}
      >
        <Image
          src="/assets/images/cp-vistos-logo.png"
          alt=""
          fill
          className="object-contain object-center"
        />
      </div>
    </div>
  );
}

/**
 * Logo branca: avião original percorre a curva do C e para na posição final
 * (logo idêntica à estática). Sem pontilhado, trail ou ícone desenhado.
 */
export function HeaderBrandLogo() {
  const cycle = {
    duration: 5.5,
    repeatDelay: 2,
    ease: "easeInOut" as const,
  };

  const trackTimes = [0, 0.22, 0.44, 0.58, 0.72, 0.82, 0.88, 1];
  const planeOpacity = [1, 1, 1, 1, 1, 1, 0, 0];
  const maskOpacity = [1, 1, 1, 1, 1, 1, 0, 0];

  return (
    <Link
      href="/"
      className="relative z-40 flex items-center"
      aria-label="CP Vistos — início"
    >
      <div className="relative flex items-center justify-center rounded-2xl bg-[#0B3A6E] px-2.5 py-1.5 shadow-[0_10px_28px_rgba(11,58,110,0.32)] ring-1 ring-white/20 sm:px-3.5 sm:py-2">
        <div className="relative h-[4.4rem] w-[5rem] sm:h-[5rem] sm:w-[5.75rem]">
          {/* Logo completa — estado final de referência */}
          <Image
            src="/assets/images/cp-vistos-logo.png"
            alt="CP Vistos"
            fill
            priority
            className="object-contain object-center"
          />

          {/* Cobre só o avião estático enquanto o animado percorre o C */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute z-[1] bg-[#0B3A6E]"
            style={{
              left: PLANE_REST.left,
              top: PLANE_REST.top,
              width: "16%",
              height: "14%",
              translate: "-50% -50%",
              rotate: `${PLANE_REST.rotate}deg`,
              borderRadius: "2px",
            }}
            animate={{ opacity: maskOpacity }}
            transition={{
              ...cycle,
              times: trackTimes,
              repeat: Infinity,
            }}
          />

          {/* Avião animado — mobile */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute z-[2] sm:hidden"
            style={{ translate: "-50% -50%" }}
            animate={{
              left: PLANE_TRACK.left,
              top: PLANE_TRACK.top,
              rotate: PLANE_TRACK.rotate,
              opacity: planeOpacity,
            }}
            transition={{
              ...cycle,
              times: trackTimes,
              repeat: Infinity,
            }}
          >
            <LogoPlaneSprite
              logoW="5rem"
              logoH="4.4rem"
              windowSize="1.35rem"
              cropX="-1.38rem"
              cropY="-2.22rem"
            />
          </motion.div>

          {/* Avião animado — sm+ */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute z-[2] hidden sm:block"
            style={{ translate: "-50% -50%" }}
            animate={{
              left: PLANE_TRACK.left,
              top: PLANE_TRACK.top,
              rotate: PLANE_TRACK.rotate,
              opacity: planeOpacity,
            }}
            transition={{
              ...cycle,
              times: trackTimes,
              repeat: Infinity,
            }}
          >
            <LogoPlaneSprite
              logoW="5.75rem"
              logoH="5rem"
              windowSize="1.5rem"
              cropX="-1.58rem"
              cropY="-2.52rem"
            />
          </motion.div>
        </div>
      </div>
    </Link>
  );
}
