import { Cause, Effect, Exit, Option, Schema } from "effect"
import type { NextRequest } from "next/server"
import { searchCities } from "@/use-cases/search-cities"
import type { CitySearchResult } from "./city-search-result"

const CityQuery = Schema.Trim.pipe(Schema.maxLength(100))

const searchCitiesByQuery = (rawQuery: string) =>
  Effect.gen(function* () {
    const query = yield* Schema.decode(CityQuery)(rawQuery)
    const cities = yield* Effect.sync(() => searchCities(query))
    return cities.map(({ id, name, country }): CitySearchResult => ({ id, name, country }))
  })

export function GET(request: NextRequest) {
  const exit = Effect.runSyncExit(searchCitiesByQuery(request.nextUrl.searchParams.get("q") ?? ""))

  return Exit.match(exit, {
    onSuccess: (results) =>
      Response.json(results, {
        headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
      }),
    onFailure: (cause) => {
      if (Option.isSome(Cause.failureOption(cause))) {
        return Response.json({ error: "Query troppo lunga" }, { status: 400 })
      }
      console.error(Cause.pretty(cause))
      return Response.json({ error: "Errore interno" }, { status: 500 })
    },
  })
}
