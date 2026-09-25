import { cookies } from "next/headers"
import type { Traveler } from "./domain/traveler"
import { runtime } from "./runtime"
import { syncCurrentTraveler } from "./use-cases/sync-current-traveler"
import { USER_COOKIE_NAME } from "./user-cookie"

/**
 * Legge il traveler corrente dal cookie di sessione.
 * @prototype Il cookie contiene l'intero Traveler, non firmato, per poterlo reinserire dopo un riavvio del server.
 * In produzione conterrebbe solo un id di sessione verificato lato server.
 */
export async function getCurrentUser(): Promise<Traveler> {
  const store = await cookies()
  const cookie = store.get(USER_COOKIE_NAME)?.value
  if (!cookie) {
    throw new Error("Nessun utente corrente: il proxy avrebbe dovuto reindirizzare a /register")
  }
  return JSON.parse(cookie) as Traveler
}

/**
 * Legge il traveler corrente dal cookie e lo reinserisce nel repository (vedi syncCurrentTraveler).
 * @prototype Con un database reale basterebbe `getCurrentUser`.
 */
export async function getSyncedCurrentUser(): Promise<Traveler> {
  const traveler = await getCurrentUser()
  await runtime.runPromise(syncCurrentTraveler(traveler))
  return traveler
}

export async function setCurrentUser(traveler: Traveler): Promise<void> {
  const store = await cookies()
  store.set(USER_COOKIE_NAME, JSON.stringify(traveler))
}
