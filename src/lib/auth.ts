import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "./auth.config";
import { prisma } from "./db";

const isProd = process.env.NODE_ENV === "production";

const providers: NextAuthConfig["providers"] = [...authConfig.providers];

// 開發 / demo 專用：用 email 直接登入，免設定 Google OAuth。正式環境自動停用。
if (!isProd) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev Login",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        if (!email || !email.includes("@")) return null;
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split("@")[0] },
        });
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // JWT session：proxy 守門免查 DB；使用者 / 帳號仍由 adapter 落地 DB。
  session: { strategy: "jwt" },
  providers,
});
