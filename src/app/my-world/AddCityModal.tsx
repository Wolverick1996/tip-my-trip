"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import type { CitySearchResult } from "@/app/api/cities/city-search-result"
import { EXPERTISE_LEVELS, expertiseLevelLabel, type ExpertiseLevel } from "@/domain/expertise-level"
import { setKnownCityAction } from "./actions"
import type { ResolvedKnownCity } from "./resolved-known-city"

export function AddCityModal({
  knownCities,
  editing,
  onClose,
}: {
  knownCities: ResolvedKnownCity[]
  editing: ResolvedKnownCity | null
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CitySearchResult[]>([])
  const [searchFailed, setSearchFailed] = useState(false)
  const [searching, startSearch] = useTransition()
  const [selected, setSelected] = useState<CitySearchResult | null>(editing?.city ?? null)
  const [level, setLevel] = useState<ExpertiseLevel | null>(editing?.level ?? null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      return
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      startSearch(async () => {
        try {
          const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          })
          if (!response.ok) {
            setResults([])
            setSearchFailed(true)
            return
          }
          setResults((await response.json()) as CitySearchResult[])
          setSearchFailed(false)
        } catch {
          if (!controller.signal.aborted) {
            setResults([])
            setSearchFailed(true)
          }
        }
      })
    }, 200)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, selected])

  const visibleResults = query.trim().length >= 2 ? results : []

  function handleSelect(city: CitySearchResult) {
    const alreadyKnown = knownCities.find((known) => known.city.id === city.id)
    setSelected(city)
    setLevel(alreadyKnown?.level ?? null)
  }

  function handleBack() {
    setSelected(null)
    setLevel(null)
    setResults([])
    setQuery("")
  }

  async function handleSave() {
    if (!selected || !level) {
      return
    }
    await setKnownCityAction(selected.id, level)
    ref.current?.close()
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="add-city-title"
      className="m-auto w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between">
        <h2 id="add-city-title" className="text-lg font-semibold">
          {editing ? "Modifica città" : "Aggiungi una città"}
        </h2>
        <button type="button" onClick={() => ref.current?.close()} aria-label="Chiudi">
          ✕
        </button>
      </div>

      {!selected ? (
        <div className="mt-4 flex flex-col gap-2">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca una città…"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          {searching && <p className="text-sm text-zinc-500">Cerco…</p>}
          {!searching && searchFailed && (
            <p className="text-sm text-red-600">Ricerca non disponibile, riprova.</p>
          )}
          {!searching && !searchFailed && query.trim().length >= 2 && visibleResults.length === 0 && (
            <p className="text-sm text-zinc-500">Nessuna città trovata.</p>
          )}
          <ul className="max-h-48 overflow-y-auto">
            {visibleResults.map((city) => {
              const alreadyKnown = knownCities.find((known) => known.city.id === city.id)
              return (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(city)}
                    className="w-full rounded px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    {city.name}, {city.country}
                    {alreadyKnown && (
                      <span className="ml-2 text-xs text-zinc-500">
                        Già aggiunta · {expertiseLevelLabel(alreadyKnown.level)}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm">
            {selected.name}, {selected.country}
          </p>
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium">Livello di conoscenza</legend>
            {EXPERTISE_LEVELS.map((candidateLevel) => (
              <label key={candidateLevel} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="level"
                  checked={level === candidateLevel}
                  onChange={() => setLevel(candidateLevel)}
                />
                {expertiseLevelLabel(candidateLevel)}
              </label>
            ))}
          </fieldset>
          <div className="flex items-center justify-between">
            <button type="button" onClick={handleBack} className="text-sm text-zinc-500 hover:underline">
              ← Cambia città
            </button>
            <button
              type="button"
              disabled={!level}
              onClick={handleSave}
              className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Salva
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
