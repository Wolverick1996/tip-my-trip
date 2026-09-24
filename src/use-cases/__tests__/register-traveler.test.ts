import { Effect, Layer } from "effect"
import { TravelerNotFoundError } from "@/domain/errors"
import { TravelerRepository } from "@/domain/traveler-repository"
import type { Traveler } from "@/domain/traveler"
import { registerTraveler } from "../register-traveler"

function testLayer(saved: Traveler[]) {
  return Layer.succeed(
    TravelerRepository,
    TravelerRepository.of({
      findAll: () => Effect.succeed(saved),
      findById: (id) => {
        const found = saved.find((traveler) => traveler.id === id)
        return found ? Effect.succeed(found) : Effect.fail(new TravelerNotFoundError({ travelerId: id }))
      },
      save: (traveler) =>
        Effect.sync(() => {
          saved.push(traveler)
        }),
    }),
  )
}

test("fallisce se il nome è vuoto", async () => {
  const error = await Effect.runPromise(
    Effect.flip(
      Effect.provide(
        registerTraveler({ name: "  ", languages: ["it"], contact: { email: "a@b.com" } }),
        testLayer([]),
      ),
    ),
  )

  expect(error._tag).toBe("InvalidRegistrationError")
})

test("fallisce se non è selezionata nessuna lingua", async () => {
  const error = await Effect.runPromise(
    Effect.flip(
      Effect.provide(
        registerTraveler({ name: "Anna", languages: [], contact: { email: "a@b.com" } }),
        testLayer([]),
      ),
    ),
  )

  expect(error._tag).toBe("InvalidRegistrationError")
})

test("fallisce se una lingua selezionata non è supportata", async () => {
  const error = await Effect.runPromise(
    Effect.flip(
      Effect.provide(
        registerTraveler({ name: "Anna", languages: ["xx"], contact: { email: "a@b.com" } }),
        testLayer([]),
      ),
    ),
  )

  expect(error._tag).toBe("InvalidRegistrationError")
})

test("fallisce se non c'è nessun contatto (né WhatsApp né email)", async () => {
  const error = await Effect.runPromise(
    Effect.flip(
      Effect.provide(registerTraveler({ name: "Anna", languages: ["it"], contact: {} }), testLayer([])),
    ),
  )

  expect(error._tag).toBe("InvalidRegistrationError")
})

test("fallisce se l'email non è in un formato valido", async () => {
  const error = await Effect.runPromise(
    Effect.flip(
      Effect.provide(
        registerTraveler({ name: "Anna", languages: ["it"], contact: { email: "non-una-email" } }),
        testLayer([]),
      ),
    ),
  )

  expect(error._tag).toBe("InvalidRegistrationError")
})

test("fallisce se il numero WhatsApp non è in un formato valido", async () => {
  const error = await Effect.runPromise(
    Effect.flip(
      Effect.provide(
        registerTraveler({ name: "Anna", languages: ["it"], contact: { whatsApp: "non un numero" } }),
        testLayer([]),
      ),
    ),
  )

  expect(error._tag).toBe("InvalidRegistrationError")
})

test("accetta un numero WhatsApp con spazi, in formato internazionale, e lo salva normalizzato", async () => {
  const traveler = await Effect.runPromise(
    Effect.provide(
      registerTraveler({ name: "Anna", languages: ["it"], contact: { whatsApp: "+39 333 123 4567" } }),
      testLayer([]),
    ),
  )

  expect(traveler.contact.whatsApp).toBe("+393331234567")
})

test("registra un traveler valido, con knownCities vuoto, e lo salva nel repository", async () => {
  const saved: Traveler[] = []

  const traveler = await Effect.runPromise(
    Effect.provide(
      registerTraveler({ name: "  Anna  ", languages: ["it", "en"], contact: { email: "a@b.com" } }),
      testLayer(saved),
    ),
  )

  expect(traveler.name).toBe("Anna")
  expect(traveler.languages).toEqual(["it", "en"])
  expect(traveler.knownCities).toEqual([])
  expect(traveler.id).toBeTruthy()
  expect(saved).toContainEqual(traveler)
})
