"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Element } from "react-scroll";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { cn } from "@/lib/utils";

const SERVICES = [
  {
    title: "Autorização ESTA",
    desc: "Emissão de autorização para viagens aos EUA.",
  },
  {
    title: "Autorização E-TA",
    desc: "Emissão de autorização para quem já possui visto americano.",
  },
  {
    title: "Passaporte Brasileiro",
    desc: "Auxílio na emissão de passaporte para brasileiros.",
  },
  {
    title: "Passaporte Português",
    desc: "Monitoramento de vagas para passaporte português.",
  },
  {
    title: "Visto Americano",
    desc: "Solicitação de primeiro visto e renovação com assessoria completa.",
  },
];

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

const textAnimation = {
  hidden: {
    y: 50,
    scale: 0.5,
    opacity: 0,
  },
  show: {
    y: 0,
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.7,
      ease: "easeInOut" as const,
    },
  },
};

const carouselAnimation = {
  hidden: {
    scale: 0.5,
    opacity: 0,
  },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1.5,
      ease: "easeInOut" as const,
    },
  },
};

const buttonAnimation = {
  hidden: {
    y: "var(--y-initial)",
    x: "var(--x-initial)",
    opacity: "var(--opacity-initial)",
  },
  show: {
    y: "var(--y-animate)",
    x: "var(--x-animate)",
    opacity: "var(--opacity-animate)",
    transition: {
      duration: 1,
      ease: "easeInOut" as const,
    },
  },
};

export function Services() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="w-full mt-12 pt-44 bg-mobile-services bg-right-top bg-contain bg-no-repeat sm:bg-[length:50%] sm:bg-desktop-services lg:bg-[length:25%]">
      <Element name="services" className="w-full">
        <div className="w-full px-6 flex flex-col gap-12 sm:px-16 lg:container lg:items-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={containerAnimation}
            className="w-full flex flex-col gap-6 sm:max-w-md lg:items-center lg:max-w-2xl"
          >
            <motion.h2
              variants={textAnimation}
              className="text-3xl font-bold text-foreground !leading-[110%] sm:text-4xl lg:text-center lg:text-5xl"
            >
              Estamos preparados para o que você precisa
            </motion.h2>

            <motion.p variants={textAnimation} className="text-xl text-foreground/70 lg:text-center">
              Oferecemos consultoria especializada e suporte completo para a obtenção de passaportes, vistos americanos
              e autorizações como E-TA e ESTA.
            </motion.p>
          </motion.div>

          <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
            <div className="w-full flex flex-col gap-12">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={carouselAnimation}
                className="w-full relative"
              >
                <CarouselContent className="sm:-ml-9">
                  {SERVICES.map((service, index) => (
                    <CarouselItem key={index} className="sm:pl-9 sm:basis-1/2 lg:basis-1/3">
                      <Card className="w-full h-full relative">
                        <CardHeader className="w-full">
                          <h5 className="text-2xl font-semibold text-foreground w-2/3">{service.title}</h5>

                          <div className="absolute top-4 right-0 p-4 pr-9 rounded-l-lg bg-destructive">
                            <div className="size-4 rounded-full bg-white" />
                          </div>
                        </CardHeader>

                        <CardContent className="w-full">
                          <p className="text-xl text-foreground/70">{service.desc}</p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </motion.div>

              <div className="w-full flex flex-col items-center justify-between gap-12 sm:flex-row">
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={buttonAnimation}
                  className="services-left-buttons-animation flex items-center gap-9"
                >
                  <CarouselPrevious className="static translate-y-0 sm:size-16" />
                  <CarouselNext className="static translate-y-0 sm:size-16" />
                </motion.div>

                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={buttonAnimation}
                  className="services-right-buttons-animation w-fit flex items-center justify-center gap-6"
                >
                  {Array.from({ length: count }).map((_, index) => (
                    <div
                      key={index}
                      className={cn("rounded-full size-3 bg-secondary transition-all duration-500", {
                        "bg-foreground w-11": index === current,
                      })}
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </Carousel>
        </div>
      </Element>
    </section>
  );
}
