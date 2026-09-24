import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "../../domain/errors"
import { TravelerRepository } from "../../domain/traveler-repository"
import type { Traveler } from "../../domain/traveler"
import { getTravelerProfile } from "../get-traveler-profile"

const testTraveler: Traveler = {
  id: "expert-1",
  name: "Marco",
  languages: ["it"],
  knownCities: [],
  contact: {},
}

const testLayer = Layer.succeed(
  TravelerRepository,
  TravelerRepository.of({
    findAll: () => Effect.succeed([testTraveler]),
    findById: (id) =>
      id === testTraveler.id
        ? Effect.succeed(testTraveler)
        : Effect.fail(new TravelerNotFoundError({ travelerId: id })),
  }),
)

test("restituisce il traveler richiesto dal repository", async () => {
  const result = await Effect.runPromise(
    Effect.provide(getTravelerProfile("expert-1"), testLayer),
  )

  expect(result).toEqual(testTraveler)
})

test("fallisce con TravelerNotFoundError se l'id non esiste", async () => {
  const error = await Effect.runPromise(
    Effect.flip(Effect.provide(getTravelerProfile("ghost"), testLayer)),
  )

  expect(error._tag).toBe("TravelerNotFoundError")
})
