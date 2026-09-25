import { Effect } from "effect"
import type { CityId } from "@/domain/city"
import type { ExpertiseLevel } from "@/domain/expertise-level"
import type { TravelerNotFoundError } from "@/domain/errors"
import { upsertKnownCity } from "@/domain/traveler"
import type { Traveler } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"

export const setKnownCity = (
  travelerId: string,
  cityId: CityId,
  level: ExpertiseLevel,
): Effect.Effect<Traveler, TravelerNotFoundError, TravelerRepository> =>
  Effect.gen(function* () {
    const repo = yield* TravelerRepository
    const traveler = yield* repo.findById(travelerId)
    const updated: Traveler = { ...traveler, knownCities: upsertKnownCity(traveler.knownCities, cityId, level) }
    yield* repo.save(updated)
    return updated
  })
