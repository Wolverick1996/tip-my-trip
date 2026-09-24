import Link from "next/link"
import { getCurrentUserId } from "@/current-user"
import { CITIES } from "@/domain/city"
import { runtime } from "@/runtime"
import { findExpertsForCity } from "@/use-cases/find-experts-for-city"
import { ExpertResultCard } from "./ExpertResultCard"

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ cityId: string }>
}) {
  const { cityId } = await params
  const city = CITIES.find((candidate) => candidate.id === cityId)
  const currentUserId = await getCurrentUserId()

  const results = await runtime.runPromise(findExpertsForCity(cityId, currentUserId))

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Cambia città
      </Link>

      <h1 className="mt-2 text-xl font-semibold">Chi conosce {city?.name ?? cityId}</h1>

      {results.length === 0 ? (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">
          Nessun esperto trovato per questa città, al momento.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {results.map((result) => (
            <li key={result.traveler.id}>
              <ExpertResultCard result={result} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
