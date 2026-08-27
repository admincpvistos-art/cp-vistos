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
import type { GoogleReviewItem } from "@/lib/google-reviews";

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

type TestimonialProps = {
  reviews: GoogleReviewItem[];
  ratingLabel?: string;
  reviewCount?: number | null;
  rating?: number | null;
  writeReviewUrl?: string | null;
  mapsUrl?: string | null;
};

function starCount(rating: number | null | undefined) {
  if (rating == null) return 5;
  return Math.max(1, Math.min(5, Math.round(rating)));
}

export function Testimonial({
  reviews,
  ratingLabel = "Excelente",
  reviewCount = null,
  rating = null,
  writeReviewUrl = "/avaliar",
  mapsUrl = null,
}: TestimonialProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const items = reviews.length ? reviews : [];
  const googleHref = mapsUrl || writeReviewUrl || "/avaliar";
  const reviewHref = writeReviewUrl || "/avaliar";
  const summaryStars = starCount(rating);

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
                      {items.map((review, index) => (
                        <CarouselItem key={`${review.name}-${index}`} className="sm:pl-9 basis-[75%] sm:basis-1/2">
                          <Card className="w-full h-full relative">
                            <CardHeader className="w-full flex flex-row items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Image
                                  src={review.profileImage}
                                  alt="Perfil"
                                  width={26}
                                  height={26}
                                  unoptimized={review.profileImage.startsWith("http")}
                                  className="min-h-[26px] min-w-[26px] rounded-full object-cover object-center shrink-0"
                                />

                                <div className="flex flex-col gap-1">
                                  <span className="text-base font-semibold text-destructive">{review.name}</span>

                                  <span className="text-[10px] font-medium text-foreground/70">
                                    {format(new Date(review.date), "dd/MM/yyyy")}
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
                                  {Array.from({ length: review.grades }).map((_, starIndex) => (
                                    <Image
                                      src="/assets/icons/star.svg"
                                      alt="Nota"
                                      width={18}
                                      height={18}
                                      key={starIndex}
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
                  {ratingLabel}
                </motion.span>

                <motion.div variants={googleItemAnimation} className="flex items-center gap-[2px]">
                  {Array.from({ length: summaryStars }).map((_, index) => (
                    <Image
                      key={index}
                      src="/assets/icons/star.svg"
                      alt="Nota"
                      width={30}
                      height={30}
                      className="object-contain object-center"
                    />
                  ))}
                </motion.div>

                <motion.span variants={googleItemAnimation} className="text-base text-foreground text-center">
                  Com Base Em{" "}
                  <strong className="font-semibold">
                    {reviewCount != null ? `${reviewCount} avaliações` : "avaliações no Google"}
                  </strong>
                </motion.span>

                <motion.a
                  variants={googleItemAnimation}
                  href={googleHref}
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

                <motion.a
                  variants={googleItemAnimation}
                  href={reviewHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 text-sm font-medium text-primary underline"
                >
                  Deixe sua avaliação no Google
                </motion.a>
              </motion.div>
            </div>
          </div>
        </AnimatePresence>
      </Element>
    </section>
  );
}
