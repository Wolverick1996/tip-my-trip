import type { Traveler } from "@/domain/traveler"

/**
 * Traveler finti sempre presenti, e stato iniziale del repository in memoria.
 * @prototype In produzione i dati stanno nel database.
 */
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
      { cityId: "3117735", level: "local" }, // Madrid
      { cityId: "3128760", level: "expert" }, // Barcellona
    ],
    contact: { whatsApp: "+34600111222", email: "elena.ruiz@example.com" },
  },
  {
    id: "u-marco",
    name: "Marco Bianchi",
    languages: ["it"],
    knownCities: [{ cityId: "3117735", level: "base" }], // Madrid
    contact: { whatsApp: "+39320111222" },
  },
  {
    id: "u-ines",
    name: "Inês Costa",
    languages: ["pt", "en"],
    knownCities: [{ cityId: "2267057", level: "local" }], // Lisbona
    contact: { email: "ines.costa@example.com" },
  },
]
