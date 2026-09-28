"use client"

import {
  ActionIcon,
  Alert,
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Stack,
  Stepper,
  Text,
  TextInput,
} from "@mantine/core"
import { modals } from "@mantine/modals"
import { IconAlertCircle, IconArrowLeft } from "@tabler/icons-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { CitySearchResult } from "@/app/api/cities/city-search-result"
import type { TripMatch } from "@/app/api/trip-matches/trip-match"
import { ExpertiseBadge } from "@/app/components/ExpertiseBadge"
import { useCitySearch } from "@/app/hooks/use-city-search"
import type { CityId } from "@/domain/city"
import { getLanguageName } from "@/domain/language"
import { cityCoverage, tripTitle } from "@/domain/trip"
import { createTripAction } from "./actions"
import { CoverageRow } from "./CoverageRow"

type Step = "cities" | "experts"
type MatchesState = { status: "loading" } | { status: "loaded"; matches: TripMatch[] } | { status: "failed" }

function MatchOption({
  match,
  cityCount,
  cityName,
  selected,
  onToggle,
}: {
  match: TripMatch
  cityCount: number
  cityName: (cityId: CityId) => string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <Checkbox.Card
      checked={selected}
      onClick={onToggle}
      p="md"
      radius="sm"
      classNames={{
        card: selected
          ? "bg-(--mantine-color-lagoon-0) border-(--mantine-color-lagoon-8)"
          : undefined,
      }}
    >
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <Checkbox.Indicator mt={2} color="lagoon" />
        <div className="flex-1">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              {match.name}
            </Text>
            <Text size="sm" c="dimmed">
              {match.score}/100
            </Text>
          </Group>
          <Group gap={4} mt={2}>
            <Text size="sm" c="dimmed">
              {match.matchedCities.length}/{cityCount} città:
            </Text>
            {match.matchedCities.map((matched) => (
              <ExpertiseBadge
                key={matched.cityId}
                level={matched.level}
                cityName={cityName(matched.cityId)}
              />
            ))}
          </Group>
          <Text size="sm" c="dimmed">
            Parla {match.sharedLanguages.map(getLanguageName).join(", ")}
          </Text>
        </div>
      </Group>
    </Checkbox.Card>
  )
}

