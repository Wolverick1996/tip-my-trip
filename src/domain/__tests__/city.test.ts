import { searchCities } from "../city"
import type { City } from "../city"

const CITIES: City[] = [
  { id: "1", name: "Zürich", country: "Svizzera", population: 434335, lat: 47.3769, lng: 8.5417 },
  { id: "2", name: "Zug", country: "Svizzera", population: 30542, lat: 47.1662, lng: 8.5155 },
  { id: "3", name: "Columbus", country: "Stati Uniti d'America", population: 898553, lat: 39.9612, lng: -82.9988 },
  {
    id: "4",
    name: "Columbus",
    country: "Stati Uniti d'America",
    population: 23640,
    lat: 32.4610,
    lng: -84.9877,
  },
  { id: "5", name: "Madrid", country: "Spagna", population: 3223334, lat: 40.4168, lng: -3.7038 },
]

test("richiede almeno 2 caratteri, altrimenti nessun risultato", () => {
  expect(searchCities(CITIES, "")).toEqual([])
  expect(searchCities(CITIES, "m")).toEqual([])
})

test("cerca per prefisso del nome, case-insensitive", () => {
  const results = searchCities(CITIES, "MAD")
  expect(results.map((c) => c.name)).toEqual(["Madrid"])
})

test("ignora gli accenti (query senza accento trova un nome accentato)", () => {
  const results = searchCities(CITIES, "zurich")
  expect(results.map((c) => c.name)).toEqual(["Zürich"])
})

test("un prefisso ambiguo su lettera è un errore di battitura, non trova nulla per correzione automatica", () => {
  expect(searchCities(CITIES, "madird")).toEqual([])
})

test("ordina i risultati per popolazione decrescente", () => {
  const results = searchCities(CITIES, "zu")
  expect(results.map((c) => c.id)).toEqual(["1", "2"]) // Zürich (434k) prima di Zug (30k)
})

test("città omonime nello stesso paese: la più popolosa viene prima", () => {
  const results = searchCities(CITIES, "columbus")
  expect(results.map((c) => c.id)).toEqual(["3", "4"])
})

test("limita i risultati a un massimo di 10", () => {
  const manyCities: City[] = Array.from({ length: 20 }, (_, i) => ({
    id: String(i),
    name: `Testville ${i}`,
    country: "Testland",
    population: i,
    lat: 0,
    lng: 0,
  }))

  expect(searchCities(manyCities, "test")).toHaveLength(10)
})
