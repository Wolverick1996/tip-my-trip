import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "@/domain/errors"
import type { Traveler } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"
import type { Trip } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"
import { createTrip } from "../create-trip"
import { deleteTrip } from "../delete-trip"
import { listTrips } from "../list-trips"

const travelers: Traveler[] = [
  { id: "e-1", name: "Anna", languages: ["it"], knownCities: [], contact: {} },
  { id: "e-2", name: "Bruno", languages: ["it"], knownCities: [], contact: {} },
]

function testLayer(trips: Trip[]) {
  return Layer.mergeAll(
    Layer.succeed(
      TripRepository,
      TripRepository.of({
        findByOrganizer: (organizerId) => Effect.sync(() => trips.filter((trip) => trip.organizerId === organizerId)),
        save: (trip) => Effect.sync(() => void trips.push(trip)),
        delete: (tripId, organizerId) =>
          Effect.sync(() => {
            const index = trips.findIndex((trip) => trip.id === tripId && trip.organizerId === organizerId)
            if (index !== -1) trips.splice(index, 1)
          }),
      }),
    ),
    Layer.succeed(
      TravelerRepository,
      TravelerRepository.of({
        findAll: () => Effect.succeed(travelers),
        findById: (id) => Effect.fail(new TravelerNotFoundError({ travelerId: id })),
        save: () => Effect.void,
      }),
    ),
  )
}

function trip(overrides: Partial<Trip> = {}): Trip {
  return { id: "t-1", organizerId: "org", cityIds: ["madrid"], expertIds: [], createdAt: 0, ...overrides }
}

describe("createTrip", () => {
  test("salva il viaggio con un id nuovo e senza titolo se il titolo è vuoto", async () => {
    const trips: Trip[] = []

    const created = await Effect.runPromise(
      Effect.provide(
        createTrip({ organizerId: "org", title: "  ", cityIds: ["madrid"], expertIds: ["e-1"] }),
        testLayer(trips),
      ),
    )

    expect(created.id).toEqual(expect.any(String))
    expect(created.title).toBeUndefined()
    expect(trips).toEqual([created])
  })

  test("fallisce con InvalidTripError se il viaggio viola una regola del dominio, senza salvarlo", async () => {
    const trips: Trip[] = []

    const error = await Effect.runPromise(
      Effect.flip(Effect.provide(createTrip({ organizerId: "org", cityIds: [], expertIds: [] }), testLayer(trips))),
    )

    expect(error._tag).toBe("InvalidTripError")
    expect(trips).toEqual([])
  })
})

describe("listTrips", () => {
  test("risolve gli esperti di ogni viaggio, nell'ordine scelto", async () => {
    const trips = [trip({ expertIds: ["e-2", "e-1"] }), trip({ id: "t-altro", organizerId: "altro" })]

    const result = await Effect.runPromise(Effect.provide(listTrips("org"), testLayer(trips)))

    expect(result).toHaveLength(1)
    expect(result[0].experts.map((expert) => expert.name)).toEqual(["Bruno", "Anna"])
  })

  test("restituisce i viaggi dal più recente al più vecchio", async () => {
    const trips = [
      trip({ id: "t-vecchio", createdAt: 1 }),
      trip({ id: "t-nuovo", createdAt: 3 }),
      trip({ id: "t-medio", createdAt: 2 }),
    ]

    const result = await Effect.runPromise(Effect.provide(listTrips("org"), testLayer(trips)))

    expect(result.map(({ trip: found }) => found.id)).toEqual(["t-nuovo", "t-medio", "t-vecchio"])
  })
})

describe("deleteTrip", () => {
  test("elimina il viaggio dell'organizzatore", async () => {
    const trips = [trip()]

    await Effect.runPromise(Effect.provide(deleteTrip("t-1", "org"), testLayer(trips)))

    expect(trips).toEqual([])
  })

  test("non tocca il viaggio di un altro organizzatore, e non fallisce se il viaggio non c'è", async () => {
    const trips = [trip({ organizerId: "altro" })]

    await Effect.runPromise(Effect.provide(deleteTrip("t-1", "org"), testLayer(trips)))

    expect(trips).toHaveLength(1)
  })
})
