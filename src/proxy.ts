import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { USER_COOKIE_NAME } from "./user-cookie"

const PUBLIC_API_PATHS = ["/api/cities"]

export function proxy(request: NextRequest) {
  const hasUser = request.cookies.has(USER_COOKIE_NAME)
  const { pathname } = request.nextUrl

  if (PUBLIC_API_PATHS.includes(pathname)) {
    return NextResponse.next()
  }
  if (pathname.startsWith("/api/")) {
    return hasUser ? NextResponse.next() : NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }
  if (!hasUser && pathname !== "/register") {
    return NextResponse.redirect(new URL("/register", request.url))
  }
  if (hasUser && (pathname === "/" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/my-world", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
}
