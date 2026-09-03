import type { NextAuthOptions } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { verifyPassword } from "./password";
import { sendMagicLinkEmail } from "@/lib/email/send-email";
import { isDesktopMode } from "@/lib/desktop";

const baseAdapter = PrismaAdapter(prisma) as Adapter;

const adapter: Adapter = {
  ...baseAdapter,
  async createUser(data: Omit<AdapterUser, "id">) {
    const userData = { ...data };

    // Gera um nome automático a partir do e-mail, caso não exista.
    // Ex.: "teste1@example.com" -> "teste1"
    if (!userData.name && userData.email) {
      const localPart = userData.email.split("@")[0] || "user";
      userData.name = localPart;
    }

    return baseAdapter.createUser(userData);
  },
  async deleteSession(sessionToken: string) {
    try {
      await baseAdapter.deleteSession?.(sessionToken);
    } catch (error) {
      // Se a sessão já não existe (P2025), ignora o erro silenciosamente
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return;
      }
      throw error;
    }
  }
};

export const authOptions: NextAuthOptions = {
  adapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    // JWT strategy funciona melhor com CredentialsProvider
    // Database strategy é usado apenas para OAuth providers (GitHub, Email)
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.isAdmin = Boolean(
          (user as { isAdmin?: boolean }).isAdmin
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | undefined;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    }
  },
  providers: [
    // Login com email e senha (principal)
    CredentialsProvider({
      name: "Email e Senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) {
          // Não revela se o email existe (segurança)
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // Retorna objeto compatível com NextAuth
        // IMPORTANTE: email deve ser string, não null
        if (!user.email) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          isAdmin: Boolean(user.isAdmin),
        };
      }
    }),
    ...(isDesktopMode()
      ? []
      : [
          GitHubProvider({
            clientId: process.env.GITHUB_ID ?? "",
            clientSecret: process.env.GITHUB_SECRET ?? ""
          }),
          EmailProvider({
            server: {
              host: "resend",
            },
            from: process.env.EMAIL_FROM || "Cashflow Pro <no-reply@cashflowpro.com>",
            maxAge: 15 * 60,
            async sendVerificationRequest({ identifier: email, url }) {
              try {
                await sendMagicLinkEmail(email, url);
                console.log(`[auth] Magic link enviado para ${email}`);
              } catch (error) {
                console.error("[auth] Erro ao enviar magic link:", error);
              }
            },
          }),
        ]),
  ],
  pages: {
    signIn: "/login",
    // Após solicitar login por e-mail, o NextAuth redireciona para esta página
    // para exibir a mensagem de "verifique seu e-mail".
    verifyRequest: "/login?type=email"
  }
};

