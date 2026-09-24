import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "@/domain/errors"
import { TravelerRepository } from "@/domain/traveler-repository"
import { mockTravelers } from "./mock-data"

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
        mockTravelers.push(traveler)
      }),
  }),
)
