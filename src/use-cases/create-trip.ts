import { Effect } from "effect"
import { randomUUID } from "node:crypto"
import { InvalidTripError } from "@/domain/errors"
import { matchTravelers } from "@/domain/matching"
import { findTripProblem, type Trip } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"
import { TravelerRepository } from "@/domain/traveler-repository"
import type { TravelerId } from "@/domain/traveler"

type CreateTripInput = Omit<Trip, "id" | "createdAt" | "experts"> & { expertIds: TravelerId[] }

export const createTrip = (
  input: CreateTripInput,
): Effect.Effect<Trip, InvalidTripError, TripRepository | TravelerRepository> =>
  Effect.gen(function* () {
    const problem = findTripProblem(input)
    if (problem) {
      return yield* Effect.fail(new InvalidTripError({ reason: problem }))
    }

    const travelers = yield* (yield* TravelerRepository).findAll()
    const organizer = travelers.find((traveler) => traveler.id === input.organizerId)
    if (!organizer) {
      return yield* Effect.fail(new InvalidTripError({ reason: "Organizzatore non trovato." }))
    }
    const candidates = travelers.filter((traveler) => traveler.id !== organizer.id)
    const matches = matchTravelers({ cityIds: input.cityIds }, organizer, candidates)
    const matchesById = new Map(matches.map((match) => [match.traveler.id, match]))
    const experts = []

    for (const expertId of input.expertIds) {
      const match = matchesById.get(expertId)
      if (!match) {
        return yield* Effect.fail(
          new InvalidTripError({
            reason: "Un esperto selezionato non è più disponibile per questo viaggio.",
          }),
        )
      }
      experts.push({
        id: match.traveler.id,
        name: match.traveler.name,
        matchedCities: match.matchedCities,
        sharedLanguages: match.sharedLanguages,
      })
    }

    const repo = yield* TripRepository
    const trip: Trip = {
      organizerId: input.organizerId,
      title: input.title?.trim() || undefined,
      cityIds: input.cityIds,
      experts,
      id: randomUUID(),
      createdAt: Date.now(),
    }
    yield* repo.save(trip)
    return trip
  })
