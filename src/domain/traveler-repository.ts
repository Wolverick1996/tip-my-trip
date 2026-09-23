import { Context, Effect } from "effect"
import type { TravelerNotFoundError } from "./errors"
import type { Traveler, TravelerId } from "./traveler"

export class TravelerRepository extends Context.Tag("TravelerRepository")<
  TravelerRepository,
  {
    readonly findAll: () => Effect.Effect<Traveler[]>
    readonly findById: (id: TravelerId) => Effect.Effect<Traveler, TravelerNotFoundError>
  }
>() {}
