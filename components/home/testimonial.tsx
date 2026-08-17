"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowRight, Verify } from "iconsax-react";
import { AnimatePresence, motion } from "framer-motion";
import { Element } from "react-scroll";

import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { CardContent, CardHeader, Card } from "../ui/card";

import { cn } from "@/lib/utils";

const REVIEWS = [
  {
    profileImage: "/assets/images/testimonial-1.png",
    name: "Claudio Monteiro",
    date: new Date("2024-10-16"),
    grades: 5,
    desc: "Tudo impecável! Do início ao fim. Equipe super atenciosa, cuidadosa e, principalmente, ágil. Meu visto saiu em 1 semana. Já indiquei o serviço para alguns amigos e seguirei indicando.",
  },
  {
    profileImage: "/assets/images/testimonial-2.png",
    name: "Vitoria Barros",
    date: new Date("2024-10-23"),
    grades: 5,
    desc: "Acompanhamento excelente, nos sentimos confiante em cada parte do processo! Super indico, conseguimos emitir e finalizar tudo em 12 dias. 🇺🇸🙏🏻❤️💙",
  },
  {
    profileImage: "/assets/images/testimonial-3.png",
    name: "Tamires Brito",
    date: new Date("2024-08-21"),
    grades: 5,
    desc: "Investimento super válido, uma empresa de confiança, a Camila nos atendeu super bem, sempre solicita a todo tempo esclarecendo todas as nossas dúvidas e,  principalmente nos orientou muito bem desde o princípio ao fim de todo o processo. Graças a Deus, e o trabalho de assessoria dela tivemos a aprovação do visto Americano!🙏🏼😅",
  },
  {
    profileImage: "/assets/images/testimonial-4.png",
    name: "Daniel Vilela",
    date: new Date("2024-08-18"),
    grades: 5,
    desc: "Excelente! A Camila me atendeu super bem, extremamente atenciosa. Foram cerca de 20 dias desde o primeiro contato até estar com o visto em mãos. Muito competente!!",
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
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      duration: 0.7,
      ease: "easeInOut" as const,
    },
  },
};

const googleContainerAnimation = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const googleItemAnimation = {
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
      duration: 0.5,
      ease: "easeInOut" as const,
    },
  },
};

