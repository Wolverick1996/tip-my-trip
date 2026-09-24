import Link from "next/link"
import { ExpertResultCard } from "@/components/ExpertResultCard"
import { CURRENT_ORGANIZER_ID, mockCities } from "@/infrastructure/mock-data"
import { runtime } from "@/runtime"
import { findExpertsForCity } from "@/use-cases/find-experts-for-city"

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ cityId: string }>
}) {
  const { cityId } = await params
  const city = mockCities.find((candidate) => candidate.id === cityId)

  const results = await runtime.runPromise(
    findExpertsForCity(cityId, CURRENT_ORGANIZER_ID),
  )

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
