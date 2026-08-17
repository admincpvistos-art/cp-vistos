"use client";

import { AnimatePresence, motion, px } from "framer-motion";
import { CalendarTick, ClipboardText, Messages2, Profile2User, SearchStatus1 } from "iconsax-react";
import { useEffect, useState } from "react";
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

const STEPS = [
  {
    order: "1.",
    title: "Análise De Perfil",
    icon: <SearchStatus1 className="size-7 shrink-0 text-destructive !m-0" />,
    desc: "Avaliamos minuciosamente suas informações e definimos a melhor estratégia para aumentar suas chances de sucesso.",
  },
  {
    order: "2.",
    title: "Formulário DS-160",
    icon: <ClipboardText className="size-7 shrink-0 text-destructive !m-0" />,
    desc: "Facilitamos o preenchimento do formulário oficial, orientando você em cada etapa e revisando tudo para garantir que esteja correto.",
  },
  {
    order: "3.",
    title: "Agendamento da Entrevista",
    icon: <CalendarTick className="size-7 shrink-0 text-destructive !m-0" />,
    desc: "Orientamos no pagamento da taxa consular e realizamos o agendamento da sua entrevista de forma rápida e eficiente.",
  },
  {
    order: "4.",
    title: "Treinamento para a Entrevista",
    icon: <Profile2User className="size-7 shrink-0 text-destructive !m-0" />,
    desc: "Realizamos uma reunião personalizada com a expert Camila Paschoal para alinhar expectativas e esclarecer todas as suas dúvidas.",
  },
  {
    order: "5.",
    title: "Acompanhamento Pós-entrevista",
    icon: <Messages2 className="size-7 shrink-0 text-destructive !m-0" />,
    desc: "Estaremos com você até o final, acompanhando o processo até a liberação do seu visto!",
  },
];

const titleAnimation = {
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

const buttonsAnimation = {
  hidden: {
    scale: 0.5,
    opacity: 0,
  },
  show: {
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
    y: -50,
    scale: 0.5,
    opacity: 0,
  },
  show: {
    y: 0,
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1,
      ease: "easeInOut" as const,
    },
  },
};

export function HowItWorks() {
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
    <section className="w-full mt-24 flex flex-col gap-9 lg:mt-40">
      <Element name="how-it-works">
        <AnimatePresence>
          <Carousel setApi={setApi} className="w-full flex flex-col gap-6 sm:gap-12" opts={{ loop: true }}>
            <div className="w-full flex flex-col gap-9 px-6 sm:flex-row sm:items-end sm:justify-between sm:px-16 lg:container lg:justify-center">
              <motion.h2
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={titleAnimation}
                className="how-it-works-text-animation w-full text-3xl font-bold text-foreground text-center !leading-[110%] sm:text-4xl sm:text-left sm:w-2/3 lg:text-5xl lg:w-1/2"
              >
                Como será o seu processo conosco
              </motion.h2>

              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={buttonsAnimation}
                className="w-full flex items-center justify-around sm:w-fit sm:justify-start sm:gap-9"
              >
                <CarouselPrevious className="static translate-y-0 sm:size-16" />

                <CarouselNext className="static translate-y-0 sm:size-16" />
              </motion.div>
            </div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={carouselAnimation}
              className="relative w-full flex flex-col gap-9 before:content-[''] before:h-full before:w-12 before:bg-gradient-to-r before:from-white before:to-transparent before:absolute before:top-0 before:left-0 before:z-10 after:content-[''] after:h-full after:w-12 after:bg-gradient-to-l after:from-white after:to-transparent after:absolute after:top-0 after:right-0 after:z-10 sm:px-16 sm:before:left-16 sm:before:w-16 sm:after:right-16 sm:after:w-16 lg:container"
            >
              <CarouselContent className="-ml-9">
                {STEPS.map(({ title, order, icon: Icon, desc }, index) => (
                  <CarouselItem key={index} className="basis-9/12 pl-9 sm:basis-3/5 lg:basis-[30%]">
                    <Card className="h-full">
                      <CardHeader className="flex-row items-center justify-between gap-4">
                        <h5 className="text-lg text-foreground font-semibold">
                          <span className="text-destructive">{order}</span> {title}
                        </h5>

                        {Icon}
                      </CardHeader>

                      <CardContent>
                        <p className="text-base text-foreground/70">{desc}</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <div className="w-full flex items-center justify-center gap-6">
                {Array.from({ length: count }).map((_, index) => (
                  <div
                    key={index}
                    className={cn("rounded-full size-4 bg-secondary transition-all duration-500", {
                      "bg-foreground w-11": index === current,
                    })}
                  />
                ))}
              </div>
            </motion.div>
          </Carousel>
        </AnimatePresence>
      </Element>
    </section>
  );
}
