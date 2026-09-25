"use server"

import { getSyncedCurrentUser, setCurrentUser } from "@/current-user"
import type { CityId } from "@/domain/city"
import type { ExpertiseLevel } from "@/domain/expertise-level"
import { runtime } from "@/runtime"
import { removeKnownCity } from "@/use-cases/remove-known-city"
import { setKnownCity } from "@/use-cases/set-known-city"

export async function setKnownCityAction(cityId: CityId, level: ExpertiseLevel) {
  const traveler = await getSyncedCurrentUser()
  const updated = await runtime.runPromise(setKnownCity(traveler.id, cityId, level))
  await setCurrentUser(updated)
}

export async function removeKnownCityAction(cityId: CityId) {
  const traveler = await getSyncedCurrentUser()
  const updated = await runtime.runPromise(removeKnownCity(traveler.id, cityId))
  await setCurrentUser(updated)
}
