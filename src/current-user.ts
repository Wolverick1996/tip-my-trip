import { cookies } from "next/headers"
import type { TravelerId } from "./domain/traveler"
import { USER_COOKIE_NAME } from "./user-cookie"

export async function getCurrentUserId(): Promise<TravelerId> {
  const store = await cookies()
  const id = store.get(USER_COOKIE_NAME)?.value
  if (!id) {
    throw new Error("Nessun utente corrente: il proxy avrebbe dovuto reindirizzare a /register")
  }
  return id
}

export async function setCurrentUserId(travelerId: TravelerId): Promise<void> {
  const store = await cookies()
  store.set(USER_COOKIE_NAME, travelerId)
}
