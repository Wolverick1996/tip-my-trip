import { Context, Effect } from "effect"
import type { TravelerId } from "./traveler"
import type { Trip, TripId } from "./trip"

export class TripRepository extends Context.Tag("TripRepository")<
  TripRepository,
  {
    readonly findByOrganizer: (organizerId: TravelerId) => Effect.Effect<Trip[]>
    readonly save: (trip: Trip) => Effect.Effect<void>
    readonly delete: (tripId: TripId, organizerId: TravelerId) => Effect.Effect<void>
  }
>() {}
