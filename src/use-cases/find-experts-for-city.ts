import { Effect } from "effect"
import type { CityId } from "@/domain/city"
import type { TravelerNotFoundError } from "@/domain/errors"
import { matchTravelers, type MatchResult } from "@/domain/matching"
import { TravelerRepository } from "@/domain/traveler-repository"
import type { TravelerId } from "@/domain/traveler"

export const findExpertsForCity = (
  cityId: CityId,
  organizerId: TravelerId,
): Effect.Effect<MatchResult[], TravelerNotFoundError, TravelerRepository> =>
  Effect.gen(function* () {
    const repo = yield* TravelerRepository
    const organizer = yield* repo.findById(organizerId)
    const travelers = yield* repo.findAll()
    const candidates = travelers.filter((traveler) => traveler.id !== organizerId)
    return matchTravelers({ cityIds: [cityId] }, organizer, candidates)
  })
