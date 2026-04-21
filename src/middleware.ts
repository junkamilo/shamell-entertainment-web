import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all admin routes except /admin/login
  const isProtectedAdmin =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  if (isProtectedAdmin) {
    const token = request.cookies.get("admin-token");
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
