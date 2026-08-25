import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { normalizeEmail, isAdminEmail } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rateLimit";

const RATE_LIMITED_PATHS = [
  "/api/reviews",
  "/api/feedback",
  "/api/cart/sync",
  "/api/tracking",
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting for sensitive public APIs (20 requests / minute)
  const isRateLimitedPath = RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path));
  if (isRateLimitedPath) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const { allowed, remaining, resetInSeconds } = checkRateLimit(ip, { limit: 20, windowMs: 60000 });

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
            "X-RateLimit-Limit": "20",
            "X-RateLimit-Remaining": String(remaining),
          },
        }
      );
    }
  }

  // 2. Admin Route Protection
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const normalizedEmail = normalizeEmail(token?.email);
    const isAdmin = Boolean(token?.isAdmin) || isAdminEmail(normalizedEmail);

    if (!token || !isAdmin) {
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
  ],
};
