import { Effect } from "effect"
import { randomUUID } from "node:crypto"
import { InvalidTripError } from "@/domain/errors"
import { findTripProblem, type Trip } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"

type CreateTripInput = Omit<Trip, "id" | "createdAt">

export const createTrip = (input: CreateTripInput): Effect.Effect<Trip, InvalidTripError, TripRepository> =>
  Effect.gen(function* () {
    const problem = findTripProblem(input)
    if (problem) {
      return yield* Effect.fail(new InvalidTripError({ reason: problem }))
    }

    const repo = yield* TripRepository
    const trip: Trip = { ...input, title: input.title?.trim() || undefined, id: randomUUID(), createdAt: Date.now() }
    yield* repo.save(trip)
    return trip
  })
