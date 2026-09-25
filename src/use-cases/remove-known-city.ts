import { Effect } from "effect"
import type { CityId } from "@/domain/city"
import type { TravelerNotFoundError } from "@/domain/errors"
import { removeKnownCity as removeKnownCityFromList } from "@/domain/traveler"
import type { Traveler } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"

export const removeKnownCity = (
  travelerId: string,
  cityId: CityId,
): Effect.Effect<Traveler, TravelerNotFoundError, TravelerRepository> =>
  Effect.gen(function* () {
    const repo = yield* TravelerRepository
    const traveler = yield* repo.findById(travelerId)
    const updated: Traveler = {
      ...traveler,
      knownCities: removeKnownCityFromList(traveler.knownCities, cityId),
    }
    yield* repo.save(updated)
    return updated
  })
