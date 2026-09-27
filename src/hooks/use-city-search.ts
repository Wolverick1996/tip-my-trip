import { useEffect, useState, useTransition } from "react"
import type { CitySearchResult } from "@/app/api/cities/city-search-result"

const MIN_QUERY_LENGTH = 2

export function useCitySearch(query: string, enabled = true) {
  const [results, setResults] = useState<CitySearchResult[]>([])
  const [searchFailed, setSearchFailed] = useState(false)
  const [searching, startSearch] = useTransition()
  const active = enabled && query.trim().length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (!active) {
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
  }, [query, active])

  return { results: active ? results : [], searching, searchFailed: active && searchFailed, active }
}
