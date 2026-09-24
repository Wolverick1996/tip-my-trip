import { Effect } from "effect"
import type { TravelerNotFoundError } from "../domain/errors"
import type { Traveler, TravelerId } from "../domain/traveler"
import { TravelerRepository } from "../domain/traveler-repository"

export const getTravelerProfile = (
  travelerId: TravelerId,
): Effect.Effect<Traveler, TravelerNotFoundError, TravelerRepository> =>
  Effect.gen(function* () {
    const repo = yield* TravelerRepository
    return yield* repo.findById(travelerId)
  })
