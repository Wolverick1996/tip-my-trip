"use server"

import { Effect, Schema } from "effect"
import { getCurrentUser } from "@/current-user"
import type { TripId } from "@/domain/trip"
import { createTrip } from "@/use-cases/create-trip"
import { deleteTrip } from "@/use-cases/delete-trip"
import { getCity } from "@/use-cases/get-city"
import { ActionFailure, runAction } from "@/app/lib/run-action"

const CreateTripInput = Schema.Struct({
  title: Schema.String,
  cityIds: Schema.Array(Schema.String),
  expertIds: Schema.Array(Schema.String),
})

export async function createTripAction(input: typeof CreateTripInput.Type): Promise<{ error?: string }> {
  const organizer = await getCurrentUser()
  return runAction(
    Effect.gen(function* () {
      const { title, cityIds, expertIds } = yield* Schema.decodeUnknown(CreateTripInput)(input).pipe(
        Effect.mapError(() => new ActionFailure({ message: "Dati del viaggio non validi." })),
      )
      if (cityIds.some((cityId) => !getCity(cityId))) {
        return yield* Effect.fail(new ActionFailure({ message: "Una delle città del viaggio non esiste." }))
      }
      yield* createTrip({
        organizerId: organizer.id,
        title,
        cityIds: [...cityIds],
        expertIds: [...expertIds],
      }).pipe(Effect.mapError((error) => new ActionFailure({ message: error.reason })))
    }),
  )
}

export async function deleteTripAction(tripId: TripId): Promise<{ error?: string }> {
  const organizer = await getCurrentUser()
  return runAction(
    Effect.gen(function* () {
      const decoded = yield* Schema.decodeUnknown(Schema.String)(tripId).pipe(
        Effect.mapError(() => new ActionFailure({ message: "Dati non validi." })),
      )
      yield* deleteTrip(decoded, organizer.id)
    }),
  )
}
