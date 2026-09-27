"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import type { CitySearchResult } from "@/app/api/cities/city-search-result"
import type { TripMatch } from "@/app/api/trip-matches/trip-match"
import { useCitySearch } from "@/hooks/use-city-search"
import type { CityId } from "@/domain/city"
import { expertiseLevelLabel } from "@/domain/expertise-level"
import { getLanguageName } from "@/domain/language"
import { cityCoverage, tripTitle } from "@/domain/trip"
import { createTripAction } from "./actions"
import { coverageLabel } from "./resolved-trip"

type Step = "cities" | "experts"

export function CreateTripModal({
  organizerCityIds,
  onClose,
}: {
  organizerCityIds: CityId[]
  onClose: () => void
}) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("cities")
  const [query, setQuery] = useState("")
  const [cities, setCities] = useState<CitySearchResult[]>([])
  const [title, setTitle] = useState("")
  const [matches, setMatches] = useState<TripMatch[] | null>(null)
  const [matchesFailed, setMatchesFailed] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  const { results, searching, searchFailed, active: searchActive } = useCitySearch(query, step === "cities")
  const cityName = (cityId: CityId) => cities.find((city) => city.id === cityId)?.name ?? cityId
  const defaultTitle = tripTitle({ cityIds: cities.map((city) => city.id) }, cityName)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (step !== "experts") {
      return
    }
    const controller = new AbortController()
    fetch(`/api/trip-matches?cityIds=${cities.map((city) => city.id).join(",")}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/logout")
          return
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const found = (await response.json()) as TripMatch[]
        setMatches(found)
        setMatchesFailed(false)
        setSelectedIds((current) => current.filter((id) => found.some((match) => match.id === id)))
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMatchesFailed(true)
        }
      })
    return () => controller.abort()
  }, [step, cities, router])

  function confirmDiscard(): boolean {
    return cities.length === 0 || window.confirm("Scartare questo viaggio?")
  }

  function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    if (!confirmDiscard()) {
      event.preventDefault()
    }
  }

  function addCity(city: CitySearchResult) {
    setCities((current) => [...current, city])
    setQuery("")
    searchRef.current?.focus()
  }

  function removeCity(cityId: CityId) {
    setCities((current) => current.filter((city) => city.id !== cityId))
    searchRef.current?.focus()
  }

  function goToExperts() {
    setMatches(null)
    setMatchesFailed(false)
    setError(null)
    setStep("experts")
  }

  function toggleExpert(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id]))
  }

  function save() {
    startSaving(async () => {
      const result = await createTripAction({
        title,
        cityIds: cities.map((city) => city.id),
        expertIds: selectedIds,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      dialogRef.current?.close()
    })
  }

  const selectedMatches = (matches ?? []).filter((match) => selectedIds.includes(match.id))
  const coverage = cityCoverage(
    cities.map((city) => city.id),
    selectedMatches.map((match) => ({ id: match.id, cityIds: match.matchedCities.map((matched) => matched.cityId) })),
    organizerCityIds,
  )
  const matchName = (id: string) => matches?.find((match) => match.id === id)?.name ?? id
  const hasExpertsFor = (cityId: CityId) =>
    (matches ?? []).some((match) => match.matchedCities.some((matched) => matched.cityId === cityId))

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={handleCancel}
      aria-labelledby="create-trip-title"
      className="m-auto flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between">
        <h2 id="create-trip-title" ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
          {step === "cities" ? "Passo 1 di 2 · Città" : "Passo 2 di 2 · Esperti"}
        </h2>
        <button
          type="button"
          onClick={() => confirmDiscard() && dialogRef.current?.close()}
          aria-label="Annulla e chiudi"
        >
          ✕
        </button>
      </div>

      {step === "cities" ? (
        <div className="mt-4 flex flex-col gap-3 overflow-y-auto">
          <input
            ref={searchRef}
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca una città…"
            aria-label="Cerca una città"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          {searching && <p className="text-sm text-zinc-500">Cerco…</p>}
          {!searching && searchFailed && <p className="text-sm text-red-600">Ricerca non disponibile, riprova.</p>}
          {!searching && !searchFailed && searchActive && results.length === 0 && (
            <p className="text-sm text-zinc-500">Nessuna città trovata.</p>
          )}
          {results.length > 0 && (
            <ul className="max-h-48 overflow-y-auto">
              {results.map((city) => {
                const alreadyAdded = cities.some((added) => added.id === city.id)
                return (
                  <li key={city.id}>
                    <button
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => addCity(city)}
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-zinc-50 disabled:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      {city.name}, {city.country}
                      {alreadyAdded && <span className="ml-2 text-xs">Già nel viaggio</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {cities.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Città del viaggio">
              {cities.map((city) => (
                <li key={city.id}>
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
                    {city.name}
                    <button type="button" onClick={() => removeCity(city.id)} aria-label={`Rimuovi ${city.name}`}>
                      ×
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Titolo (facoltativo)</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle || "Es. Trasferta a Madrid"}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={cities.length === 0}
              onClick={goToExperts}
              className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Avanti
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex min-h-0 flex-col gap-3">
          <ul aria-live="polite" className="text-sm">
            {coverage.map((city) => (
              <li key={city.cityId}>
                {cityName(city.cityId)}{" "}
                <span className="text-zinc-500">
                  — {coverageLabel({ ...city, coveredBy: city.coveredBy.map(matchName) }, matches !== null && !hasExpertsFor(city.cityId))}
                </span>
              </li>
            ))}
          </ul>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {matches === null && !matchesFailed && <p className="text-sm text-zinc-500">Cerco esperti…</p>}
            {matchesFailed && <p className="text-sm text-red-600">Esperti non disponibili, riprova.</p>}
            {matches !== null && matches.length === 0 && (
              <p className="text-sm text-zinc-500">Nessun esperto per queste città, al momento.</p>
            )}
            {matches !== null && matches.length > 0 && (
              <ul className="flex flex-col gap-2">
                {matches.map((match) => (
                  <li key={match.id}>
                    <label className="flex gap-3 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(match.id)}
                        onChange={() => toggleExpert(match.id)}
                      />
                      <span className="flex-1">
                        <span className="flex justify-between font-medium">
                          {match.name} <span className="text-zinc-500">{match.score}/100</span>
                        </span>
                        <span className="block text-zinc-600 dark:text-zinc-400">
                          {match.matchedCities.length}/{cities.length} città:{" "}
                          {match.matchedCities
                            .map((matched) => `${cityName(matched.cityId)} (${expertiseLevelLabel(matched.level)})`)
                            .join(", ")}
                        </span>
                        <span className="block text-zinc-600 dark:text-zinc-400">
                          Parla {match.sharedLanguages.map(getLanguageName).join(", ")}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setStep("cities")} className="text-sm text-zinc-500 hover:underline">
              ← Modifica città
            </button>
            <button
              type="button"
              disabled={saving || matches === null}
              onClick={save}
              className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {selectedIds.length === 0
                ? "Salva senza esperti"
                : `Salva viaggio (${selectedIds.length} ${selectedIds.length === 1 ? "esperto" : "esperti"})`}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
