import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "@/domain/errors"
import { TravelerRepository } from "@/domain/traveler-repository"
import type { Traveler } from "@/domain/traveler"
import { setKnownCity } from "../set-known-city"

function testLayer(travelers: Traveler[]) {
  return Layer.succeed(
    TravelerRepository,
    TravelerRepository.of({
      findAll: () => Effect.succeed(travelers),
      findById: (id) => {
        const found = travelers.find((traveler) => traveler.id === id)
        return found ? Effect.succeed(found) : Effect.fail(new TravelerNotFoundError({ travelerId: id }))
      },
      save: (traveler) =>
        Effect.sync(() => {
          const index = travelers.findIndex((existing) => existing.id === traveler.id)
          if (index === -1) travelers.push(traveler)
          else travelers[index] = traveler
        }),
    }),
  )
}

function traveler(overrides: Partial<Traveler> = {}): Traveler {
  return {
    id: "t-1",
    name: "Anna",
    languages: ["it"],
    knownCities: [],
    contact: { email: "a@b.com" },
    ...overrides,
  }
}

test("aggiunge una nuova città conosciuta", async () => {
  const travelers = [traveler()]

  const result = await Effect.runPromise(
    Effect.provide(setKnownCity("t-1", "1", "base"), testLayer(travelers)),
  )

  expect(result.knownCities).toEqual([{ cityId: "1", level: "base" }])
  expect(travelers[0].knownCities).toEqual([{ cityId: "1", level: "base" }])
})

test("aggiorna il livello se la città è già conosciuta, invece di duplicarla", async () => {
  const travelers = [traveler({ knownCities: [{ cityId: "1", level: "base" }] })]

  const result = await Effect.runPromise(
    Effect.provide(setKnownCity("t-1", "1", "local"), testLayer(travelers)),
  )

  expect(result.knownCities).toEqual([{ cityId: "1", level: "local" }])
})

test("fallisce con TravelerNotFoundError se il traveler non esiste", async () => {
  const error = await Effect.runPromise(
    Effect.flip(Effect.provide(setKnownCity("non-esiste", "1", "base"), testLayer([]))),
  )

  expect(error._tag).toBe("TravelerNotFoundError")
})
