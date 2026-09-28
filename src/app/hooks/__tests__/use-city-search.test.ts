import { act, renderHook } from "@testing-library/react"
import type { CitySearchResult } from "@/app/api/cities/city-search-result"
import { useCitySearch } from "../use-city-search"

const madrid: CitySearchResult = { id: "1", name: "Madrid", country: "Spagna" }
const roma: CitySearchResult = { id: "2", name: "Roma", country: "Italia" }

// Una Promise che si risolve/rifiuta da fuori, quando vogliamo noi: serve a controllare l'ordine di arrivo di due fetch.
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  jest.useFakeTimers()
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

test("con meno di 2 caratteri non cerca", async () => {
  const { result } = renderHook(({ query }) => useCitySearch(query), { initialProps: { query: "m" } })

  await act(async () => {
    await jest.advanceTimersByTimeAsync(200)
  })

  expect(result.current.canSearch).toBe(false)
  expect(fetch).not.toHaveBeenCalled()
})

test("dopo il debounce cerca e restituisce i risultati", async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [madrid] } as Response)

  const { result } = renderHook(({ query }) => useCitySearch(query), { initialProps: { query: "madr" } })

  await act(async () => {
    await jest.advanceTimersByTimeAsync(200)
  })

  expect(fetch).toHaveBeenCalledWith("/api/cities?q=madr", expect.objectContaining({ signal: expect.anything() }))
  expect(result.current.results).toEqual([madrid])
  expect(result.current.searchFailed).toBe(false)
})

test("digitare prima che scada il debounce annulla la ricerca precedente, non ancora partita", async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [roma] } as Response)

  const { rerender } = renderHook(({ query }) => useCitySearch(query), { initialProps: { query: "ro" } })
  await act(async () => {
    await jest.advanceTimersByTimeAsync(100)
  })
  rerender({ query: "roma" })
  await act(async () => {
    await jest.advanceTimersByTimeAsync(200)
  })

  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch).toHaveBeenCalledWith("/api/cities?q=roma", expect.anything())
})

test("una richiesta rimasta indietro non sovrascrive i risultati di una ricerca più recente", async () => {
  const first = deferred<Response>()
  const second = deferred<Response>()
  jest.mocked(fetch).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

  const { result, rerender } = renderHook(({ query }) => useCitySearch(query), { initialProps: { query: "ro" } })
  await act(async () => {
    await jest.advanceTimersByTimeAsync(200)
  })

  rerender({ query: "roma" })
  await act(async () => {
    await jest.advanceTimersByTimeAsync(200)
  })

  await act(async () => {
    first.reject(new DOMException("Aborted", "AbortError")) // simula il fetch della query vecchia, annullato
    second.resolve({ ok: true, json: async () => [roma] } as Response)
    await Promise.resolve()
  })

  expect(result.current.results).toEqual([roma])
  expect(result.current.searchFailed).toBe(false)
})

test("una risposta non ok svuota i risultati e segnala l'errore, senza far propagare l'eccezione", async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: false } as Response)

  const { result } = renderHook(({ query }) => useCitySearch(query), { initialProps: { query: "xx" } })

  await act(async () => {
    await jest.advanceTimersByTimeAsync(200)
  })

  expect(result.current.results).toEqual([])
  expect(result.current.searchFailed).toBe(true)
})
