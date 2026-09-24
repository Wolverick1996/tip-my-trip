import Link from "next/link"
import { Suspense } from "react"
import { CITIES } from "@/domain/city"
import { WelcomeOnboarding } from "./WelcomeOnboarding"

export default function Home() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <Suspense fallback={null}>
        <WelcomeOnboarding />
      </Suspense>

      <h1 className="text-xl font-semibold">TipMyTrip</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Seleziona una città per trovare chi la conosce davvero.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {CITIES.map((city) => (
          <li key={city.id}>
            <Link
              href={`/results/${city.id}`}
              className="block rounded-lg border border-zinc-200 p-3 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              {city.name} <span className="text-zinc-500">— {city.country}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
