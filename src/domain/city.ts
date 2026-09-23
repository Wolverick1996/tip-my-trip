export type CityId = string

export interface City {
  id: CityId
  name: string
  country: string
  lat: number
  lng: number
}
