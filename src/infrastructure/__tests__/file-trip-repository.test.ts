/** @jest-environment node */
import { Effect } from "effect"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import type { Trip } from "@/domain/trip"
import { TripRepository } from "@/domain/trip-repository"
import { makeFileTripRepository } from "../file-trip-repository"

let dir: string

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "tipmytrip-"))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

function run<A, E>(program: Effect.Effect<A, E, TripRepository>) {
  const layer = makeFileTripRepository(path.join(dir, "trips.json"))
  return Effect.runPromise(Effect.provide(program, layer))
}

const trip = (overrides: Partial<Trip> = {}): Trip => ({
  id: "t-1",
  organizerId: "org",
  cityIds: ["madrid"],
  experts: [],
  createdAt: 0,
  ...overrides,
})

test("salva e rilegge i viaggi dell'organizzatore, senza quelli degli altri", async () => {
  const selectedTrip = trip({
    experts: [
      {
        id: "expert-1",
        name: "Anna",
        matchedCities: [{ cityId: "madrid", level: "local" }],
        sharedLanguages: ["it"],
      },
    ],
  })

  await run(
    Effect.flatMap(TripRepository, (repo) =>
      Effect.andThen(repo.save(selectedTrip), repo.save(trip({ id: "t-2", organizerId: "altro" }))),
    ),
  )

  const trips = await run(Effect.flatMap(TripRepository, (repo) => repo.findByOrganizer("org")))

  expect(trips).toEqual([selectedTrip])
})

test("delete su un file che non esiste ancora non fallisce", async () => {
  await run(Effect.flatMap(TripRepository, (repo) => repo.delete("t-1", "org")))

  const trips = await run(Effect.flatMap(TripRepository, (repo) => repo.findByOrganizer("org")))
  expect(trips).toEqual([])
})

test("delete rimuove solo il viaggio di quell'organizzatore", async () => {
  await run(
    Effect.flatMap(TripRepository, (repo) =>
      Effect.andThen(repo.save(trip()), repo.save(trip({ id: "t-2", organizerId: "altro" }))),
    ),
  )

  await run(
    Effect.flatMap(TripRepository, (repo) => Effect.andThen(repo.delete("t-1", "org"), repo.delete("t-2", "org"))),
  )

  const onDisk = JSON.parse(readFileSync(path.join(dir, "trips.json"), "utf-8"))
  expect(onDisk).toEqual([trip({ id: "t-2", organizerId: "altro" })])
})
