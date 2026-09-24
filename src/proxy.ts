import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { USER_COOKIE_NAME } from "./user-cookie"

export function proxy(request: NextRequest) {
  const hasUser = request.cookies.has(USER_COOKIE_NAME)
  const isRegisterPage = request.nextUrl.pathname === "/register"

  if (!hasUser && !isRegisterPage) {
    return NextResponse.redirect(new URL("/register", request.url))
  }
  if (hasUser && isRegisterPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
}
