import type { CityId } from "@/domain/city"
import type { TravelerContact, TravelerId } from "@/domain/traveler"
import type { TripId } from "@/domain/trip"

export interface ResolvedTrip {
  id: TripId
  title: string
  cities: { id: CityId; name: string; coveredBy: string[]; knownByOrganizer: boolean }[]
  experts: { id: TravelerId; name: string; languages: string[]; contact: TravelerContact }[]
}

export function coverageLabel(city: { coveredBy: string[]; knownByOrganizer: boolean }, noExperts = false): string {
  if (city.coveredBy.length > 0) {
    return `Coperta da ${city.coveredBy.join(", ")}`
  }
  const status = noExperts ? "Nessun esperto" : "Scoperta"
  return city.knownByOrganizer ? `${status} · la conosci già tu` : status
}
