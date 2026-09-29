import { Data, Effect } from "effect"
import { runAction } from "../run-action"

class SomeError extends Data.TaggedError("SomeError")<{ message: string }> {}

test("con successo restituisce un oggetto vuoto", async () => {
  const result = await runAction(Effect.void)

  expect(result).toEqual({})
})

test("con un fallimento previsto restituisce il suo messaggio", async () => {
  const result = await runAction(Effect.fail(new SomeError({ message: "Dati non validi." })))

  expect(result).toEqual({ error: "Dati non validi." })
})

test("con un difetto imprevisto restituisce un errore generico e lo logga", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {})

  const result = await runAction(Effect.die(new Error("dettaglio interno")))

  expect(result).toEqual({ error: "Errore interno." })
  expect(console.error).toHaveBeenCalled()
})
