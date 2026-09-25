import { Effect } from "effect"
import type { Traveler } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"

/**
 * Reinserisce nel repository il traveler salvato nel cookie (è un upsert: se c'è già, non cambia niente).
 * @prototype I traveler sono in memoria e si azzerano a ogni riavvio. Con un database reale non servirebbe e sparirebbe.
 */
export const syncCurrentTraveler = (traveler: Traveler): Effect.Effect<void, never, TravelerRepository> =>
  Effect.gen(function* () {
    const repo = yield* TravelerRepository
    yield* repo.save(traveler)
  })
