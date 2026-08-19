import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { HeroUIProvider } from "@heroui/system";

import { Toaster } from "@/components/ui/sonner";
import { NextAuthSessionProvider } from "@/providers/sessionProvider";
import TRPCProvider from "@/providers/TRPCProvider";

import { ourFileRouter } from "@/app/api/uploadthing/core";
import { cn } from "@/lib/utils";

import "./globals.css";

const poppins = localFont({
  src: [
    { path: "../fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cpvistos.com.br"),
  title: "CP Vistos",
  description:
    "CP Vistos - Facilitamos o processo de obtenção do visto americano para você. Oferecemos assistência completa, desde a preparação da documentação até a entrevista no consulado.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="min-h-screen" lang="pt-BR">
      <body
        className={cn("relative min-h-screen overflow-x-hidden bg-background font-sans antialiased", poppins.variable)}
      >
        <NextAuthSessionProvider>
          <TRPCProvider>
            <NextSSRPlugin
              /**
               * The `extractRouterConfig` will extract **only** the route configs
               * from the router to prevent additional information from being
               * leaked to the client. The data passed to the client is the same
               * as if you were to fetch `/api/uploadthing` directly.
               */
              routerConfig={extractRouterConfig(ourFileRouter)}
            />
            <HeroUIProvider>{children}</HeroUIProvider>
          </TRPCProvider>
        </NextAuthSessionProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
