"use client";

import Image from "next/image";
import { Element, Link as ScrollLink } from "react-scroll";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { HeroCarouselItem } from "./hero-carousel-item";

export function Hero() {
  const [bannerShowing, setBannerShowing] = useState<number>(0);

  useEffect(() => {
    const timeout = setInterval(() => {
      if (bannerShowing === 2) {
        setBannerShowing(0);

        return;
      }

      setBannerShowing((prev) => prev + 1);
    }, 10000);

    return () => {
      clearTimeout(timeout);
    };
  }, [bannerShowing]);

  return (
    <main className="w-full relative pt-28 bg-mobile-hero bg-no-repeat bg-[length:100%_100%] sm:pt-40 sm:bg-tablet-hero lg:pt-44 lg:bg-desktop-hero">
      <Element name="home" className="w-full">
        <div className="w-full px-6 sm:px-16 lg:container">
          <div className="w-full flex flex-col gap-12 sm:max-w-xl ">
            <div className="w-full flex flex-col gap-9">
              <div className="w-full flex flex-col gap-4">
                <motion.h1
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-5xl font-bold text-foreground !leading-[110%] sm:text-6xl lg:text-7xl lg:max-w-lg"
                >
                  Conquiste seu visto sem estresse
                </motion.h1>

                <motion.p
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                  className="text-xl font-medium text-foreground/70 lg:max-w-lg"
                >
                  Facilitamos o processo para obter ou renovar seu visto
                  americano, com rapidez e sem complicações.
                </motion.p>
              </div>

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5, ease: "circOut" }}
                className="w-full bg-secondary/50 rounded-[36px] flex flex-col gap-4 items-center p-3 sm:flex-row"
              >
                <Button
                  variant="destructive"
                  className="w-full text-xl font-medium rounded-full"
                  asChild
                >
                  <a
                    href="https://wa.link/2i5gt9"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Entre em contato
                  </a>
                </Button>

                <Button variant="link" className="w-full text-xl font-medium">
                  <ScrollLink
                    to="services"
                    activeClass="active"
                    spy={true}
                    smooth={true}
                    offset={-200}
                    duration={1000}
                  >
                    Conheça nossos serviços
                  </ScrollLink>
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5, ease: "circOut" }}
              className="w-full p-6 bg-secondary/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)] rounded-2xl flex flex-col gap-9 items-center sm:flex-row"
            >
              <div className="w-fit flex items-center gap-4 sm:flex-col">
                <Image
                  src="/assets/icons/hero-clients.svg"
                  alt="Clientes"
                  width={38}
                  height={38}
                  className="object-center object-contain"
                />

                <div className="flex flex-col sm:items-center">
                  <p className="text-2xl font-semibold text-foreground sm:text-center">
                    5.000
                  </p>
                  <p className="text-xl text-foreground font-medium sm:text-center">
                    Clientes
                  </p>
                </div>
              </div>

              <div className="w-full h-[2px] bg-secondary rounded-full shrink-0 sm:w-[2px] sm:h-28" />

              <div className="w-fit flex items-center gap-4 sm:flex-col">
                <Image
                  src="/assets/icons/hero-approved.svg"
                  alt="Aprovação"
                  width={38}
                  height={38}
                  className="object-center object-contain"
                />

                <div className="flex flex-col sm:items-center">
                  <p className="text-2xl font-semibold text-foreground sm:text-center">
                    98%
                  </p>
                  <p className="text-xl text-foreground font-medium sm:text-center">
                    De Aprovação
                  </p>
                </div>
              </div>

              <div className="w-full h-[2px] bg-secondary rounded-full shrink-0 sm:w-[2px] sm:h-28" />

              <div className="w-fit flex items-center gap-4 sm:flex-col">
                <Image
                  src="/assets/icons/hero-experience.svg"
                  alt="Experiência"
                  width={38}
                  height={38}
                  className="object-center object-contain"
                />

                <div className="flex flex-col sm:items-center">
                  <p className="text-2xl font-semibold text-foreground sm:text-center">
                    20 Anos
                  </p>
                  <p className="text-xl text-foreground font-medium sm:text-center">
                    De Experiência
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          <motion.div className="hidden lg:block lg:absolute lg:top-44 lg:right-0 lg:w-2/5 lg:h-[700px]">
            <AnimatePresence mode="popLayout">
              {bannerShowing === 0 && (
                <motion.div
                  key="hero-image-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="w-full h-full"
                >
                  <Image
                    src="/assets/images/hero-1.webp"
                    alt="Disneyland"
                    fill
                    className="object-center object-cover rounded-l-[60px]"
                    priority
                  />
                </motion.div>
              )}

              {bannerShowing === 1 && (
                <motion.div
                  key="hero-image-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="w-full h-full"
                >
                  <Image
                    src="/assets/images/hero-2.jpg"
                    alt="Estátua da Liberdade"
                    fill
                    className="object-center object-cover rounded-l-[60px]"
                    priority
                  />
                </motion.div>
              )}

              {bannerShowing === 2 && (
                <motion.div
                  key="hero-image-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="w-full h-full"
                >
                  <Image
                    src="/assets/images/hero-3.jpg"
                    alt="Bellagio"
                    fill
                    className="object-center object-cover rounded-l-[60px]"
                    priority
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {bannerShowing === 0 && (
                <motion.div
                  key="hero-desc-1"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 50, opacity: 0 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                  className="px-6 py-4 rounded-l-[30px] bg-white border border-r-0 border-secondary flex flex-col absolute z-10 -bottom-8 right-0"
                >
                  <h3 className="text-2xl font-semibold text-foreground">
                    Disneyland
                  </h3>

                  <p className="text-base font-medium text-foreground/70">
                    Orlando
                  </p>
                </motion.div>
              )}

              {bannerShowing === 1 && (
                <motion.div
                  key="hero-desc-2"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 50, opacity: 0 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                  className="px-6 py-4 rounded-l-[30px] bg-white border border-r-0 border-secondary flex flex-col absolute z-10 -bottom-8 right-0"
                >
                  <h3 className="text-2xl font-semibold text-foreground">
                    Estátua da Liberdade
                  </h3>

                  <p className="text-base font-medium text-foreground/70">
                    Nova Iorque
                  </p>
                </motion.div>
              )}

              {bannerShowing === 2 && (
                <motion.div
                  key="hero-desc-3"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 50, opacity: 0 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                  className="px-6 py-4 rounded-l-[30px] bg-white border border-r-0 border-secondary flex flex-col absolute z-10 -bottom-8 right-0"
                >
                  <h3 className="text-2xl font-semibold text-foreground">
                    Bellagio
                  </h3>

                  <p className="text-base font-medium text-foreground/70">
                    Las Vegas
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </Element>
    </main>
  );
}
