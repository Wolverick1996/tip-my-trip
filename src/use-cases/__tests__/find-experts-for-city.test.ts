import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "@/domain/errors"
import { TravelerRepository } from "@/domain/traveler-repository"
import type { Traveler } from "@/domain/traveler"
import { findExpertsForCity } from "../find-experts-for-city"

const testTravelers: Traveler[] = [
  {
    id: "organizer-1",
    name: "Giulia",
    languages: ["it"],
    knownCities: [],
    contact: {},
  },
  {
    id: "expert-1",
    name: "Marco",
    languages: ["it", "en"],
    knownCities: [{ cityId: "madrid", level: "local" }],
    contact: { whatsapp: "+391234" },
  },
]

function testLayer(travelers: Traveler[]) {
  return Layer.succeed(
    TravelerRepository,
    TravelerRepository.of({
      findAll: () => Effect.succeed(travelers),
      findById: (id) => {
        const found = travelers.find((traveler) => traveler.id === id)
        return found ? Effect.succeed(found) : Effect.fail(new TravelerNotFoundError({ travelerId: id }))
      },
    }),
  )
}

test("restituisce gli esperti che conoscono la città, calcolati da matchTravelers", async () => {
  const program = findExpertsForCity("madrid", "organizer-1")

  const results = await Effect.runPromise(Effect.provide(program, testLayer(testTravelers)))

  expect(results).toHaveLength(1)
  expect(results[0].traveler.name).toBe("Marco")
})

test("restituisce una lista vuota se nessuno conosce la città (non è un errore)", async () => {
  const program = findExpertsForCity("tokyo", "organizer-1")

  const results = await Effect.runPromise(Effect.provide(program, testLayer(testTravelers)))

  expect(results).toEqual([])
})

test("fallisce con TravelerNotFoundError se l'organizzatore non esiste", async () => {
  const program = findExpertsForCity("madrid", "ghost")

  const error = await Effect.runPromise(Effect.flip(Effect.provide(program, testLayer(testTravelers))))

  expect(error._tag).toBe("TravelerNotFoundError")
})

test("non propone l'organizzatore come match di se stesso, anche se conosce la città", async () => {
  const travelersWithSelfKnowingOrganizer: Traveler[] = [
    {
      id: "organizer-1",
      name: "Giulia",
      languages: ["it"],
      knownCities: [{ cityId: "madrid", level: "local" }],
      contact: {},
    },
    {
      id: "expert-1",
      name: "Marco",
      languages: ["it", "en"],
      knownCities: [{ cityId: "madrid", level: "local" }],
      contact: { whatsapp: "+391234" },
    },
  ]

  const program = findExpertsForCity("madrid", "organizer-1")

  const results = await Effect.runPromise(
    Effect.provide(program, testLayer(travelersWithSelfKnowingOrganizer)),
  )

  expect(results.map((result) => result.traveler.id)).not.toContain("organizer-1")
  expect(results).toHaveLength(1)
})
