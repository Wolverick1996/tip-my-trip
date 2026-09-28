import type { Traveler } from "@/domain/traveler"

const knownCity = (cityId: string, level: Traveler["knownCities"][number]["level"]) => ({ cityId, level })

const mockTravelerProfiles: Array<[
  Traveler["id"], Traveler["name"], Traveler["languages"], Traveler["knownCities"],
]> = [
  ["u-giulia", "Giulia Ferri", ["it", "en"], [
    knownCity("3169070", "expert"), // Roma
    knownCity("3176959", "local"), // Firenze
    knownCity("1850147", "base"), // Tokyo
  ]],
  ["u-elena", "Elena Ruiz", ["es", "en", "it"], [
    knownCity("3117735", "local"), // Madrid
    knownCity("3128760", "expert"), // Barcellona
    knownCity("2542997", "base"), // Marrakech
  ]],
  ["u-marco", "Marco Bianchi", ["it"], [
    knownCity("3117735", "base"), // Madrid
    knownCity("3169070", "expert"), // Roma
    knownCity("745044", "base"), // Istanbul
  ]],
  ["u-ines", "Inês Costa", ["pt", "en"], [
    knownCity("2267057", "local"), // Lisbona
    knownCity("2988507", "base"), // Parigi
    knownCity("3451190", "expert"), // Rio de Janeiro
  ]],
  ["u-sofia", "Sofia Moretti", ["it", "fr"], [
    knownCity("3173435", "local"), // Milano
    knownCity("2988507", "expert"), // Parigi
  ]],
  ["u-david", "David Martin", ["en", "fr"], [
    knownCity("2643743", "local"), // Londra
    knownCity("2988507", "expert"), // Parigi
    knownCity("1880252", "base"), // Singapore
  ]],
  ["u-lucia", "Lucía García", ["es", "en"], [
    knownCity("3128760", "local"), // Barcellona
    knownCity("2510911", "expert"), // Siviglia
    knownCity("292223", "base"), // Dubai
  ]],
  ["u-tom", "Tom Walker", ["en", "de"], [
    knownCity("2964574", "local"), // Dublino
    knownCity("2643743", "expert"), // Londra
    knownCity("1609350", "base"), // Bangkok
  ]],
  ["u-anna", "Anna Rossi", ["it", "en"], [
    knownCity("3164603", "local"), // Venezia
    knownCity("3173435", "base"), // Milano
  ]],
  ["u-pedro", "Pedro Silva", ["pt", "es"], [
    knownCity("2267057", "expert"), // Lisbona
    knownCity("3117735", "base"), // Madrid
  ]],
  ["u-claire", "Claire Dubois", ["fr", "en"], [
    knownCity("2988507", "local"), // Parigi
    knownCity("2996944", "expert"), // Lione
  ]],
  ["u-lukas", "Lukas Weber", ["de", "en"], [
    knownCity("2867714", "local"), // Monaco di Baviera
    knownCity("2657896", "expert"), // Zurigo
  ]],
  ["u-marta", "Marta Kowalska", ["pl", "en"], [
    knownCity("756135", "local"), // Varsavia
    knownCity("3067696", "expert"), // Praga
  ]],
  ["u-nikos", "Nikos Papadopoulos", ["el", "en"], [
    knownCity("264371", "local"), // Atene
    knownCity("3169070", "base"), // Roma
  ]],
  ["u-freja", "Freja Nielsen", ["da", "en"], [
    knownCity("2618425", "local"), // Copenaghen
    knownCity("2673730", "expert"), // Stoccolma
  ]],
  ["u-erik", "Erik Andersson", ["sv", "en"], [
    knownCity("2673730", "local"), // Stoccolma
    knownCity("2618425", "base"), // Copenaghen
  ]],
  ["u-alice", "Alice Romano", ["it", "en"], [
    knownCity("3172394", "local"), // Napoli
    knownCity("3169070", "expert"), // Roma
  ]],
  ["u-carlos", "Carlos Moreno", ["es", "fr"], [
    knownCity("3117735", "expert"), // Madrid
    knownCity("2988507", "base"), // Parigi
  ]],
  ["u-emma", "Emma O'Brien", ["en", "it"], [
    knownCity("2964574", "local"), // Dublino
    knownCity("2650225", "expert"), // Edimburgo
    knownCity("5128581", "expert"), // New York
  ]],
  ["u-julien", "Julien Bernard", ["fr", "en"], [
    knownCity("2990440", "local"), // Nizza
    knownCity("2995469", "expert"), // Marsiglia
  ]],
  ["u-chiara", "Chiara Conti", ["it", "de"], [
    knownCity("3165524", "local"), // Torino
    knownCity("3173435", "expert"), // Milano
  ]],
  ["u-noah", "Noah Müller", ["de", "fr"], [
    knownCity("2657896", "local"), // Zurigo
    knownCity("2660646", "expert"), // Ginevra
  ]],
  ["u-olivia", "Olivia Brown", ["en", "nl"], [
    knownCity("2643743", "expert"), // Londra
    knownCity("2800866", "base"), // Bruxelles
    knownCity("1835848", "base"), // Seul
  ]],
  ["u-javier", "Javier López", ["es", "en"], [
    knownCity("2510911", "local"), // Siviglia
    knownCity("3128760", "expert"), // Barcellona
    knownCity("1857910", "base"), // Kyoto
  ]],
  ["u-klara", "Klára Nováková", ["cs", "en"], [
    knownCity("3067696", "local"), // Praga
    knownCity("756135", "base"), // Varsavia
  ]],
  ["u-andrei", "Andrei Popescu", ["ro", "en"], [
    knownCity("683506", "local"), // Bucarest
    knownCity("264371", "base"), // Atene
  ]],
  ["u-ivana", "Ivana Horvat", ["hr", "en"], [
    knownCity("3186886", "local"), // Zagabria
    knownCity("3164603", "expert"), // Venezia
  ]],
  ["u-milos", "Miloš Petrović", ["sr", "en"], [
    knownCity("792680", "local"), // Belgrado
    knownCity("3186886", "base"), // Zagabria
  ]],
  ["u-zoe", "Zoé Laurent", ["fr", "it"], [
    knownCity("2995469", "local"), // Marsiglia
    knownCity("2990440", "expert"), // Nizza
  ]],
  ["u-matteo", "Matteo Ricci", ["it", "en"], [
    knownCity("3176959", "expert"), // Firenze
    knownCity("3172394", "base"), // Napoli
  ]],
]

/**
 * Traveler finti, copiati nel file dei traveler al primo avvio (vedi FileTravelerRepositoryLive).
 * @prototype In produzione i dati stanno nel database.
 */
export const mockTravelers: Traveler[] = mockTravelerProfiles.map(([id, name, languages, knownCities], index) => ({
  id,
  name,
  languages,
  knownCities,
  contact: {
    email: `${id.slice(2)}@example.com`,
    whatsApp: `+120255501${String(index).padStart(2, "0")}`,
  },
}))
