import { Effect, Schema } from "effect"
import { randomUUID } from "node:crypto"
import { EmailAddress, parseWhatsAppNumber } from "@/domain/contact-format"
import { InvalidRegistrationError } from "@/domain/errors"
import { isSupportedLanguage } from "@/domain/language"
import type { Traveler } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"

type RegisterTravelerInput = Omit<Traveler, "id" | "knownCities">

export const registerTraveler = (
  input: RegisterTravelerInput,
): Effect.Effect<Traveler, InvalidRegistrationError, TravelerRepository> =>
  Effect.gen(function* () {
    if (input.name.trim().length === 0) {
      return yield* Effect.fail(new InvalidRegistrationError({ reason: "Il nome è obbligatorio." }))
    }
    if (input.languages.length === 0) {
      return yield* Effect.fail(
        new InvalidRegistrationError({ reason: "Seleziona almeno una lingua." }),
      )
    }
    if (input.languages.some((code) => !isSupportedLanguage(code))) {
      return yield* Effect.fail(
        new InvalidRegistrationError({ reason: "Una o più lingue selezionate non sono valide." }),
      )
    }
    if (!input.contact.whatsApp && !input.contact.email) {
      return yield* Effect.fail(
        new InvalidRegistrationError({
          reason: "Indica almeno un contatto (WhatsApp o email).",
        }),
      )
    }
    if (input.contact.email && !Schema.is(EmailAddress)(input.contact.email)) {
      return yield* Effect.fail(
        new InvalidRegistrationError({ reason: "L'email non è in un formato valido." }),
      )
    }
    const whatsApp = input.contact.whatsApp ? parseWhatsAppNumber(input.contact.whatsApp) : undefined
    if (input.contact.whatsApp && !whatsApp) {
      return yield* Effect.fail(
        new InvalidRegistrationError({ reason: "Il numero WhatsApp non è in un formato valido." }),
      )
    }

    const repo = yield* TravelerRepository
    const traveler: Traveler = {
      id: randomUUID(),
      name: input.name.trim(),
      languages: input.languages,
      knownCities: [],
      contact: { whatsApp, email: input.contact.email },
    }
    yield* repo.save(traveler)
    return traveler
  })
