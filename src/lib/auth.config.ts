import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// 輕量設定：供 proxy（middleware）做 JWT 驗證守門，不含 Prisma adapter 與 native 模組。
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/auth/signin" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
