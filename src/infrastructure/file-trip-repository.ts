import { Effect, Layer, Schema } from "effect"
import path from "node:path"
import type { ExpertiseLevel } from "@/domain/expertise-level"
import type { Trip, TripExpertSnapshot } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"
import { DATA_DIR, readJsonFile, writeJsonFile } from "./json-file"

const ExpertiseLevel: Schema.Schema<ExpertiseLevel> = Schema.Literal("base", "expert", "local")
const MatchedCity = Schema.Struct({
  cityId: Schema.String,
  level: ExpertiseLevel,
})

const TripExpertSnapshot: Schema.Schema<TripExpertSnapshot> = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  matchedCities: Schema.mutable(Schema.Array(MatchedCity)),
  sharedLanguages: Schema.mutable(Schema.Array(Schema.String)),
})

const Trip: Schema.Schema<Trip> = Schema.Struct({
  id: Schema.String,
  organizerId: Schema.String,
  title: Schema.optional(Schema.String),
  cityIds: Schema.mutable(Schema.Array(Schema.String)),
  experts: Schema.mutable(Schema.Array(TripExpertSnapshot)),
  createdAt: Schema.Number,
})

const TripsFile = Schema.mutable(Schema.Array(Trip))

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
