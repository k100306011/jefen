import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// 用輕量設定建立一個只做 JWT 驗證的 auth（不含 Prisma adapter）。
const { auth } = NextAuth(authConfig);

const PROTECTED = [
  "/dashboard",
  "/rate",
  "/results",
  "/upload",
  "/onboarding",
  "/settings",
];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isProtected = PROTECTED.some(
    (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(`${p}/`),
  );

  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/auth/signin", nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/rate/:path*",
    "/results/:path*",
    "/upload/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
  ],
};
