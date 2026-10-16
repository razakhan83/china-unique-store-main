import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { normalizeEmail, isAdminEmail } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rateLimit";

const RATE_LIMITED_PATHS = [
  "/api/reviews",
  "/api/feedback",
  "/api/cart/sync",
  "/api/tracking",
  "/api/courier/track",
  "/api/geo",
  "/api/auth/callback/credentials",
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting for sensitive public APIs
  const isRateLimitedPath = RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path));
  if (isRateLimitedPath) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const pathKey = pathname.split("/")[2] || "api";
    const limit = pathname.startsWith("/api/geo") ? 40 : 20;
    const { allowed, remaining, resetInSeconds } = checkRateLimit(`${pathKey}_${ip}`, { limit, windowMs: 60000 });

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please slow down and try again shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(resetInSeconds),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
          },
        }
      );
    }
  }

  // 2. Admin Route Protection
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const normalizedEmail = normalizeEmail(token?.email);
  const isRealAdmin = !token?.isDemo && (Boolean(token?.isAdmin) || isAdminEmail(normalizedEmail));

  if (pathname.startsWith("/api/admin")) {
    if (!token || !isRealAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!token || !isRealAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/((?!login).*)",
    "/api/reviews/:path*",
    "/api/feedback/:path*",
    "/api/cart/sync/:path*",
    "/api/tracking/:path*",
    "/api/courier/track/:path*",
    "/api/geo/:path*",
    "/api/admin/:path*",
    "/api/auth/callback/credentials",
  ],
};
