"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { LoginCurve } from "iconsax-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Autoplay from "embla-carousel-autoplay";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";

import { LoginHeader } from "./login-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().trim().min(1, "E-mail obrigatório").email("E-mail inválido").toLowerCase(),
  password: z.string().min(1, "Senha obrigatória"),
});

const CAROUSEL_ITEMS = [
  {
    title: "Conectando você aos seus sonhos",
    background: "bg-login-1",
  },
  {
    title: "Transformando planos em conquistas",
    background: "bg-login-2",
  },
  {
    title: "Realize seus planos, nós cuidamos do resto",
    background: "bg-login-3",
  },
];

export function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSubmitted, setUserSubmitted] = useState(false);
  const [passwordType, setPasswordType] = useState<"text" | "password">("password");
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const router = useRouter();
  const session = useSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!userSubmitted && session && session.status === "authenticated") {
      router.push("/");
    }
  }, [session, router, setUserSubmitted, userSubmitted]);

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

  function togglePasswordType() {
    if (passwordType === "text") {
      setPasswordType("password");
    } else {
      setPasswordType("text");
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      const response = await signIn("credentials", {
        ...values,
        redirect: false,
      });

      if (!response?.error) {
        toast.success("Logado com sucesso!");

        setUserSubmitted(true);
        router.push("/verificando-usuario");
      } else if (response.error === "CredentialsSignin") {
        toast.error("Credenciais inválidas");
      } else {
        toast.error("Ocorreu um erro na autenticação");
      }
    } catch (error) {
      console.error({ error });

      toast.error("Ocorreu um erro na autenticação");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen w-full grid grid-cols-2">
      <div className="hidden lg:block lg:p-9 lg:pr-0">
        <Carousel
          setApi={setApi}
          className="h-full rounded-[45px] overflow-hidden"
          opts={{ loop: true }}
          plugins={[Autoplay({ delay: 10000 })]}
        >
          <LoginHeader className="hidden lg:flex z-10" />

          <CarouselContent className="h-full ml-0">
            {CAROUSEL_ITEMS.map((item, index) => (
              <CarouselItem key={index} className="h-full pl-0 basis-full">
                <div
                  className={cn(
                    "relative w-full h-full bg-cover bg-center flex sm:justify-end after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:bottom-0 after:bg-gradient-to-b after:from-transparent after:to-black/50",
                    item.background,
                  )}
                >
                  <div className="w-full h-full flex flex-col justify-end gap-6 pb-20 px-12 relative z-10">
                    <h5 className="text-white font-semibold text-center text-5xl max-w-xl mx-auto">{item.title}</h5>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="w-full flex items-center justify-center gap-6 absolute bottom-6 left-1/2 -translate-x-1/2">
            {Array.from({ length: count }).map((_, index) => (
              <div
                key={index}
                className={cn("rounded-full size-3 bg-white/70 transition-all duration-500", {
                  "bg-white w-11": index === current,
                })}
              />
            ))}
          </div>
        </Carousel>
      </div>

      <div className="w-full h-full relative col-span-2 flex flex-col items-center justify-between gap-16 p-6 pt-28 sm:px-16 sm:justify-center lg:col-span-1 lg:px-24 lg:pb-9">
        <LoginHeader className="lg:hidden" />

        <div className="w-full flex flex-col items-center justify-center gap-16 my-auto sm:max-w-lg">
          <div className="w-full flex flex-col items-center gap-6">
            <h1 className="text-3xl font-bold text-foreground text-center !leading-[110%] sm:text-4xl">
              Bem-vindo(a) de Volta
            </h1>

            <p className="text-base text-center text-foreground/70 max-w-prose sm:text-xl">
              Entre para acompanhar seu processo e ter acesso a todos os nossos serviços.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-12">
              <div className="w-full flex flex-col space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-foreground/70">E-mail</FormLabel>

                      <FormControl>
                        <Input
                          placeholder="Insira seu e-mail"
                          disabled={isSubmitting}
                          className={cn({
                            "border-red-500": form.formState.errors.email,
                          })}
                          {...field}
                        />
                      </FormControl>

                      <FormMessage className="text-sm text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-foreground/70">Senha</FormLabel>

                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Insira sua senha"
                            disabled={isSubmitting}
                            type={passwordType}
                            className={cn({
                              "border-red-500": form.formState.errors.password,
                            })}
                            {...field}
                          />

                          <Button
                            disabled={isSubmitting}
                            onClick={togglePasswordType}
                            variant="link"
                            size="icon"
                            type="button"
                            className="absolute top-1/2 -translate-y-1/2 right-1"
                            asChild
                          >
                            <span className="cursor-pointer">
                              {passwordType === "password" ? <EyeOff color="#C0D2EF" /> : <Eye color="#C0D2EF" />}
                            </span>
                          </Button>
                        </div>
                      </FormControl>

                      <FormMessage className="text-sm text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <Button size="xl" disabled={isSubmitting} className="text-xl flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    Entrando
                    <Loader2 className="animate-spin" />
                  </>
                ) : (
                  <>
                    Entrar
                    <LoginCurve />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <span className="w-full text-sm text-[#8396BE] text-center sm:max-w-lg">
          Esqueceu seu acesso? Não se preocupe! Entre em contato conosco para recuperar sua conta.
        </span>
      </div>
    </section>
  );
}
