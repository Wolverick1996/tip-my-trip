import type { City } from "@/domain/city"
import { searchCities as searchCitiesInCatalog } from "@/domain/city"
import { CITIES } from "@/infrastructure/city-catalog"

export function searchCities(query: string): City[] {
  return searchCitiesInCatalog(CITIES, query)
}
