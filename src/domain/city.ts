export type CityId = string

export interface City {
  id: CityId
  name: string
  country: string
  lat: number
  lng: number
}

// Dato di riferimento fisso per il prototipo (come LANGUAGES in language.ts):
// nessuna vera logica di business o implementazione alternativa, quindi non passa da un port/repository.
export const CITIES: City[] = [
  { id: "madrid", name: "Madrid", country: "Spagna", lat: 40.4168, lng: -3.7038 },
  { id: "barcellona", name: "Barcellona", country: "Spagna", lat: 41.3874, lng: 2.1686 },
  { id: "lisbona", name: "Lisbona", country: "Portogallo", lat: 38.7223, lng: -9.1393 },
  { id: "parigi", name: "Parigi", country: "Francia", lat: 48.8566, lng: 2.3522 },
]
