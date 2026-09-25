import type { CityId } from "@/domain/city"

export interface CitySearchResult {
  id: CityId
  name: string
  country: string
}
