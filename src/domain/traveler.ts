import type { CityId } from "./city"
import type { ExpertiseLevel } from "./expertise-level"
import type { LanguageCode } from "./language"

export type TravelerId = string

export interface KnownCity {
  cityId: CityId
  level: ExpertiseLevel
}

export interface TravelerContact {
  whatsapp?: string
  email?: string
}

export interface Traveler {
  id: TravelerId
  name: string
  languages: LanguageCode[]
  knownCities: KnownCity[]
  contact: TravelerContact
}
