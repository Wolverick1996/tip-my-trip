import { Effect } from "effect"
import type { TravelerId } from "@/domain/traveler"
import type { TripId } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"

export const deleteTrip = (tripId: TripId, organizerId: TravelerId): Effect.Effect<void, never, TripRepository> =>
  Effect.gen(function* () {
    const repo = yield* TripRepository
    yield* repo.delete(tripId, organizerId)
  })
