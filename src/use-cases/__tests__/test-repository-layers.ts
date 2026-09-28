import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "@/domain/errors"
import type { Traveler } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"
import type { Trip } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"

export function testTravelerRepositoryLayer(travelers: Traveler[]) {
  return Layer.succeed(
    TravelerRepository,
    TravelerRepository.of({
      findAll: () => Effect.succeed(travelers),
      findById: (id) =>
        Effect.suspend(() => {
          const found = travelers.find((traveler) => traveler.id === id)
          return found ? Effect.succeed(found) : Effect.fail(new TravelerNotFoundError({ travelerId: id }))
        }),
      save: (traveler) =>
        Effect.sync(() => {
          const index = travelers.findIndex((existing) => existing.id === traveler.id)
          if (index === -1) travelers.push(traveler)
          else travelers[index] = traveler
        }),
    }),
  )
}

export function testTripRepositoryLayer(trips: Trip[]) {
  return Layer.succeed(
    TripRepository,
    TripRepository.of({
      findByOrganizer: (organizerId) => Effect.sync(() => trips.filter((trip) => trip.organizerId === organizerId)),
      save: (trip) =>
        Effect.sync(() => {
          const index = trips.findIndex((existing) => existing.id === trip.id)
          if (index === -1) trips.push(trip)
          else trips[index] = trip
        }),
      delete: (tripId, organizerId) =>
        Effect.sync(() => {
          const remainingTrips = trips.filter((trip) => !(trip.id === tripId && trip.organizerId === organizerId))
          trips.splice(0, trips.length, ...remainingTrips)
        }),
    }),
  )
}
