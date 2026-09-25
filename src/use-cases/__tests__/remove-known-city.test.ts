import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "@/domain/errors"
import { TravelerRepository } from "@/domain/traveler-repository"
import type { Traveler } from "@/domain/traveler"
import { removeKnownCity } from "../remove-known-city"

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

test("rimuove una città conosciuta, lascia le altre invariate", async () => {
  const travelers = [
    traveler({
      knownCities: [
        { cityId: "1", level: "base" },
        { cityId: "2", level: "expert" },
      ],
    }),
  ]

  const result = await Effect.runPromise(Effect.provide(removeKnownCity("t-1", "1"), testLayer(travelers)))

  expect(result.knownCities).toEqual([{ cityId: "2", level: "expert" }])
})

test("rimuovere una città non conosciuta non cambia nulla", async () => {
  const travelers = [traveler({ knownCities: [{ cityId: "1", level: "base" }] })]

  const result = await Effect.runPromise(
    Effect.provide(removeKnownCity("t-1", "non-esiste"), testLayer(travelers)),
  )

  expect(result.knownCities).toEqual([{ cityId: "1", level: "base" }])
})

test("fallisce con TravelerNotFoundError se il traveler non esiste", async () => {
  const error = await Effect.runPromise(
    Effect.flip(Effect.provide(removeKnownCity("non-esiste", "1"), testLayer([]))),
  )

  expect(error._tag).toBe("TravelerNotFoundError")
})
