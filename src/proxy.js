import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { normalizeEmail, isAdminEmail } from "@/lib/admin";

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const normalizedEmail = normalizeEmail(token?.email);
    const isAdmin = Boolean(token?.isAdmin) || isAdminEmail(normalizedEmail);

    if (!token || !isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname === "/orders" && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)", "/orders"],
};
