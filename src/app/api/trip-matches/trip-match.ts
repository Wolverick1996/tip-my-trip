import type { LanguageCode } from "@/domain/language"
import type { MatchedCity } from "@/domain/matching"
import type { TravelerContact, TravelerId } from "@/domain/traveler"

export interface TripMatch {
  id: TravelerId
  name: string
  score: number
  matchedCities: MatchedCity[]
  sharedLanguages: LanguageCode[]
  contact: TravelerContact
}
