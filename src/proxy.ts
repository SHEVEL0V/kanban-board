import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/shared/lib/auth/session";
import { routes } from "@/shared/lib/routing/routes";

const protectedPrefixes = ["/boards"];
const authRoutes = [routes.login(), routes.register()];

// Optimistic cookie-only check — redirects are cheap, the real authorization
// happens in the DAL (verifySession) for every data access and mutation.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await decrypt(request.cookies.get("session")?.value);

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = authRoutes.includes(pathname);

  if (isProtected && !session) {
    return NextResponse.redirect(new URL(routes.login(), request.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL(routes.boards(), request.url));
  }

  if (pathname === routes.home()) {
    return NextResponse.redirect(
      new URL(session ? routes.boards() : routes.login(), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
