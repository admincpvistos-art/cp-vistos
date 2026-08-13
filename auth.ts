import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import prisma from "./lib/prisma";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Necessário em produção (Vercel) para evitar erro "Configuration"
  // quando AUTH_URL não está definido.
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",

      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        if (!credentials.email || !credentials.password) {
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        try {
          const user = await prisma.user.findFirst({
            where: {
              email,
            },
          });

          // No Auth.js v5, throw genérico vira erro "Configuration" no client.
          // Retornar null sinaliza credenciais inválidas (CredentialsSignin).
          if (!user) {
            return null;
          }

          if (user.payerUserId) {
            return null;
          }

          if (user.role === "ADMIN" || user.role === "COLLABORATOR") {
            const isAdminPasswordCorrect = await bcrypt.compare(password, user.password);

            if (!isAdminPasswordCorrect) {
              return null;
            }
          } else {
            const isPasswordCorrect = password === user.password;

            if (!isPasswordCorrect) {
              return null;
            }
          }

          // Não devolver o hash da senha para o NextAuth/JWT.
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("[AUTH_AUTHORIZE_ERROR]", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // User is available during sign-in
        token.id = user.id;
      }
      return token;
    },
  },
});
