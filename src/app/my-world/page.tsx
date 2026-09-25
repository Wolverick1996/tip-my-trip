import { Suspense } from "react"
import { getSyncedCurrentUser } from "@/current-user"
import { getCity } from "@/use-cases/get-city"
import { MyWorld } from "./MyWorld"
import type { ResolvedKnownCity } from "./resolved-known-city"
import { WelcomeOnboarding } from "./WelcomeOnboarding"

export default async function MyWorldPage() {
  const traveler = await getSyncedCurrentUser()

  const knownCities: ResolvedKnownCity[] = traveler.knownCities.flatMap((known) => {
    const city = getCity(known.cityId)
    return city ? [{ city, level: known.level }] : []
  })

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Suspense fallback={null}>
        <WelcomeOnboarding />
      </Suspense>

      <h1 className="text-xl font-semibold">Il mio mondo</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Le città che conosci, sulla mappa e in elenco.</p>

      <MyWorld knownCities={knownCities} />
    </div>
  )
}
