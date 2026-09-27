import { Effect, Layer, Schema } from "effect"
import path from "node:path"
import type { Trip } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"
import { DATA_DIR, readJsonFile, writeJsonFile } from "./json-file"

const TripsFile = Schema.mutable(
  Schema.Array(
    Schema.Struct({
      id: Schema.String,
      organizerId: Schema.String,
      title: Schema.optional(Schema.String),
      cityIds: Schema.mutable(Schema.Array(Schema.String)),
      expertIds: Schema.mutable(Schema.Array(Schema.String)),
      createdAt: Schema.Number,
    }),
  ),
)

/**
 * Adapter del port TripRepository che salva i viaggi in un file JSON.
 * @prototype In produzione un adapter su database, scelto in runtime.ts.
 */
export function makeFileTripRepository(filePath: string) {
  const read = (): Trip[] => readJsonFile(filePath, TripsFile, [])

  return Layer.succeed(
    TripRepository,
    TripRepository.of({
      findByOrganizer: (organizerId) => Effect.sync(() => read().filter((trip) => trip.organizerId === organizerId)),
      save: (trip) =>
        Effect.sync(() => {
          const trips = read().filter((existing) => existing.id !== trip.id)
          writeJsonFile(filePath, [...trips, trip])
        }),
      delete: (tripId, organizerId) =>
        Effect.sync(() => {
          writeJsonFile(
            filePath,
            read().filter((trip) => !(trip.id === tripId && trip.organizerId === organizerId)),
          )
        }),
    }),
  )
}

export const FileTripRepositoryLive = makeFileTripRepository(path.join(DATA_DIR, "trips.json"))
