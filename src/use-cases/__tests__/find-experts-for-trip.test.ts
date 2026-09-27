import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "@/domain/errors"
import { TravelerRepository } from "@/domain/traveler-repository"
import type { Traveler } from "@/domain/traveler"
import { findExpertsForTrip } from "../find-experts-for-trip"

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
    contact: { whatsApp: "+391234" },
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
      save: (traveler) =>
        Effect.sync(() => {
          travelers.push(traveler)
        }),
    }),
  )
}

test("restituisce gli esperti che conoscono le città del viaggio, calcolati da matchTravelers", async () => {
  const program = findExpertsForTrip(["madrid"], "organizer-1")

  const results = await Effect.runPromise(Effect.provide(program, testLayer(testTravelers)))

  expect(results).toHaveLength(1)
  expect(results[0].traveler.name).toBe("Marco")
})

test("restituisce una lista vuota se nessuno conosce la città", async () => {
  const program = findExpertsForTrip(["tokyo"], "organizer-1")

  const results = await Effect.runPromise(Effect.provide(program, testLayer(testTravelers)))

  expect(results).toEqual([])
})

test("fallisce con TravelerNotFoundError se l'organizzatore non esiste", async () => {
  const program = findExpertsForTrip(["madrid"], "ghost")

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
      contact: { whatsApp: "+391234" },
    },
  ]

  const program = findExpertsForTrip(["madrid"], "organizer-1")

  const results = await Effect.runPromise(
    Effect.provide(program, testLayer(travelersWithSelfKnowingOrganizer)),
  )

  expect(results.map((result) => result.traveler.id)).not.toContain("organizer-1")
  expect(results).toHaveLength(1)
})

test("con più città, un esperto che le copre tutte viene prima di uno che ne copre una sola", async () => {
  const travelers: Traveler[] = [
    { id: "organizer-1", name: "Giulia", languages: ["it"], knownCities: [], contact: {} },
    {
      id: "expert-1",
      name: "Anna",
      languages: ["it"],
      knownCities: [{ cityId: "madrid", level: "base" }],
      contact: {},
    },
    {
      id: "expert-2",
      name: "Bruno",
      languages: ["it"],
      knownCities: [
        { cityId: "madrid", level: "base" },
        { cityId: "lisbona", level: "base" },
      ],
      contact: {},
    },
  ]

  const results = await Effect.runPromise(
    Effect.provide(findExpertsForTrip(["madrid", "lisbona"], "organizer-1"), testLayer(travelers)),
  )

  expect(results.map((result) => result.traveler.name)).toEqual(["Bruno", "Anna"])
})
