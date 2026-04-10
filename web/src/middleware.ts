import { NextResponse, type NextRequest } from "next/server";
import { PLATFORM_ADMIN_COOKIE, verifyAdminJwt } from "@/lib/platform/session-jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/platform/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(PLATFORM_ADMIN_COOKIE)?.value;
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyAdminJwt(token);
  if (!payload) {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(PLATFORM_ADMIN_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/platform/admin/:path*"],
};
