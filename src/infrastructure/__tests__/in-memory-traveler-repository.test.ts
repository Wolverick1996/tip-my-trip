import { Effect } from "effect"
import { TravelerRepository } from "../../domain/traveler-repository"
import { InMemoryTravelerRepositoryLive } from "../in-memory-traveler-repository"

test("findById fallisce con TravelerNotFoundError per un id inesistente", async () => {
  const program = Effect.gen(function* () {
    const repo = yield* TravelerRepository
    return yield* repo.findById("non-esiste")
  })

  const error = await Effect.runPromise(
    Effect.flip(Effect.provide(program, InMemoryTravelerRepositoryLive)),
  )

  expect(error._tag).toBe("TravelerNotFoundError")
})
