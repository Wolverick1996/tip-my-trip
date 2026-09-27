import { cityCoverage, findTripProblem, tripTitle } from "../trip"

describe("findTripProblem", () => {
  test("un viaggio con città ed esperti distinti è valido", () => {
    expect(findTripProblem({ cityIds: ["madrid", "lisbona"], expertIds: ["e-1"] })).toBeUndefined()
  })

  test("un viaggio senza esperti è valido", () => {
    expect(findTripProblem({ cityIds: ["madrid"], expertIds: [] })).toBeUndefined()
  })

  test("un viaggio senza città non è valido", () => {
    expect(findTripProblem({ cityIds: [], expertIds: [] })).toBe("Aggiungi almeno una città.")
  })

  test("una città ripetuta non è valida, perché falserebbe il punteggio di copertura", () => {
    expect(findTripProblem({ cityIds: ["madrid", "madrid"], expertIds: [] })).toBe(
      "Una città compare più di una volta nel viaggio.",
    )
  })

  test("un esperto ripetuto non è valido", () => {
    expect(findTripProblem({ cityIds: ["madrid"], expertIds: ["e-1", "e-1"] })).toBe(
      "Un esperto compare più di una volta nel viaggio.",
    )
  })
})

describe("tripTitle", () => {
  const cityName = (cityId: string) => ({ madrid: "Madrid", lisbona: "Lisbona" })[cityId] ?? cityId

  test("usa il titolo scelto se c'è", () => {
    expect(tripTitle({ title: "Gita aziendale", cityIds: ["madrid"] }, cityName)).toBe("Gita aziendale")
  })

  test("senza titolo, o con solo spazi, unisce i nomi delle città", () => {
    expect(tripTitle({ cityIds: ["madrid", "lisbona"] }, cityName)).toBe("Madrid + Lisbona")
    expect(tripTitle({ title: "  ", cityIds: ["madrid"] }, cityName)).toBe("Madrid")
  })
})

describe("cityCoverage", () => {
  test("per ogni città indica gli esperti selezionati che la coprono e se l'organizzatore la conosce", () => {
    const coverage = cityCoverage(
      ["madrid", "lisbona", "siviglia"],
      [
        { id: "e-1", cityIds: ["madrid", "lisbona"] },
        { id: "e-2", cityIds: ["madrid"] },
      ],
      ["siviglia"],
    )

    expect(coverage).toEqual([
      { cityId: "madrid", coveredBy: ["e-1", "e-2"], knownByOrganizer: false },
      { cityId: "lisbona", coveredBy: ["e-1"], knownByOrganizer: false },
      { cityId: "siviglia", coveredBy: [], knownByOrganizer: true },
    ])
  })

  test("senza esperti selezionati tutte le città sono scoperte", () => {
    expect(cityCoverage(["madrid"], [], [])).toEqual([{ cityId: "madrid", coveredBy: [], knownByOrganizer: false }])
  })
})
