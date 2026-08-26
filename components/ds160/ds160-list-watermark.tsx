"use client";

import Image from "next/image";

/** Marca d'água bem fraca do selo do Departamento de Estado — páginas de lista DS-160. */
export function Ds160ListWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
    >
      <Image
        src="/ds160-watermark-consulado.png"
        alt=""
        width={1024}
        height={1024}
        className="h-[min(72vh,680px)] w-[min(72vh,680px)] max-w-[92vw] select-none object-contain opacity-[0.07]"
        priority={false}
      />
    </div>
  );
}
