"use client"

import {
  ActionIcon,
  Alert,
  Button,
  Chip,
  Group,
  Loader,
  Modal,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { modals } from "@mantine/modals"
import { IconAlertCircle, IconArrowLeft } from "@tabler/icons-react"
import { useState } from "react"
import type { CitySearchResult } from "@/app/api/cities/city-search-result"
import { useCitySearch } from "@/app/hooks/use-city-search"
import { EXPERTISE_LEVELS, expertiseLevelLabel, type ExpertiseLevel } from "@/domain/expertise-level"
import { expertiseLevelBadgeColor, expertiseLevelChipOutlineColor } from "@/app/lib/expertise-level-colors"
import { setKnownCityAction } from "./actions"
import type { ResolvedKnownCity } from "./resolved-known-city"

export function AddCityModal({
  knownCities,
  editing,
  onClose,
  onSaved,
}: {
  knownCities: ResolvedKnownCity[]
  editing: ResolvedKnownCity | null
  onClose: () => void
  onSaved: () => void
}) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<CitySearchResult | null>(editing?.city ?? null)
  const [level, setLevel] = useState<ExpertiseLevel | null>(editing?.level ?? null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { results: visibleResults, searching, searchFailed, canSearch } = useCitySearch(query, !selected)

  function handleSelect(city: CitySearchResult) {
    const alreadyKnown = knownCities.find((known) => known.city.id === city.id)
    setSaveError(null)
    setSelected(city)
    setLevel(alreadyKnown?.level ?? null)
  }

  function handleBack() {
    setSaveError(null)
    setSelected(null)
    setLevel(null)
    setQuery("")
  }

  function requestClose() {
    if (!selected) {
      onClose()
      return
    }
    modals.openConfirmModal({
      title: editing ? "Scartare le modifiche?" : "Scartare questa città?",
      children: <Text size="sm">La selezione andrà persa.</Text>,
      labels: { confirm: "Scarta", cancel: "Annulla" },
      cancelProps: { "data-autofocus": true },
      confirmProps: { color: "strawberry" },
      onConfirm: onClose,
    })
  }

  async function handleSave() {
    if (!selected || !level) {
      return
    }
    setSaving(true)
    try {
      const result = await setKnownCityAction({ cityId: selected.id, level })
      if (result.error) {
        setSaveError(result.error)
        return
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      opened
      onClose={requestClose}
      title={
        <Group gap={4} wrap="nowrap">
          {selected && !editing && (
            <ActionIcon variant="subtle" onClick={handleBack} aria-label="Torna alla ricerca città">
              <IconArrowLeft size={18} />
            </ActionIcon>
          )}
          <Text span>{editing ? "Modifica città" : "Aggiungi una città"}</Text>
        </Group>
      }
    >
      {!selected ? (
        <Stack gap="xs">
          <TextInput
            autoFocus
            data-autofocus
            label="Cerca una città"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Cerca una città…"
            rightSection={searching ? <Loader size="xs" /> : null}
          />
          {!searching && searchFailed && (
            <Text size="sm" c="strawberry">
              Ricerca non disponibile, riprova.
            </Text>
          )}
          {!searching && !searchFailed && canSearch && visibleResults.length === 0 && (
            <Text size="sm" c="dimmed">
              Nessuna città trovata.
            </Text>
          )}
          <ScrollArea.Autosize>
            {visibleResults.map((city) => {
              const alreadyKnown = knownCities.find((known) => known.city.id === city.id)
              return (
                <NavLink
                  component="button"
                  type="button"
                  key={city.id}
                  label={`${city.name}, ${city.country}`}
                  description={alreadyKnown ? `Già aggiunta · ${expertiseLevelLabel(alreadyKnown.level)}` : undefined}
                  onClick={() => handleSelect(city)}
                />
              )
            })}
          </ScrollArea.Autosize>
        </Stack>
      ) : (
        <Stack gap="sm">
          <Text size="sm">
            {selected.name}, {selected.country}
          </Text>
          <Chip.Group value={level} onChange={(value) => setLevel(value as ExpertiseLevel)}>
            <Text size="sm" fw={500}>
              Livello di conoscenza
            </Text>
            <Group gap="xs">
              {EXPERTISE_LEVELS.map((candidateLevel) => (
                <Chip
                  key={candidateLevel}
                  value={candidateLevel}
                  autoFocus={candidateLevel === EXPERTISE_LEVELS[0]}
                  data-autofocus={candidateLevel === EXPERTISE_LEVELS[0] ? true : undefined}
                  color={
                    level === candidateLevel
                      ? expertiseLevelBadgeColor(candidateLevel)
                      : expertiseLevelChipOutlineColor(candidateLevel)
                  }
                  variant={level === candidateLevel ? "filled" : "outline"}
                  autoContrast
                >
                  {expertiseLevelLabel(candidateLevel)}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
          {saveError && (
            <Alert color="strawberry" icon={<IconAlertCircle size={16} />} aria-live="polite">
              {saveError}
            </Alert>
          )}
          <Group justify="flex-end">
            <Button disabled={!level || saving} loading={saving} onClick={handleSave}>
              Salva
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
