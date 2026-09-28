import type { CityId } from "./city"
import type { MatchedCity } from "./matching"
import type { LanguageCode } from "./language"
import type { TravelerId } from "./traveler"

export type TripId = string

export interface Trip {
  id: TripId
  organizerId: TravelerId
  title?: string
  cityIds: CityId[]
  experts: TripExpertSnapshot[]
  createdAt: number
}

export interface TripExpertSnapshot {
  id: TravelerId
  name: string
  matchedCities: MatchedCity[]
  sharedLanguages: LanguageCode[]
}

export interface CityCoverage {
  cityId: CityId
  coveredBy: TravelerId[]
  knownByOrganizer: boolean
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length
}

export function findTripProblem(trip: { cityIds: CityId[]; expertIds: TravelerId[] }): string | undefined {
  if (trip.cityIds.length === 0) {
    return "Aggiungi almeno una città."
  }
  if (hasDuplicates(trip.cityIds)) {
    return "Una città compare più di una volta nel viaggio."
  }
  if (hasDuplicates(trip.expertIds)) {
    return "Un esperto compare più di una volta nel viaggio."
  }
  return undefined
}

export function tripTitle(trip: Pick<Trip, "title" | "cityIds">, cityName: (cityId: CityId) => string): string {
  return trip.title?.trim() || trip.cityIds.map(cityName).join(" + ")
}

export function cityCoverage(
  cityIds: CityId[],
  selectedExperts: { id: TravelerId; cityIds: CityId[] }[],
  organizerCityIds: CityId[],
): CityCoverage[] {
  return cityIds.map((cityId) => ({
    cityId,
    coveredBy: selectedExperts.filter((expert) => expert.cityIds.includes(cityId)).map((expert) => expert.id),
    knownByOrganizer: organizerCityIds.includes(cityId),
  }))
}
