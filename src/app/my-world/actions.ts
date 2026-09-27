"use server"

import { Either, Schema } from "effect"
import { getCurrentUser } from "@/current-user"
import type { CityId } from "@/domain/city"
import { EXPERTISE_LEVELS } from "@/domain/expertise-level"
import { runtime } from "@/runtime"
import { getCity } from "@/use-cases/get-city"
import { removeKnownCity } from "@/use-cases/remove-known-city"
import { setKnownCity } from "@/use-cases/set-known-city"

const SetKnownCityInput = Schema.Struct({
  cityId: Schema.String,
  level: Schema.Literal(...EXPERTISE_LEVELS),
})

export async function setKnownCityAction(input: typeof SetKnownCityInput.Type): Promise<{ error?: string }> {
  const decoded = Schema.decodeUnknownEither(SetKnownCityInput)(input)
  if (Either.isLeft(decoded)) {
    return { error: "Dati non validi." }
  }
  const { cityId, level } = decoded.right
  if (!getCity(cityId)) {
    return { error: "Questa città non esiste." }
  }

  const traveler = await getCurrentUser()
  await runtime.runPromise(setKnownCity(traveler.id, cityId, level))
  return {}
}

export async function removeKnownCityAction(cityId: CityId): Promise<{ error?: string }> {
  const decoded = Schema.decodeUnknownEither(Schema.String)(cityId)
  if (Either.isLeft(decoded)) {
    return { error: "Dati non validi." }
  }

  const traveler = await getCurrentUser()
  await runtime.runPromise(removeKnownCity(traveler.id, decoded.right))
  return {}
}
