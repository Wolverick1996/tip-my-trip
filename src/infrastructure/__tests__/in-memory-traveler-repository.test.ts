import { Effect } from "effect"
import type { Traveler } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"
import { InMemoryTravelerRepositoryLive } from "../in-memory-traveler-repository"
import { mockTravelers } from "../mock-travelers"

test("findAll restituisce tutti i traveler mock", async () => {
  const program = Effect.gen(function* () {
    const repo = yield* TravelerRepository
    return yield* repo.findAll()
  })

  const result = await Effect.runPromise(Effect.provide(program, InMemoryTravelerRepositoryLive))

  expect(result).toEqual(mockTravelers)
})

test("findById restituisce il traveler richiesto per un id esistente", async () => {
  const existingId = mockTravelers[0].id
  const program = Effect.gen(function* () {
    const repo = yield* TravelerRepository
    return yield* repo.findById(existingId)
  })

  const result = await Effect.runPromise(Effect.provide(program, InMemoryTravelerRepositoryLive))

  expect(result).toEqual(mockTravelers[0])
})

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

test("save aggiunge un nuovo traveler, poi trovabile con findById", async () => {
  const newTraveler: Traveler = {
    id: "test-save-id",
    name: "Test Save",
    languages: ["it"],
    knownCities: [],
    contact: { email: "test@example.com" },
  }

  const program = Effect.gen(function* () {
    const repo = yield* TravelerRepository
    yield* repo.save(newTraveler)
    return yield* repo.findById(newTraveler.id)
  })

  const result = await Effect.runPromise(Effect.provide(program, InMemoryTravelerRepositoryLive))

  expect(result).toEqual(newTraveler)
})

test("save su un id già esistente aggiorna il traveler invece di duplicarlo", async () => {
  const original: Traveler = {
    id: "test-upsert-id",
    name: "Prima Del Cambio",
    languages: ["it"],
    knownCities: [],
    contact: { email: "prima@example.com" },
  }
  const updated: Traveler = { ...original, name: "Dopo Il Cambio" }

  const program = Effect.gen(function* () {
    const repo = yield* TravelerRepository
    yield* repo.save(original)
    yield* repo.save(updated)
    return yield* repo.findAll()
  })

  const result = await Effect.runPromise(Effect.provide(program, InMemoryTravelerRepositoryLive))

  const matches = result.filter((traveler) => traveler.id === "test-upsert-id")
  expect(matches).toEqual([updated])
})
