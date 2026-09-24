import { ManagedRuntime } from "effect"
import { InMemoryTravelerRepositoryLive } from "./infrastructure/in-memory-traveler-repository"

// Composition root: l'unico posto che sa quale implementazione concreta usare.
// Le pagine chiamano solo `runtime.runPromise(...)`, mai direttamente `InMemoryTravelerRepositoryLive`.
export const runtime = ManagedRuntime.make(InMemoryTravelerRepositoryLive)
