import { NextResponse, type NextRequest } from "next/server"
import { USER_COOKIE_NAME } from "@/user-cookie"

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/register", request.url))
  response.cookies.delete(USER_COOKIE_NAME)
  return response
}
