import { useEffect, useState, useTransition } from "react"
import type { CitySearchResult } from "@/app/api/cities/city-search-result"

const MIN_QUERY_LENGTH = 2

type CitySearchState = {
  query: string
  results: CitySearchResult[]
  failed: boolean
}

export function useCitySearch(query: string, searchEnabled = true) {
  const [state, setState] = useState<CitySearchState>({
    query: "",
    results: [],
    failed: false,
  })
  const [isPending, startSearch] = useTransition()
  const canSearch = searchEnabled && query.trim().length >= MIN_QUERY_LENGTH
  const hasCurrentResults = canSearch && state.query === query
  const results = hasCurrentResults ? state.results : []
  const searchFailed = hasCurrentResults && state.failed
  const searching = canSearch && (!hasCurrentResults || isPending)

  useEffect(() => {
    if (!canSearch) {
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
            setState({ query, results: [], failed: true })
            return
          }
          setState({
            query,
            results: (await response.json()) as CitySearchResult[],
            failed: false,
          })
        } catch {
          if (!controller.signal.aborted) {
            setState({ query, results: [], failed: true })
          }
        }
      })
    }, 200)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, canSearch])

  return { results, searching, searchFailed, canSearch }
}