export function Testimonial() {
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
    <section className="w-full mt-24">
      <Element name="testimonials" className="w-full">
        <AnimatePresence>
          <div className="w-full px-6 flex flex-col gap-12 sm:px-16 lg:container">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={containerAnimation}
              className="w-full flex flex-col items-center gap-6"
            >
              <motion.h2
                variants={textAnimation}
                className="text-3xl font-bold text-foreground text-center !leading-[110%] max-w-prose sm:text-4xl lg:text-5xl"
              >
                O que nossos clientes dizem
              </motion.h2>

              <motion.p variants={textAnimation} className="text-xl text-foreground/70 text-center max-w-prose">
                Conheça as experiências de quem confiou em nossos serviços e realizou seus planos com sucesso.
              </motion.p>
            </motion.div>

            <div className="w-full flex flex-col items-center gap-9 lg:flex-row-reverse lg:justify-between lg:gap-24">
              <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={carouselAnimation}
                  className="w-full flex flex-col gap-9"
                >
                  <div className="w-full relative">
                    <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 z-10 h-[calc(100%+1px)] bg-transparent bg-gradient-to-r from-white from-60% to-transparent hover:bg-gradient-to-r hover:from-white hover:from-60% hover:to-transparent hover:bg-transparent rounded-none text-secondary" />

                    <CarouselContent className="sm:-ml-9">
                      {REVIEWS.map((review, index) => (
                        <CarouselItem key={index} className="sm:pl-9 basis-[75%] sm:basis-1/2">
                          <Card className="w-full h-full relative">
                            <CardHeader className="w-full flex flex-row items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Image
                                  src={review.profileImage}
                                  alt="Perfil"
                                  width={26}
                                  height={26}
                                  className="min-h-[26px] min-w-[26px] rounded-full object-cover object-center shrink-0"
                                />

                                <div className="flex flex-col gap-1">
                                  <span className="text-base font-semibold text-destructive">{review.name}</span>

                                  <span className="text-[10px] font-medium text-foreground/70">
                                    {format(review.date, "dd/MM/yyyy")}
                                  </span>
                                </div>
                              </div>

                              <Image
                                src="/assets/icons/Google.svg"
                                alt="Google"
                                width={24}
                                height={24}
                                className="object-contain object-center"
                              />
                            </CardHeader>

                            <CardContent className="w-full flex flex-col gap-4">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-[2px]">
                                  {Array.from({ length: review.grades }).map((_, index) => (
                                    <Image
                                      src="/assets/icons/star.svg"
                                      alt="Nota"
                                      width={18}
                                      height={18}
                                      key={index}
                                      className="object-contain object-center"
                                    />
                                  ))}
                                </div>

                                <Verify variant="Bold" className="text-[#4C84F3] size-5" />
                              </div>

                              <p className="text-base text-foreground/70">{review.desc}</p>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>

                    <CarouselNext className="right-0 top-1/2 -translate-y-1/2 z-10 h-[calc(100%+1px)] bg-transparent bg-gradient-to-l from-white from-60% to-transparent hover:bg-gradient-to-l hover:from-white hover:from-60% hover:to-transparent hover:bg-transparent rounded-none text-secondary" />
                  </div>

                  <div className="w-full flex flex-col items-center gap-9 lg:flex-row-reverse lg:justify-between">
                    <div className="w-fit flex items-center justify-center gap-6">
                      {Array.from({ length: count }).map((_, index) => (
                        <div
                          key={index}
                          className={cn("rounded-full size-3 bg-secondary transition-all duration-500", {
                            "bg-foreground w-11": index === current,
                          })}
                        />
                      ))}
                    </div>

                    <a
                      href="https://www.instagram.com/stories/highlights/17986716230629678/"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary text-xl underline flex items-center gap-2"
                    >
                      <span>Acompanhe Nossos Depoimentos no Instagram</span>
                      <ArrowRight size={24} className="shrink-0 -rotate-45" />
                    </a>
                  </div>
                </motion.div>
              </Carousel>

              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={googleContainerAnimation}
                className="flex flex-col items-center gap-2"
              >
                <motion.span
                  variants={googleItemAnimation}
                  className="text-4xl font-semibold text-foreground text-center"
                >
                  Excelente
                </motion.span>

                <motion.div variants={googleItemAnimation} className="flex items-center gap-[2px]">
                  <Image
                    src="/assets/icons/star.svg"
                    alt="Nota"
                    width={30}
                    height={30}
                    className="object-contain object-center"
                  />
                  <Image
                    src="/assets/icons/star.svg"
                    alt="Nota"
                    width={30}
                    height={30}
                    className="object-contain object-center"
                  />
                  <Image
                    src="/assets/icons/star.svg"
                    alt="Nota"
                    width={30}
                    height={30}
                    className="object-contain object-center"
                  />
                  <Image
                    src="/assets/icons/star.svg"
                    alt="Nota"
                    width={30}
                    height={30}
                    className="object-contain object-center"
                  />
                  <Image
                    src="/assets/icons/star.svg"
                    alt="Nota"
                    width={30}
                    height={30}
                    className="object-contain object-center"
                  />
                </motion.div>

                <motion.span variants={googleItemAnimation} className="text-base text-foreground text-center">
                  Com Base Em <strong className="font-semibold">16 avaliações</strong>
                </motion.span>

                <motion.a
                  variants={googleItemAnimation}
                  href="https://www.google.com/search?q=cp+vistos&rlz=1C1GCEA_enBR1090BR1090&oq=cp+vistos&gs_lcrp=EgZjaHJvbWUqDAgAECMYJxiABBiKBTIMCAAQIxgnGIAEGIoFMhAIARAuGK8BGMcBGIAEGI4FMgoIAhAAGIAEGKIEMgoIAxAAGIAEGKIEMgoIBBAAGIAEGKIEMgYIBRBFGDwyBggGEEUYPDIGCAcQRRg80gEIMTk1MGowajeoAgCwAgA&sourceid=chrome&ie=UTF-8"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block"
                >
                  <Image
                    src="/assets/images/google_logo.svg"
                    alt="Google"
                    width={150}
                    height={47}
                    className="object-contain object-center"
                  />
                </motion.a>
              </motion.div>
            </div>
          </div>
        </AnimatePresence>
      </Element>
    </section>
  );
}
