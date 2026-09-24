import type { Traveler } from "@/domain/traveler"

export const mockTravelers: Traveler[] = [
  {
    id: "u-giulia",
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
    contact: { whatsApp: "+34600111222", email: "elena.ruiz@example.com" },
  },
  {
    id: "u-marco",
    name: "Marco Bianchi",
    languages: ["it"],
    knownCities: [{ cityId: "madrid", level: "base" }],
    contact: { whatsApp: "+39320111222" },
  },
  {
    id: "u-ines",
    name: "Inês Costa",
    languages: ["pt", "en"],
    knownCities: [{ cityId: "lisbona", level: "local" }],
    contact: { email: "ines.costa@example.com" },
  },
]
