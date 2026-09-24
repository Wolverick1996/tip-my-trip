import { Effect, Either } from "effect"
import Link from "next/link"
import { cityName, levelLabel } from "@/components/format"
import { getLanguageName } from "@/domain/language"
import { runtime } from "@/runtime"
import { getTravelerProfile } from "@/use-cases/get-traveler-profile"
import { ContactLinks } from "./ContactLinks"

export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<{ travelerId: string }>
}) {
  const { travelerId } = await params

  const result = await runtime.runPromise(Effect.either(getTravelerProfile(travelerId)))

  if (Either.isLeft(result)) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Torna alla selezione città
        </Link>
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">Profilo non trovato.</p>
      </div>
    )
  }

  const traveler = result.right

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Torna alla selezione città
      </Link>

      <h1 className="mt-2 text-xl font-semibold">{traveler.name}</h1>

      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Parla {traveler.languages.length > 0
          ? traveler.languages.map(getLanguageName).join(", ")
          : "—"}
      </p>

      <h2 className="mt-4 font-medium">Città conosciute</h2>
      {traveler.knownCities.length === 0 ? (
        <p className="text-sm text-zinc-500">Nessuna città indicata.</p>
      ) : (
        <ul className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {traveler.knownCities.map((known) => (
            <li key={known.cityId}>
              {cityName(known.cityId)} — {levelLabel(known.level)}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-4 font-medium">Contatti</h2>
      <div className="mt-1">
        <ContactLinks contact={traveler.contact} />
      </div>
    </div>
  )
}
