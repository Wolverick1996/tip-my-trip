import type { CityId } from "./city"
import type { TravelerId } from "./traveler"

export type TripId = string

export interface Trip {
  id: TripId
  title: string
  organizerId: TravelerId
  cityIds: CityId[]
}
