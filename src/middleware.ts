import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

// Edge Runtime : vérification du JWT avec jose, sans Prisma.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const isAuthenticated = token ? (await verifyToken(token)) !== null : false;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if ((pathname === "/login" || pathname === "/register") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
