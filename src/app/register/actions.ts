"use server"

import { Effect, Either } from "effect"
import { setCurrentUser } from "@/current-user"
import type { LanguageCode } from "@/domain/language"
import { runtime } from "@/runtime"
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

  const result = await runtime.runPromise(
    Effect.either(registerTraveler({ name, languages, contact: { whatsApp, email } })),
  )

  if (Either.isLeft(result)) {
    return { error: result.left.reason, success: false }
  }

  await setCurrentUser(result.right)
  return { success: true }
}
