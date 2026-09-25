import type { City, CityId } from "@/domain/city"
import { findCityById } from "@/infrastructure/city-catalog"

export function getCity(cityId: CityId): City | undefined {
  return findCityById(cityId)
}