export function CreateTripModal({
  organizerCityIds,
  onClose,
}: {
  organizerCityIds: CityId[]
  onClose: () => void
}) {
  const router = useRouter()

  const [step, setStep] = useState<Step>("cities")
  const [query, setQuery] = useState("")
  const [cityDropdownOpened, setCityDropdownOpened] = useState(false)
  const [cities, setCities] = useState<CitySearchResult[]>([])
  const [title, setTitle] = useState("")
  const [matchesState, setMatchesState] = useState<MatchesState>({ status: "loading" })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  const { results, searching, searchFailed, canSearch } = useCitySearch(query, step === "cities")
  const cityName = (cityId: CityId) => cities.find((city) => city.id === cityId)?.name ?? cityId
  const defaultTitle = tripTitle({ cityIds: cities.map((city) => city.id) }, cityName)

  const cityData = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>()
    for (const city of cities) map.set(city.id, { value: city.id, label: `${city.name}, ${city.country}` })
    for (const city of results) {
      if (!map.has(city.id)) map.set(city.id, { value: city.id, label: `${city.name}, ${city.country}` })
    }
    return [...map.values()]
  }, [cities, results])

  useEffect(() => {
    if (step !== "experts") {
      return
    }
    const controller = new AbortController()
    fetch(`/api/trip-matches?cityIds=${cities.map((city) => city.id).join(",")}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/register")
          return
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const found = (await response.json()) as TripMatch[]
        setMatchesState({ status: "loaded", matches: found })
        setSelectedIds((current) => current.filter((id) => found.some((match) => match.id === id)))
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMatchesState({ status: "failed" })
        }
      })
    return () => controller.abort()
  }, [step, cities, router])

  function requestClose() {
    if (cities.length === 0) {
      onClose()
      return
    }
    modals.openConfirmModal({
      title: "Scartare questo viaggio?",
      children: <Text size="sm">Le città e gli esperti selezionati andranno persi.</Text>,
      labels: { confirm: "Scarta", cancel: "Annulla" },
      cancelProps: { "data-autofocus": true },
      confirmProps: { color: "strawberry" },
      onConfirm: onClose,
    })
  }

  function handleCitiesChange(ids: string[]) {
    setCityDropdownOpened(false)
    setCities((current) => {
      const kept = current.filter((city) => ids.includes(city.id))
      const addedIds = ids.filter((id) => !current.some((city) => city.id === id))
      const added = addedIds
        .map((id) => results.find((city) => city.id === id))
        .filter((city): city is CitySearchResult => city !== undefined)
      return [...kept, ...added]
    })
  }

  function goToExperts() {
    setMatchesState({ status: "loading" })
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
        expertIds: selectedExpertIds,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  const matchingResults = matchesState.status === "loaded" ? matchesState.matches : []
  const selectedExpertIds = matchesState.status === "loaded" ? selectedIds : []
  const selectedMatches = matchingResults.filter((match) => selectedIds.includes(match.id))
  const coverage = cityCoverage(
    cities.map((city) => city.id),
    selectedMatches.map((match) => ({ id: match.id, cityIds: match.matchedCities.map((matched) => matched.cityId) })),
    organizerCityIds,
  )
  const matchName = (id: string) => matchingResults.find((match) => match.id === id)?.name ?? id
  const hasExpertsFor = (cityId: CityId) =>
    matchingResults.some((match) => match.matchedCities.some((matched) => matched.cityId === cityId))

  const nothingFoundMessage = searching ? "Cerco…" : searchFailed ? "Ricerca non disponibile, riprova." : "Nessuna città trovata."

  return (
    <Modal
      opened
      onClose={requestClose}
      title={
        <Group gap={4} wrap="nowrap">
          {step === "experts" && (
            <ActionIcon
              variant="subtle"
              size="md"
              onClick={() => setStep("cities")}
              aria-label="Torna alla selezione delle città"
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
          )}
          <Text component="span">
            {step === "cities" ? "Passo 1 di 2 · Città" : "Passo 2 di 2 · Esperti"}
          </Text>
        </Group>
      }
      size="lg"
    >
      <Stepper
        active={step === "cities" ? 0 : 1}
        size="sm"
        mb="md"
        allowNextStepsSelect={false}
        className="trip-stepper"
        classNames={{ stepIcon: "trip-stepper-icon" }}
      >
        <Stepper.Step label="Città" />
        <Stepper.Step label="Esperti" />
      </Stepper>

      {step === "cities" ? (
        <Stack gap="sm">
          <MultiSelect
            autoFocus
            data-autofocus
            label="Città del viaggio"
            data={cityData}
            value={cities.map((city) => city.id)}
            onChange={handleCitiesChange}
            dropdownOpened={cityDropdownOpened}
            onDropdownOpen={() => setCityDropdownOpened(true)}
            onDropdownClose={() => setCityDropdownOpened(false)}
            searchValue={query}
            onSearchChange={setQuery}
            searchable
            placeholder="Cerca una città…"
            aria-label="Cerca una città"
            rightSection={searching ? <Loader size="xs" /> : null}
            nothingFoundMessage={canSearch ? nothingFoundMessage : null}
          />

          <TextInput
            label="Titolo (facoltativo)"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder={defaultTitle || "Es. Trasferta a Madrid"}
          />

          <Group justify="flex-end">
            <Button disabled={cities.length === 0} onClick={goToExperts}>
              Avanti
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="sm">
          <Stack gap={0} role="list" aria-label="Copertura delle città" aria-live="polite">
            {coverage.map((city) => (
              <CoverageRow
                key={city.cityId}
                cityName={cityName(city.cityId)}
                coveredBy={city.coveredBy.map(matchName)}
                knownByOrganizer={city.knownByOrganizer}
                noExperts={matchesState.status === "loaded" && !hasExpertsFor(city.cityId)}
              />
            ))}
          </Stack>

          <>
            {matchesState.status === "loading" && (
              <Text size="sm" c="dimmed">
                Cerco esperti…
              </Text>
            )}
            {matchesState.status === "failed" && (
              <Text size="sm" c="strawberry">
                Ricerca esperti non disponibile. Puoi salvare senza esperti.
              </Text>
            )}
            {matchesState.status === "loaded" && matchesState.matches.length === 0 && (
              <Text size="sm" c="dimmed">
                Nessun esperto per queste città, al momento.
              </Text>
            )}
            {matchesState.status === "loaded" && matchesState.matches.length > 0 && (
              <Stack gap="xs">
                {matchesState.matches.map((match) => {
                  const selected = selectedIds.includes(match.id)

                  return (
                    <MatchOption
                      key={match.id}
                      match={match}
                      cityCount={cities.length}
                      cityName={cityName}
                      selected={selected}
                      onToggle={() => toggleExpert(match.id)}
                    />
                  )
                })}
              </Stack>
            )}
          </>

          {error && (
            <Alert color="strawberry" icon={<IconAlertCircle size={16} />} aria-live="polite">
              {error}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button disabled={saving || matchesState.status === "loading"} loading={saving} onClick={save}>
              {selectedExpertIds.length === 0
                ? "Salva senza esperti"
                : `Salva viaggio (${selectedExpertIds.length} ${selectedExpertIds.length === 1 ? "esperto" : "esperti"})`}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
