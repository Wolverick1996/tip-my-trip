import Link from "next/link"
import type { MatchResult } from "@/domain/matching"
import { getLanguageName } from "@/domain/language"
import { cityName, levelLabel } from "@/components/format"

export function ExpertResultCard({ result }: { result: MatchResult }) {
  const { traveler, score, matchedCities, sharedLanguages } = result

  const citiesText = matchedCities
    .map((match) => `${levelLabel(match.level)} a ${cityName(match.cityId)}`)
    .join(", ")

  const languagesText = sharedLanguages.map(getLanguageName).join(", ")

  return (
    <Link
      href={`/experts/${traveler.id}`}
      className="block rounded-lg border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{traveler.name}</span>
        <span className="text-sm text-zinc-500">{score}/100</span>
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {citiesText} — parla {languagesText}
      </p>
    </Link>
  )
}
