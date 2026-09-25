import type { CityId } from "./city"
import type { ExpertiseLevel } from "./expertise-level"
import type { LanguageCode } from "./language"

export type TravelerId = string

export interface KnownCity {
  cityId: CityId
  level: ExpertiseLevel
}

export interface TravelerContact {
  whatsApp?: string
  email?: string
}

export interface Traveler {
  id: TravelerId
  name: string
  languages: LanguageCode[]
  knownCities: KnownCity[]
  contact: TravelerContact
}

export function upsertKnownCity(
  knownCities: KnownCity[],
  cityId: CityId,
  level: ExpertiseLevel,
): KnownCity[] {
  return [...knownCities.filter((known) => known.cityId !== cityId), { cityId, level }]
}

export function removeKnownCity(knownCities: KnownCity[], cityId: CityId): KnownCity[] {
  return knownCities.filter((known) => known.cityId !== cityId)
}
