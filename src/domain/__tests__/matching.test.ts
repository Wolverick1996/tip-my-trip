import { matchTravelers } from "../matching"
import type { LanguageCode } from "../language"
import type { Traveler } from "../traveler"

function traveler(overrides: Partial<Traveler> & Pick<Traveler, "id" | "name">): Traveler {
  return {
    languages: [],
    knownCities: [],
    contact: {},
    ...overrides,
  }
}

test("esclude un candidato che non conosce nessuna città del viaggio", () => {
  const candidate = traveler({
    id: "t1",
    name: "Anna",
    languages: ["it"],
    knownCities: [{ cityId: "lisbona", level: "local" }],
  })

  const results = matchTravelers({ cityIds: ["madrid"] }, { languages: ["it"] }, [candidate])

  expect(results).toEqual([])
})

test("esclude un candidato che non condivide nessuna lingua con l'organizzatore", () => {
  const candidate = traveler({
    id: "t1",
    name: "Anna",
    languages: ["de"],
    knownCities: [{ cityId: "madrid", level: "local" }],
  })

  const results = matchTravelers({ cityIds: ["madrid"] }, { languages: ["it"] }, [candidate])

  expect(results).toEqual([])
})

test("calcola il punteggio come nell'esempio del product brief (copertura 60% + livello 40%)", () => {
  const candidate = traveler({
    id: "t1",
    name: "Anna",
    languages: ["it", "en"],
    knownCities: [
      { cityId: "madrid", level: "local" },
      { cityId: "barcellona", level: "expert" },
    ],
  })

  const results = matchTravelers(
    { cityIds: ["madrid", "barcellona", "siviglia"] },
    { languages: ["it"] },
    [candidate],
  )

  expect(results).toHaveLength(1)
  expect(results[0].score).toBe(73)
  expect(results[0].sharedLanguages).toEqual(["it"])
})

test("non conta le città conosciute dal candidato che non fanno parte del viaggio", () => {
  const candidate = traveler({
    id: "t1",
    name: "Anna",
    languages: ["it"],
    knownCities: [
      { cityId: "madrid", level: "expert" },
      { cityId: "tokyo", level: "local" }, // fuori dal viaggio, non deve contare
    ],
  })

  const results = matchTravelers({ cityIds: ["madrid"] }, { languages: ["it"] }, [candidate])

  expect(results[0].matchedCities).toEqual([{ cityId: "madrid", level: "expert" }])
  // coverage = (1/1)*60 = 60, expertise = (2/3)*40 = 26.67 → round(86.67) = 87
  // (se "tokyo" contasse per errore, il punteggio sarebbe diverso)
  expect(results[0].score).toBe(87)
})

test("restituisce una lista vuota se non ci sono candidati", () => {
  const results = matchTravelers({ cityIds: ["madrid"] }, { languages: ["it"] }, [])

  expect(results).toEqual([])
})

test("ordina per punteggio decrescente, poi per città in comune decrescenti, poi alfabeticamente", () => {
  const trip = { cityIds: ["a", "b", "c"] }
  const organizer = { languages: ["it"] as LanguageCode[] }

  // matched=3, tutte Local → coverage 60 + expertise 40 = score 100 (il più alto: deve venire primo)
  const dario = traveler({
    id: "t0",
    name: "Dario",
    languages: ["it"],
    knownCities: [
      { cityId: "a", level: "local" },
      { cityId: "b", level: "local" },
      { cityId: "c", level: "local" },
    ],
  })

  // matched=1, livello Local → coverage 20 + expertise 40 = score 60
  const zoe = traveler({
    id: "t1",
    name: "Zoe",
    languages: ["it"],
    knownCities: [{ cityId: "a", level: "local" }],
  })

  // matched=2, livelli Base+Expert (media 1.5) → coverage 40 + expertise 20 = score 60
  const anna = traveler({
    id: "t2",
    name: "Anna",
    languages: ["it"],
    knownCities: [
      { cityId: "a", level: "base" },
      { cityId: "b", level: "expert" },
    ],
  })

  // matched=2, stessa combinazione di Anna ma su altre città → stesso score 60
  const marco = traveler({
    id: "t3",
    name: "Marco",
    languages: ["it"],
    knownCities: [
      { cityId: "b", level: "base" },
      { cityId: "c", level: "expert" },
    ],
  })

  const results = matchTravelers(trip, organizer, [zoe, anna, marco, dario])

  // Dario (100) prima di tutti — criterio primario: punteggio decrescente.
  // Tra Anna/Marco/Zoe (tutti 60) — criterio secondario: più città in comune (Anna e Marco, 2, prima di Zoe, 1).
  // Tra Anna e Marco (stesso punteggio, stesse città in comune) — criterio terziario: alfabetico.
  expect(results.map((r) => r.traveler.name)).toEqual(["Dario", "Anna", "Marco", "Zoe"])
  expect(results[0].score).toBe(100)
  expect(results.slice(1).every((r) => r.score === 60)).toBe(true)
})
