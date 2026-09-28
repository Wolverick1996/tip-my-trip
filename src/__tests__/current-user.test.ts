/** @jest-environment node */
import { Effect } from "effect"
import { cookies } from "next/headers"
import { TravelerNotFoundError } from "@/domain/errors"
import type { Traveler } from "@/domain/traveler"
import { getTraveler } from "@/use-cases/get-traveler"
import { findCurrentUser } from "../current-user"

jest.mock("next/headers", () => ({ cookies: jest.fn() }))
jest.mock("@/use-cases/get-traveler", () => ({ getTraveler: jest.fn() }))

const traveler: Traveler = {
  id: "t-1",
  name: "Anna",
  languages: ["it"],
  knownCities: [],
  contact: {},
}

type CookieStore = Awaited<ReturnType<typeof cookies>>

function withCookie(value?: string) {
  const store: Pick<CookieStore, "get"> = {
    get: () => (value ? { name: "tipmytrip_user", value } : undefined),
  }
  jest.mocked(cookies).mockResolvedValue(store as CookieStore)
}

test("senza cookie restituisce undefined, senza consultare il repository", async () => {
  withCookie()

  const traveler = await findCurrentUser()

  expect(traveler).toBeUndefined()
  expect(getTraveler).not.toHaveBeenCalled()
})

test("con un id che esiste nel repository restituisce il traveler", async () => {
  withCookie("t-1")
  jest.mocked(getTraveler).mockReturnValue(Effect.succeed(traveler))

  const found = await findCurrentUser()

  expect(getTraveler).toHaveBeenCalledWith("t-1")
  expect(found).toEqual(traveler)
})

test("con un id che non esiste più (profilo cancellato) restituisce undefined invece di propagare l'errore", async () => {
  withCookie("id-cancellato")
  jest.mocked(getTraveler).mockReturnValue(Effect.fail(new TravelerNotFoundError({ travelerId: "id-cancellato" })))

  const found = await findCurrentUser()

  expect(found).toBeUndefined()
})
