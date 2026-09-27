import { Schema } from "effect"
import { randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"

export const DATA_DIR = path.join(process.cwd(), ".data")

/**
 * Legge e valida un file JSON. Un file mancante vale `fallback`.
 * Un file illeggibile o con dati di forma sbagliata lancia un'eccezione, che dentro `Effect.sync` diventa un defect:
 * è un guasto, non un esito previsto (vedi docs/decisions.md, "Persistenza").
 */
export function readJsonFile<A, I>(filePath: string, schema: Schema.Schema<A, I>, fallback: A): A {
  let content: string
  try {
    content = readFileSync(filePath, "utf-8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback
    }
    throw error
  }
  return Schema.decodeUnknownSync(schema)(JSON.parse(content))
}

/**
 * Scrive su un file temporaneo con nome univoco e poi lo rinomina: se il processo si interrompe a metà, il file
 * resta quello di prima invece di un JSON troncato.
 */
export function writeJsonFile(filePath: string, data: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true })
  const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(temporary, JSON.stringify(data, null, 2))
  renameSync(temporary, filePath)
}
