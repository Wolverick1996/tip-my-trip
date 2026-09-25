/** @jest-environment node */
import { NextRequest } from "next/server"
import type { City } from "@/domain/city"
import { searchCities } from "@/use-cases/search-cities"
import { GET } from "../route"

jest.mock("@/use-cases/search-cities", () => ({ searchCities: jest.fn() }))

const lisbona: City = { id: "2267057", name: "Lisbona", country: "Portogallo", population: 1, lat: 0, lng: 0 }

function get(query: string): Response {
  return GET(new NextRequest(`http://localhost/api/cities?q=${encodeURIComponent(query)}`))
}

test("restituisce 200 con solo i campi del DTO e l'header di cache, passando la query senza spazi", async () => {
  jest.mocked(searchCities).mockReturnValue([lisbona])

  const response = get("  lisb  ")

  expect(searchCities).toHaveBeenCalledWith("lisb")
  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toBe("public, max-age=3600, stale-while-revalidate=86400")
  expect(await response.json()).toEqual([{ id: "2267057", name: "Lisbona", country: "Portogallo" }])
})

test("una query oltre 100 caratteri restituisce 400 con un errore JSON, senza cache", async () => {
  const response = get("a".repeat(101))

  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: "Query troppo lunga" })
})

test("un errore imprevisto della ricerca restituisce 500 con un errore generico, senza cache", async () => {
  jest.mocked(searchCities).mockImplementation(() => {
    throw new Error("dettaglio interno")
  })
  jest.spyOn(console, "error").mockImplementation(() => {})

  const response = get("roma")

  expect(response.status).toBe(500)
  expect(await response.json()).toEqual({ error: "Errore interno" })
})
