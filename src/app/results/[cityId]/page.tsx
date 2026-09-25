import Link from "next/link"
import { getSyncedCurrentUser } from "@/current-user"
import { runtime } from "@/runtime"
import { findExpertsForCity } from "@/use-cases/find-experts-for-city"
import { getCity } from "@/use-cases/get-city"
import { ExpertResultCard } from "./ExpertResultCard"

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ cityId: string }>
}) {
  const { cityId } = await params
  const cityName = getCity(cityId)?.name ?? cityId
  const traveler = await getSyncedCurrentUser()

  const results = await runtime.runPromise(findExpertsForCity(cityId, traveler.id))

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link href="/my-world" className="text-sm text-zinc-500 hover:underline">
        ← Cambia città
      </Link>

      <h1 className="mt-2 text-xl font-semibold">Chi conosce {cityName}</h1>

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
