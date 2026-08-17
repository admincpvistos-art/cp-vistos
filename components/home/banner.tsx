"use client";

import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { AnimatePresence, motion } from "framer-motion";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc-client";
import Image from "next/image";

// TODO: adicionar os textos e link para botão
const BANNER = [
  {
    title: "Já teve um visto negado e quer tentar novamente?",
    desc: "Entre em contato e faça uma análise gratuita do seu perfil. Temos mais 99% de Casos Revertidos!",
    buttonText: "Entrar em contato",
    imageUrl: "/assets/images/banner-1.png",
  },
  {
    title: "Monitoramento de vagas para entrevista!",
    desc: "Nós cuidamos do seu processo de visto com nosso serviço de monitoramento contínuo de vagas. Não perca a chance de garantir sua entrevista na hora certa.",
    buttonText: "Saiba mais",
    imageUrl: "/assets/images/banner-2.jpg",
  },
  {
    title: "Renove o seu visto em até 15 dias!",
    desc: "Com nossa assessoria especializada, você renova seu visto de forma rápida e descomplicada em até 15 dias! Providenciamos todo o trâmite e se você quiser, sem sair de casa!!",
    buttonText: "Fale conosco",
    imageUrl: "/assets/images/banner-3.jpg",
  },
];

const bannerAnimation = {
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
      duration: 1,
      ease: "easeInOut" as const,
    },
  },
};

export function Banner() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const { data } = trpc.websiteRouter.getBanners.useQuery();

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
    <section className="relative w-full px-6 mt-12 sm:mt-24 sm:px-16 lg:container">
      <AnimatePresence>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={bannerAnimation}
          className="w-full h-full"
        >
          <Carousel
            setApi={setApi}
            className="h-full rounded-[45px] overflow-hidden group"
            opts={{ loop: true }}
            plugins={[Autoplay({ delay: 10000 })]}
          >
            <CarouselContent className="h-[550px] ml-0 sm:h-[450px]">
              {data && data.banners.length > 0
                ? data.banners.map((banner, index) => (
                    <CarouselItem key={banner.id} className="h-full pl-0">
                      <div className="relative w-full h-full bg-cover bg-center flex sm:justify-end">
                        <Image
                          src={banner.imageUrl}
                          alt="Banner 1"
                          fill
                          className="object-cover object-center absolute top-0 left-0 right-0 bottom-0"
                        />

                        <div className="w-full h-full flex flex-col justify-end gap-6 pb-20 px-12 relative z-10 bg-gradient-to-b from-transparent to-[#262525] sm:bg-gradient-to-r sm:max-w-sm lg:max-w-2xl">
                          <div className="flex flex-col gap-2">
                            <h5 className="text-white font-bold text-2xl max-w-md lg:text-4xl">
                              {banner.title}
                            </h5>

                            <p className="text-white font-medium text-base lg:text-xl lg:max-w-md">
                              {banner.desc}
                            </p>
                          </div>

                          <Button
                            variant="secondary"
                            className="sm:w-fit lg:text-xl"
                            asChild
                          >
                            <a
                              href={banner.btnLink}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              {banner.btnText}
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))
                : BANNER.map((banner, index) => (
                    <CarouselItem key={index} className="h-full pl-0">
                      <div className="relative w-full h-full bg-cover bg-center flex sm:justify-end">
                        <Image
                          src={banner.imageUrl}
                          alt="Banner 1"
                          fill
                          className="object-cover object-center absolute top-0 left-0 right-0 bottom-0"
                        />

                        <div className="w-full h-full flex flex-col justify-end gap-6 pb-20 px-12 relative z-10 bg-gradient-to-b from-transparent to-[#262525] sm:bg-gradient-to-r sm:max-w-sm lg:max-w-2xl">
                          <div className="flex flex-col gap-2">
                            <h5 className="text-white font-bold text-2xl max-w-md lg:text-4xl">
                              {banner.title}
                            </h5>

                            <p className="text-white font-medium text-base lg:text-xl lg:max-w-md">
                              {banner.desc}
                            </p>
                          </div>

                          <Button
                            variant="secondary"
                            className="sm:w-fit lg:text-xl"
                            asChild
                          >
                            <a
                              href="https://wa.link/2i5gt9"
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              {banner.buttonText}
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
            </CarouselContent>

            <div className="w-full flex items-center justify-center gap-6 absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-500 opacity-0 group-hover:opacity-100">
              {Array.from({ length: count }).map((_, index) => (
                <div
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "rounded-full size-3 bg-white/70 transition-all duration-500 cursor-pointer",
                    {
                      "bg-white w-11": index === current,
                    },
                  )}
                />
              ))}
            </div>
          </Carousel>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
