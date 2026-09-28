import { Cause, Data, Effect, Exit, Option } from "effect"
import type { NextRequest } from "next/server"
import { findCurrentUser } from "@/current-user"
import { findTripProblem } from "@/domain/trip"
import { runtime } from "@/runtime"
import { findExpertsForTrip } from "@/use-cases/find-experts-for-trip"
import { getCity } from "@/use-cases/get-city"
import type { TripMatch } from "./trip-match"

class BadRequest extends Data.TaggedError("BadRequest")<{ reason: string }> {}
class Unauthorized extends Data.TaggedError("Unauthorized") {}

const tripMatches = (cityIds: string[]) =>
  Effect.gen(function* () {
    const problem = findTripProblem({ cityIds, expertIds: [] })
    if (problem) {
      return yield* Effect.fail(new BadRequest({ reason: problem }))
    }
    if (cityIds.some((cityId) => !getCity(cityId))) {
      return yield* Effect.fail(new BadRequest({ reason: "Una delle città del viaggio non esiste." }))
    }

    const organizer = yield* Effect.promise(() => findCurrentUser())
    if (!organizer) {
      return yield* Effect.fail(new Unauthorized())
    }

    const results = yield* findExpertsForTrip(cityIds, organizer.id)
    return results.map(
      ({ traveler, score, matchedCities, sharedLanguages }): TripMatch => ({
        id: traveler.id,
        name: traveler.name,
        score,
        matchedCities,
        sharedLanguages,
        contact: traveler.contact,
      }),
    )
  }).pipe(
    // Se l'organizzatore sparisce dal repository tra la lettura del cookie e questa chiamata (es. `.data/` cancellata a mano),
    // è la stessa situazione di una sessione scaduta: stesso trattamento (401), non un errore a parte.
    Effect.catchTag("TravelerNotFoundError", () => Effect.fail(new Unauthorized())),
  )

export async function GET(request: NextRequest) {
  const cityIds = (request.nextUrl.searchParams.get("cityIds") ?? "").split(",").map((cityId) => cityId.trim()).filter(Boolean)
  const exit = await runtime.runPromiseExit(tripMatches(cityIds))

  return Exit.match(exit, {
    onSuccess: (matches) => Response.json(matches, { headers: { "Cache-Control": "private, no-store" } }),
    onFailure: (cause) => {
      const failure = Cause.failureOption(cause)
      if (Option.isSome(failure)) {
        const error = failure.value
        switch (error._tag) {
          case "BadRequest":
            return Response.json({ error: error.reason }, { status: 400 })
          case "Unauthorized":
            return Response.json({ error: "Sessione scaduta: ricarica la pagina." }, { status: 401 })
          default:
            // Se domani si aggiunge un terzo errore senza gestirlo qui sopra, questa riga non compila più.
            error satisfies never
        }
      }
      console.error(Cause.pretty(cause))
      return Response.json({ error: "Errore interno" }, { status: 500 })
    },
  })
}
