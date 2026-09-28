import type { CityId } from "@/domain/city"
import type { ExpertiseLevel } from "@/domain/expertise-level"
import type { LanguageCode } from "@/domain/language"
import type { TravelerContact, TravelerId } from "@/domain/traveler"
import type { TripId } from "@/domain/trip"

export interface ResolvedTrip {
  id: TripId
  title: string
  cities: { id: CityId; name: string; coveredBy: string[]; knownByOrganizer: boolean }[]
  experts: {
    id: TravelerId
    name: string
    knownCities: { id: CityId; name: string; level: ExpertiseLevel }[]
    languages: LanguageCode[]
    contact: TravelerContact
  }[]
}
