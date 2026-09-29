import { Cause, Data, Effect, Exit, Option } from "effect"
import type { TravelerRepository } from "@/domain/traveler-repository"
import type { TripRepository } from "@/domain/trip-repository"
import { runtime } from "@/runtime"

export class ActionFailure extends Data.TaggedError("ActionFailure")<{ message: string }> {}

export async function runAction(
  effect: Effect.Effect<void, { message: string }, TravelerRepository | TripRepository>,
): Promise<{ error?: string }> {
  const exit = await runtime.runPromiseExit(effect)
  return Exit.match(exit, {
    onSuccess: () => ({}),
    onFailure: (cause) => {
      const failure = Cause.failureOption(cause)
      if (Option.isSome(failure)) {
        return { error: failure.value.message }
      }
      console.error(Cause.pretty(cause))
      return { error: "Errore interno." }
    },
  })
}
