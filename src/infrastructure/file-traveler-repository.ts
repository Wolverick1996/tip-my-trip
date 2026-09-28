import { Effect, Layer, Schema } from "effect"
import path from "node:path"
import { TravelerNotFoundError } from "@/domain/errors"
import type { Traveler } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"
import { DATA_DIR, readJsonFile, writeJsonFile } from "./json-file"
import { mockTravelers } from "./mock-travelers"

const TravelersFile = Schema.mutable(
  Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      languages: Schema.mutable(Schema.Array(Schema.String)),
      knownCities: Schema.mutable(
        Schema.Array(
          Schema.Struct({
            cityId: Schema.String,
            level: Schema.Literal("base", "expert", "local"),
          }),
        ),
      ),
      contact: Schema.Struct({
        whatsApp: Schema.optional(Schema.String),
        email: Schema.optional(Schema.String),
      }),
    }),
  ),
)

/**
 * Adapter del port TravelerRepository che salva i traveler in un file JSON; se il file non esiste parte da `initialTravelers`.
 * @prototype In produzione un adapter su database, scelto in runtime.ts.
 */
export function makeFileTravelerRepository(filePath: string, initialTravelers: ReadonlyArray<Traveler>) {
  const read = (): Traveler[] => readJsonFile(filePath, TravelersFile, [...initialTravelers])

  return Layer.succeed(
    TravelerRepository,
    TravelerRepository.of({
      findAll: () => Effect.sync(read),
      findById: (id) =>
        Effect.suspend(() => {
          const found = read().find((traveler) => traveler.id === id)
          return found ? Effect.succeed(found) : Effect.fail(new TravelerNotFoundError({ travelerId: id }))
        }),
      save: (traveler) =>
        Effect.sync(() => {
          const travelers = read().filter((existing) => existing.id !== traveler.id)
          writeJsonFile(filePath, [...travelers, traveler])
        }),
    }),
  )
}

export const FileTravelerRepositoryLive = makeFileTravelerRepository(
  path.join(DATA_DIR, "travelers.json"),
  mockTravelers,
)
