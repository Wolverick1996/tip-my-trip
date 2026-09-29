"use server"

import { Effect, Schema } from "effect"
import { getCurrentUser } from "@/current-user"
import type { CityId } from "@/domain/city"
import { EXPERTISE_LEVELS } from "@/domain/expertise-level"
import { getCity } from "@/use-cases/get-city"
import { removeKnownCity } from "@/use-cases/remove-known-city"
import { setKnownCity } from "@/use-cases/set-known-city"
import { ActionFailure, runAction } from "@/app/lib/run-action"

const SetKnownCityInput = Schema.Struct({
  cityId: Schema.String,
  level: Schema.Literal(...EXPERTISE_LEVELS),
})

export async function setKnownCityAction(input: typeof SetKnownCityInput.Type): Promise<{ error?: string }> {
  const traveler = await getCurrentUser()
  return runAction(
    Effect.gen(function* () {
      const { cityId, level } = yield* Schema.decodeUnknown(SetKnownCityInput)(input).pipe(
        Effect.mapError(() => new ActionFailure({ message: "Dati non validi." })),
      )
      if (!getCity(cityId)) {
        return yield* Effect.fail(new ActionFailure({ message: "Questa città non esiste." }))
      }
      yield* setKnownCity(traveler.id, cityId, level).pipe(
        Effect.catchTag("TravelerNotFoundError", () =>
          Effect.fail(new ActionFailure({ message: "Sessione scaduta: ricarica la pagina." })),
        ),
      )
    }),
  )
}

export async function removeKnownCityAction(cityId: CityId): Promise<{ error?: string }> {
  const traveler = await getCurrentUser()
  return runAction(
    Effect.gen(function* () {
      const decoded = yield* Schema.decodeUnknown(Schema.String)(cityId).pipe(
        Effect.mapError(() => new ActionFailure({ message: "Dati non validi." })),
      )
      yield* removeKnownCity(traveler.id, decoded).pipe(
        Effect.catchTag("TravelerNotFoundError", () =>
          Effect.fail(new ActionFailure({ message: "Sessione scaduta: ricarica la pagina." })),
        ),
      )
    }),
  )
}
