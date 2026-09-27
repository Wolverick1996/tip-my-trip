import { Effect, Either } from "effect"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Traveler, TravelerId } from "./domain/traveler"
import { runtime } from "./runtime"
import { getTraveler } from "./use-cases/get-traveler"
import { USER_COOKIE_NAME } from "./user-cookie"

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

/**
 * Legge il traveler corrente: l'id dal cookie di sessione, i dati dal repository.
 * Restituisce `undefined` se manca il cookie o se il profilo non esiste più (es. `.data/` cancellata).
 * @prototype Il cookie contiene l'id in chiaro, non firmato. In produzione sarebbe un id di sessione verificato lato server.
 */
export async function findCurrentUser(): Promise<Traveler | undefined> {
  const store = await cookies()
  const travelerId = store.get(USER_COOKIE_NAME)?.value
  if (!travelerId) {
    return undefined
  }
  const result = await runtime.runPromise(Effect.either(getTraveler(travelerId)))
  return Either.isRight(result) ? result.right : undefined
}

/** Come `findCurrentUser`, ma per pagine e Server Action: se il profilo non c'è chiude la sessione e rimanda alla registrazione. */
export async function getCurrentUser(): Promise<Traveler> {
  const traveler = await findCurrentUser()
  if (!traveler) {
    redirect("/logout")
  }
  return traveler
}

/**
 * Salva l'id del traveler nel cookie di sessione. `httpOnly` lo nasconde al JavaScript della pagina, `sameSite: "lax"` non lo manda nelle richieste in background partite da altri siti.
 * @prototype Senza `secure`, perché la demo gira su http://localhost. In produzione `secure: true` (solo HTTPS) e un id di sessione firmato.
 */
export async function setCurrentUserId(travelerId: TravelerId): Promise<void> {
  const store = await cookies()
  store.set(USER_COOKIE_NAME, travelerId, { maxAge: ONE_YEAR_IN_SECONDS, httpOnly: true, sameSite: "lax" })
}
