"use server"

import { Effect } from "effect"
import { setCurrentUserId } from "@/current-user"
import type { LanguageCode } from "@/domain/language"
import { ActionFailure, runAction } from "@/app/lib/run-action"
import { registerTraveler } from "@/use-cases/register-traveler"

export type RegisterFormState = {
  error?: string
  success: boolean
}

export async function registerAction(formData: FormData): Promise<RegisterFormState> {
  const name = String(formData.get("name") ?? "")
  const languages = formData.getAll("languages") as LanguageCode[]
  const whatsApp = String(formData.get("whatsApp") ?? "").trim() || undefined
  const email = String(formData.get("email") ?? "").trim() || undefined

  const result = await runAction(
    Effect.gen(function* () {
      const traveler = yield* registerTraveler({ name, languages, contact: { whatsApp, email } }).pipe(
        Effect.mapError((error) => new ActionFailure({ message: error.reason })),
      )
      yield* Effect.promise(() => setCurrentUserId(traveler.id))
    }),
  )
  return result.error ? { ...result, success: false } : { success: true }
}
