import { removeKnownCity, upsertKnownCity } from "../traveler"
import type { KnownCity } from "../traveler"

test("upsertKnownCity aggiunge una città non ancora conosciuta", () => {
  const result = upsertKnownCity([], "1", "base")
  expect(result).toEqual([{ cityId: "1", level: "base" }])
})

test("upsertKnownCity aggiorna il livello se la città è già conosciuta, senza duplicarla", () => {
  const knownCities: KnownCity[] = [
    { cityId: "1", level: "base" },
    { cityId: "2", level: "expert" },
  ]

  const result = upsertKnownCity(knownCities, "1", "local")

  expect(result).toHaveLength(2)
  expect(result).toContainEqual({ cityId: "1", level: "local" })
  expect(result).toContainEqual({ cityId: "2", level: "expert" })
})

test("removeKnownCity toglie la città indicata, lascia le altre invariate", () => {
  const knownCities: KnownCity[] = [
    { cityId: "1", level: "base" },
    { cityId: "2", level: "expert" },
  ]

  const result = removeKnownCity(knownCities, "1")

  expect(result).toEqual([{ cityId: "2", level: "expert" }])
})

test("removeKnownCity su una città non conosciuta non cambia nulla", () => {
  const knownCities: KnownCity[] = [{ cityId: "1", level: "base" }]

  const result = removeKnownCity(knownCities, "non-esiste")

  expect(result).toEqual(knownCities)
})
