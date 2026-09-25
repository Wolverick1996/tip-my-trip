/** @jest-environment node */
import { NextRequest } from "next/server"
import { proxy } from "../proxy"
import { USER_COOKIE_NAME } from "../user-cookie"

function request(path: string, withCookie: boolean): NextRequest {
  const headers = withCookie ? { cookie: `${USER_COOKIE_NAME}=qualcosa` } : undefined
  return new NextRequest(`http://localhost${path}`, { headers })
}

test.each([
  ["/my-world", false, "/register"],
  ["/", true, "/my-world"],
  ["/register", true, "/my-world"],
])("%s (cookie: %s) reindirizza a %s", (path, withCookie, destination) => {
  const response = proxy(request(path, withCookie))

  expect(response.status).toBe(307)
  expect(response.headers.get("location")).toBe(`http://localhost${destination}`)
})

test.each([
  ["/register", false],
  ["/my-world", true],
  ["/api/cities", false],
  ["/api/privata", true],
])("%s (cookie: %s) passa senza redirect", (path, withCookie) => {
  const response = proxy(request(path, withCookie))

  expect(response.headers.get("x-middleware-next")).toBe("1")
})

test("un'API non dichiarata pubblica, senza cookie, risponde 401 in JSON invece di reindirizzare", async () => {
  const response = proxy(request("/api/privata", false))

  expect(response.status).toBe(401)
  expect(await response.json()).toEqual({ error: "Non autenticato" })
})
