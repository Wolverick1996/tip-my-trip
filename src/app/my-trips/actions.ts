"use server"

import { Effect, Either, Schema } from "effect"
import { getCurrentUser } from "@/current-user"
import type { TripId } from "@/domain/trip"
import { runtime } from "@/runtime"
import { createTrip } from "@/use-cases/create-trip"
import { deleteTrip } from "@/use-cases/delete-trip"
import { getCity } from "@/use-cases/get-city"

const CreateTripInput = Schema.Struct({
  title: Schema.String,
  cityIds: Schema.Array(Schema.String),
  expertIds: Schema.Array(Schema.String),
})

export async function createTripAction(input: typeof CreateTripInput.Type): Promise<{ error?: string }> {
  const decoded = Schema.decodeUnknownEither(CreateTripInput)(input)
  if (Either.isLeft(decoded)) {
    return { error: "Dati del viaggio non validi." }
  }
  const { title, cityIds, expertIds } = decoded.right
  if (cityIds.some((cityId) => !getCity(cityId))) {
    return { error: "Una delle città del viaggio non esiste." }
  }

  const organizer = await getCurrentUser()
  const result = await runtime.runPromise(
    Effect.either(
      createTrip({
        organizerId: organizer.id,
        title,
        cityIds: [...cityIds],
        expertIds: [...expertIds],
      }),
    ),
  )
  return Either.isLeft(result) ? { error: result.left.reason } : {}
}

export async function deleteTripAction(tripId: TripId): Promise<{ error?: string }> {
  const decoded = Schema.decodeUnknownEither(Schema.String)(tripId)
  if (Either.isLeft(decoded)) {
    return { error: "Dati non validi." }
  }

  const organizer = await getCurrentUser()
  await runtime.runPromise(deleteTrip(decoded.right, organizer.id))
  return {}
}
