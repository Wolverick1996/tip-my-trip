import { Effect } from "effect"
import type { Trip, TripExpertSnapshot } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"
import type { TravelerContact, TravelerId } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"

interface TripWithCurrentContacts extends Omit<Trip, "experts"> {
  experts: (TripExpertSnapshot & { contact?: TravelerContact })[]
}

export const listTrips = (
  organizerId: TravelerId,
): Effect.Effect<TripWithCurrentContacts[], never, TripRepository | TravelerRepository> =>
  Effect.gen(function* () {
    const trips = yield* (yield* TripRepository).findByOrganizer(organizerId)
    const travelers = yield* (yield* TravelerRepository).findAll()
    const contactsById = new Map(travelers.map(({ id, contact }) => [id, contact]))

    return trips.toSorted((a, b) => b.createdAt - a.createdAt).map((trip) => ({
      ...trip,
      experts: trip.experts.map((expert) => ({
        ...expert,
        contact: contactsById.get(expert.id),
      })),
    }))
  })
