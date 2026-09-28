/** @jest-environment node */
import { Effect } from "effect"
import { NextRequest } from "next/server"
import { findCurrentUser } from "@/current-user"
import { TravelerNotFoundError } from "@/domain/errors"
import type { Traveler } from "@/domain/traveler"
import { findExpertsForTrip } from "@/use-cases/find-experts-for-trip"
import { GET } from "../route"

jest.mock("@/current-user", () => ({ findCurrentUser: jest.fn() }))
jest.mock("@/use-cases/find-experts-for-trip", () => ({ findExpertsForTrip: jest.fn() }))
jest.mock("@/use-cases/get-city", () => ({
  getCity: jest.fn((cityId: string) => (cityId === "madrid" ? {} : undefined)),
}))

const organizer: Traveler = {
  id: "org-1",
  name: "Giulia",
  languages: ["it"],
  knownCities: [],
  contact: {},
}

const elena: Traveler = {
  id: "expert-1",
  name: "Elena Ruiz",
  languages: ["it", "es"],
  knownCities: [{ cityId: "madrid", level: "local" }],
  contact: { whatsApp: "+34600111222", email: "elena@example.com" },
}

function get(cityIds: string): Promise<Response> {
  return GET(new NextRequest(`http://localhost/api/trip-matches?cityIds=${encodeURIComponent(cityIds)}`))
}

test("senza città restituisce 400 con il motivo, senza consultare la sessione", async () => {
  const response = await get("")

  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: "Aggiungi almeno una città." })
  expect(findCurrentUser).not.toHaveBeenCalled()
})

test("con città duplicate restituisce 400, per non falsare il punteggio di copertura", async () => {
  const response = await get("madrid,madrid")

  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({
    error: "Una città compare più di una volta nel viaggio.",
  })
})

test("con una città inesistente restituisce 400, senza consultare la sessione", async () => {
  const response = await get("città-inesistente")

  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: "Una delle città del viaggio non esiste." })
  expect(findCurrentUser).not.toHaveBeenCalled()
})

test("senza sessione restituisce 401, senza cercare esperti", async () => {
  jest.mocked(findCurrentUser).mockResolvedValue(undefined)

  const response = await get("madrid")

  expect(response.status).toBe(401)
  expect(await response.json()).toEqual({ error: "Sessione scaduta: ricarica la pagina." })
  expect(findExpertsForTrip).not.toHaveBeenCalled()
})

test("se l'organizzatore è sparito dal repository tra il cookie e la ricerca, restituisce 401 come una sessione scaduta", async () => {
  jest.mocked(findCurrentUser).mockResolvedValue(organizer)
  jest.mocked(findExpertsForTrip).mockReturnValue(Effect.fail(new TravelerNotFoundError({ travelerId: organizer.id })))

  const response = await get("madrid")

  expect(response.status).toBe(401)
  expect(await response.json()).toEqual({ error: "Sessione scaduta: ricarica la pagina." })
})

test("un errore imprevisto nella ricerca esperti restituisce 500 con un errore generico, senza cache", async () => {
  jest.mocked(findCurrentUser).mockResolvedValue(organizer)
  jest.mocked(findExpertsForTrip).mockReturnValue(Effect.die(new Error("dettaglio interno")))
  jest.spyOn(console, "error").mockImplementation(() => {})

  const response = await get("madrid")

  expect(response.status).toBe(500)
  expect(await response.json()).toEqual({ error: "Errore interno" })
})

test("con sessione restituisce 200, senza cache, con solo i campi del DTO (niente knownCities/languages completi)", async () => {
  jest.mocked(findCurrentUser).mockResolvedValue(organizer)
  jest.mocked(findExpertsForTrip).mockReturnValue(
    Effect.succeed([
      {
        traveler: elena,
        score: 73,
        matchedCities: [{ cityId: "madrid", level: "local" }],
        sharedLanguages: ["it"],
      },
    ]),
  )

  const response = await get("madrid")

  expect(findExpertsForTrip).toHaveBeenCalledWith(["madrid"], organizer.id)
  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toBe("private, no-store")
  expect(await response.json()).toEqual([
    {
      id: "expert-1",
      name: "Elena Ruiz",
      score: 73,
      matchedCities: [{ cityId: "madrid", level: "local" }],
      sharedLanguages: ["it"],
      contact: { whatsApp: "+34600111222", email: "elena@example.com" },
    },
  ])
})
