import type { CityId } from "./city"
import type { ExpertiseLevel } from "./expertise-level"
import { expertiseLevelValue } from "./expertise-level"
import type { LanguageCode } from "./language"
import type { Traveler } from "./traveler"

export interface MatchingTrip {
  cityIds: CityId[]
}

export interface MatchingOrganizer {
  languages: LanguageCode[]
}

export interface MatchedCity {
  cityId: CityId
  level: ExpertiseLevel
}

export interface MatchResult {
  traveler: Traveler
  score: number
  matchedCities: MatchedCity[]
  sharedLanguages: LanguageCode[]
}

const MAX_LEVEL_VALUE = expertiseLevelValue("local")

export function matchTravelers(
  trip: MatchingTrip,
  organizer: MatchingOrganizer,
  candidates: Traveler[],
): MatchResult[] {
  const results: MatchResult[] = []

  for (const candidate of candidates) {
    const matchedCities: MatchedCity[] = candidate.knownCities
      .filter((known) => trip.cityIds.includes(known.cityId))
      .map((known) => ({ cityId: known.cityId, level: known.level }))

    const sharedLanguages = candidate.languages.filter((language) =>
      organizer.languages.includes(language),
    )

    if (matchedCities.length === 0 || sharedLanguages.length === 0) {
      continue
    }

    const coverageScore = (matchedCities.length / trip.cityIds.length) * 60
    const averageLevel =
      matchedCities.reduce((sum, city) => sum + expertiseLevelValue(city.level), 0) /
      matchedCities.length
    const expertiseScore = (averageLevel / MAX_LEVEL_VALUE) * 40

    results.push({
      traveler: candidate,
      score: Math.round(coverageScore + expertiseScore),
      matchedCities,
      sharedLanguages,
    })
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.matchedCities.length !== a.matchedCities.length) {
      return b.matchedCities.length - a.matchedCities.length
    }
    return a.traveler.name.localeCompare(b.traveler.name)
  })

  return results
}
