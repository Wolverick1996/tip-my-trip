import { Data } from "effect"

export class TravelerNotFoundError extends Data.TaggedError("TravelerNotFoundError")<{
  travelerId: string
}> {}
