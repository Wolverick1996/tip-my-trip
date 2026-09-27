import { Data } from "effect"

export class TravelerNotFoundError extends Data.TaggedError("TravelerNotFoundError")<{
  travelerId: string
}> {}

export class InvalidRegistrationError extends Data.TaggedError("InvalidRegistrationError")<{
  reason: string
}> {}

export class InvalidTripError extends Data.TaggedError("InvalidTripError")<{
  reason: string
}> {}
