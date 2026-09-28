/** @jest-environment node */
import { Effect } from "effect"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import type { Traveler } from "@/domain/traveler"
import { TravelerRepository } from "@/domain/traveler-repository"
import { makeFileTravelerRepository } from "../file-traveler-repository"

let dir: string

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "tipmytrip-"))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const initialTravelers: Traveler[] = [{ id: "mock-1", name: "Mock", languages: ["it"], knownCities: [], contact: {} }]

function run<A, E>(program: Effect.Effect<A, E, TravelerRepository>) {
  const layer = makeFileTravelerRepository(path.join(dir, "travelers.json"), initialTravelers)
  return Effect.runPromise(Effect.provide(program, layer))
}

test("senza file parte dai traveler iniziali", async () => {
  const travelers = await run(Effect.flatMap(TravelerRepository, (repo) => repo.findAll()))

  expect(travelers).toEqual(initialTravelers)
})

test("save aggiorna un traveler esistente invece di duplicarlo, e lo scrive su file", async () => {
  const updated: Traveler = { ...initialTravelers[0], name: "Aggiornato" }

  await run(Effect.flatMap(TravelerRepository, (repo) => repo.save(updated)))

  const onDisk = JSON.parse(readFileSync(path.join(dir, "travelers.json"), "utf-8"))
  expect(onDisk).toEqual([updated])
})

test("i dati salvati sopravvivono a un nuovo layer, come dopo un riavvio del server", async () => {
  const newcomer: Traveler = {
    id: "new-1",
    name: "Nuovo",
    languages: ["it"],
    knownCities: [],
    contact: {},
  }
  await run(Effect.flatMap(TravelerRepository, (repo) => repo.save(newcomer)))

  const found = await run(Effect.flatMap(TravelerRepository, (repo) => repo.findById("new-1")))

  expect(found).toEqual(newcomer)
})

test("un file corrotto non viene sostituito in silenzio dai dati iniziali: l'operazione fallisce", async () => {
  writeFileSync(path.join(dir, "travelers.json"), "{ non è json")

  await expect(run(Effect.flatMap(TravelerRepository, (repo) => repo.findAll()))).rejects.toThrow()
})

test("un file con dati di forma sbagliata fa fallire l'operazione", async () => {
  writeFileSync(path.join(dir, "travelers.json"), JSON.stringify([{ id: "x" }]))

  await expect(run(Effect.flatMap(TravelerRepository, (repo) => repo.findAll()))).rejects.toThrow()
})

test("findById fallisce con TravelerNotFoundError per un id inesistente", async () => {
  const error = await run(Effect.flip(Effect.flatMap(TravelerRepository, (repo) => repo.findById("non-esiste"))))

  expect(error._tag).toBe("TravelerNotFoundError")
})
