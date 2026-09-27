import { Layer, ManagedRuntime } from "effect"
import { FileTravelerRepositoryLive } from "./infrastructure/file-traveler-repository"
import { FileTripRepositoryLive } from "./infrastructure/file-trip-repository"

export const runtime = ManagedRuntime.make(Layer.mergeAll(FileTravelerRepositoryLive, FileTripRepositoryLive))
