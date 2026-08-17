"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Element } from "react-scroll";

const imageAnimation = {
  hidden: {
    x: 100,
    opacity: 0,
  },
  show: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 1,
      ease: "easeInOut" as const,
    },
  },
};

const containerAnimation = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.5,
    },
  },
};

const itemAnimation = {
  hidden: {
    x: "var(--x-initial)",
    y: "var(--y-initial)",
    opacity: "var(--opacity-initial)",
  },
  show: {
    x: "var(--x-animate)",
    y: "var(--y-animate)",
    opacity: "var(--opacity-animate)",
    transition: {
      duration: 0.7,
      ease: "easeInOut" as const,
    },
  },
};

export function About() {
  return (
    <section className="w-full pt-24 bg-mobile-about bg-no-repeat bg-[length:100%_100%] sm:bg-tablet-about lg:bg-desktop-about lg:pt-36">
      <Element name="about">
        <AnimatePresence>
          <div className="w-full px-6 flex flex-col gap-20 sm:items-end sm:px-16 sm:gap-6 lg:flex-row lg:container lg:gap-20">
            <motion.div
              variants={imageAnimation}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="relative w-full aspect-video sm:max-w-lg"
            >
              <div className="w-fit px-12 py-4 bg-secondary rounded-2xl flex flex-col gap-2 absolute z-[5] -bottom-10 -right-6 sm:right-6 sm:-bottom-12">
                <span className="text-xl font-semibold text-foreground">Camila Paschoal</span>

                <span className="text-base text-foreground/70">Fundadora e CEO</span>
              </div>

              <Image
                src="/assets/images/about.jpg"
                alt="Camila Paschoal"
                fill
                className="rounded-[30px] object-center object-cover"
              />
            </motion.div>

            <motion.div
              variants={containerAnimation}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="w-full flex flex-col gap-6"
            >
              <motion.h2
                variants={itemAnimation}
                className="about-text-animation text-3xl font-bold text-foreground !leading-[110%] sm:text-4xl sm:max-w-xs lg:text-5xl lg:max-w-md"
              >
                A história por trás da assessoria
              </motion.h2>

              <div className="w-full flex flex-col gap-2 lg:max-w-prose">
                <motion.p variants={itemAnimation} className="about-text-animation text-base text-foreground/70">
                  Meu nome é Camila Paschoal, fundadora da CP Vistos, e possuo mais de 20 anos de experiência na área de
                  visto de não imigrante. Atuei diretamente no Consulado Americano como supervisora do setor de vistos,
                  o que me proporcionou uma visão aprofundada dos processos internos, além de um entendimento preciso
                  das exigências e melhores práticas para a aprovação de vistos.
                </motion.p>

                <motion.p variants={itemAnimation} className="about-text-animation text-base text-foreground/70">
                  Em 2022, fundei a CP Vistos com o propósito de simplificar a jornada de quem precisa lidar com um
                  processo muitas vezes burocrático e complexo. Nosso objetivo é oferecer um atendimento claro,
                  eficiente e humanizado, garantindo que cada cliente se sinta seguro(a) e bem orientado(a) em todas as
                  etapas.
                </motion.p>

                <motion.p variants={itemAnimation} className="about-text-animation text-base text-foreground/70">
                  Aliamos conhecimento técnico, experiência prática e uma abordagem próxima e empática para entregar um
                  suporte completo e personalizado. Na CP Vistos, trabalhamos com excelência para transformar um
                  processo desafiador em uma experiência tranquila e bem-sucedida.
                </motion.p>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      </Element>
    </section>
  );
}
