import { ManagedRuntime } from "effect"
import { InMemoryTravelerRepositoryLive } from "./infrastructure/in-memory-traveler-repository"

export const runtime = ManagedRuntime.make(InMemoryTravelerRepositoryLive)
