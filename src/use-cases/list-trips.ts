import { Effect } from "effect"
import type { Traveler, TravelerId } from "@/domain/traveler"
import type { Trip } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"
import { TravelerRepository } from "@/domain/traveler-repository"

export interface TripWithExperts {
  trip: Trip
  experts: Traveler[]
}

export const listTrips = (
  organizerId: TravelerId,
): Effect.Effect<TripWithExperts[], never, TripRepository | TravelerRepository> =>
  Effect.gen(function* () {
    const trips = yield* (yield* TripRepository).findByOrganizer(organizerId)
    const travelers = yield* (yield* TravelerRepository).findAll()

    return trips
      .toSorted((a, b) => b.createdAt - a.createdAt)
      .map((trip) => ({
        trip,
        experts: trip.expertIds.flatMap((id) => travelers.filter((traveler) => traveler.id === id)),
      }))
  })
