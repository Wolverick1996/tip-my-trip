import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "@/domain/errors"
import { TravelerRepository } from "@/domain/traveler-repository"
import { mockTravelers } from "./mock-travelers"

/**
 * Adapter in memoria del port TravelerRepository.
 * @prototype Si azzera a ogni riavvio. In produzione un adapter su database reale, scelto in runtime.ts.
 */
export const InMemoryTravelerRepositoryLive = Layer.succeed(
  TravelerRepository,
  TravelerRepository.of({
    findAll: () => Effect.succeed(mockTravelers),
    findById: (id) => {
      const found = mockTravelers.find((traveler) => traveler.id === id)
      return found ? Effect.succeed(found) : Effect.fail(new TravelerNotFoundError({ travelerId: id }))
    },
    save: (traveler) =>
      Effect.sync(() => {
        const index = mockTravelers.findIndex((existing) => existing.id === traveler.id)
        if (index === -1) {
          mockTravelers.push(traveler)
        } else {
          mockTravelers[index] = traveler
        }
      }),
  }),
)
