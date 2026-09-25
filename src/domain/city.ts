export type CityId = string

export interface City {
  id: CityId
  name: string
  country: string
  population: number
  lat: number
  lng: number
}

const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 10

function normalize(value: string): string {
  return value
    .normalize("NFD") // separa le lettere dagli accenti: "ü" → "u" + dieresi combinante
    .replace(/[\u0300-\u036f]/g, "") // rimuove i segni diacritici combinanti rimasti soli
    .toLowerCase()
}

export function searchCities(cities: City[], query: string): City[] {
  const normalizedQuery = normalize(query).trim()
  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return []
  }

  return cities
    .filter((city) => normalize(city.name).startsWith(normalizedQuery))
    .sort((a, b) => b.population - a.population)
    .slice(0, MAX_RESULTS)
}
