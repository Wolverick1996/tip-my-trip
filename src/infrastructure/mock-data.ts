import type { City } from "../domain/city"
import type { Traveler } from "../domain/traveler"

export const mockCities: City[] = [
  { id: "madrid", name: "Madrid", country: "Spagna", lat: 40.4168, lng: -3.7038 },
  { id: "barcellona", name: "Barcellona", country: "Spagna", lat: 41.3874, lng: 2.1686 },
  { id: "lisbona", name: "Lisbona", country: "Portogallo", lat: 38.7223, lng: -9.1393 },
  { id: "parigi", name: "Parigi", country: "Francia", lat: 48.8566, lng: 2.3522 },
]

export const mockTravelers: Traveler[] = [
  {
    id: "u-organizer",
    name: "Giulia Ferri",
    languages: ["it", "en"],
    knownCities: [],
    contact: { email: "giulia.ferri@example.com" },
  },
  {
    id: "u-elena",
    name: "Elena Ruiz",
    languages: ["es", "en", "it"],
    knownCities: [
      { cityId: "madrid", level: "local" },
      { cityId: "barcellona", level: "expert" },
    ],
    contact: { whatsapp: "+34600111222", email: "elena.ruiz@example.com" },
  },
  {
    id: "u-marco",
    name: "Marco Bianchi",
    languages: ["it"],
    knownCities: [{ cityId: "madrid", level: "base" }],
    contact: { whatsapp: "+39320111222" },
  },
  {
    id: "u-ines",
    name: "Inês Costa",
    languages: ["pt", "en"],
    knownCities: [{ cityId: "lisbona", level: "local" }],
    contact: { email: "ines.costa@example.com" },
  },
]
