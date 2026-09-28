import { Effect } from "effect"
import type { Traveler } from "@/domain/traveler"
import { testTravelerRepositoryLayer } from "./test-repository-layers"
import { removeKnownCity } from "../remove-known-city"
import { setKnownCity } from "../set-known-city"

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

describe("setKnownCity", () => {
  test("aggiunge una nuova città conosciuta", async () => {
    const travelers = [traveler()]

    const result = await Effect.runPromise(
      Effect.provide(setKnownCity("t-1", "1", "base"), testTravelerRepositoryLayer(travelers)),
    )

    expect(result.knownCities).toEqual([{ cityId: "1", level: "base" }])
    expect(travelers[0].knownCities).toEqual([{ cityId: "1", level: "base" }])
  })

  test("aggiorna il livello se la città è già conosciuta, invece di duplicarla", async () => {
    const travelers = [traveler({ knownCities: [{ cityId: "1", level: "base" }] })]

    const result = await Effect.runPromise(
      Effect.provide(setKnownCity("t-1", "1", "local"), testTravelerRepositoryLayer(travelers)),
    )

    expect(result.knownCities).toEqual([{ cityId: "1", level: "local" }])
  })

  test("fallisce con TravelerNotFoundError se il traveler non esiste", async () => {
    const error = await Effect.runPromise(
      Effect.flip(Effect.provide(setKnownCity("non-esiste", "1", "base"), testTravelerRepositoryLayer([]))),
    )

    expect(error._tag).toBe("TravelerNotFoundError")
  })
})

describe("removeKnownCity", () => {
  test("rimuove una città conosciuta, lascia le altre invariate", async () => {
    const travelers = [
      traveler({
        knownCities: [
          { cityId: "1", level: "base" },
          { cityId: "2", level: "expert" },
        ],
      }),
    ]

    const result = await Effect.runPromise(
      Effect.provide(removeKnownCity("t-1", "1"), testTravelerRepositoryLayer(travelers)),
    )

    expect(result.knownCities).toEqual([{ cityId: "2", level: "expert" }])
  })

  test("rimuovere una città non conosciuta non cambia nulla", async () => {
    const travelers = [traveler({ knownCities: [{ cityId: "1", level: "base" }] })]

    const result = await Effect.runPromise(
      Effect.provide(removeKnownCity("t-1", "non-esiste"), testTravelerRepositoryLayer(travelers)),
    )

    expect(result.knownCities).toEqual([{ cityId: "1", level: "base" }])
  })

  test("fallisce con TravelerNotFoundError se il traveler non esiste", async () => {
    const error = await Effect.runPromise(
      Effect.flip(Effect.provide(removeKnownCity("non-esiste", "1"), testTravelerRepositoryLayer([]))),
    )

    expect(error._tag).toBe("TravelerNotFoundError")
  })
})
