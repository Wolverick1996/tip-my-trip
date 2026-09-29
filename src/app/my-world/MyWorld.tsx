"use client"

import { ActionIcon, Card, Group, Stack, Text } from "@mantine/core"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import { IconMapPin, IconPencil, IconTrash } from "@tabler/icons-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AddActionButton } from "@/app/components/AddActionButton"
import { EmptyState } from "@/app/components/EmptyState"
import { ExpertiseBadge } from "@/app/components/ExpertiseBadge"
import { AddCityModal } from "./AddCityModal"
import type { ResolvedKnownCity } from "./resolved-known-city"
import { removeKnownCityAction } from "./actions"

// Anche i client component vengono pre-renderizzati sul server, per mandare subito dell'HTML, e poi vengono "idratati" nel browser.
// Leaflet usa `window` appena importato: senza `ssr: false` quel pre-rendering fallirebbe.
const WorldMap = dynamic(() => import("./WorldMap").then((mod) => mod.WorldMap), { ssr: false })

export function MyWorld({ knownCities }: { knownCities: ResolvedKnownCity[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ResolvedKnownCity | null>(null)
  const router = useRouter()

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(entry: ResolvedKnownCity) {
    setEditing(entry)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  function handleSaved() {
    closeModal()
    router.refresh()
  }

  function handleRemove(entry: ResolvedKnownCity) {
    modals.openConfirmModal({
      title: "Rimuovere questa città?",
      children: <Text size="sm">Rimuovere {entry.city.name} dalle città conosciute?</Text>,
      labels: { confirm: "Rimuovi", cancel: "Annulla" },
      cancelProps: { "data-autofocus": true },
      confirmProps: { color: "strawberry" },
      onConfirm: async () => {
        const result = await removeKnownCityAction(entry.city.id)
        if (result.error) {
          notifications.show({ color: "strawberry", message: result.error })
          return
        }
        router.refresh()
      },
    })
  }

  return (
    <div className="relative mt-6">
      <WorldMap knownCities={knownCities} />

      {knownCities.length === 0 ? (
        <EmptyState icon={<IconMapPin size={36} stroke={1.5} aria-hidden />}>
          Aggiungi una città per vederla qui
        </EmptyState>
      ) : (
        <Stack gap="xs" mt="md">
          {knownCities.map((entry) => (
            <Card key={entry.city.id} withBorder padding="sm" bg="white">
              <Group justify="space-between" wrap="nowrap">
                <Text size="sm">
                  {entry.city.name}{" "}
                  <Text component="span" c="dimmed" inherit>
                    — {entry.city.country}
                  </Text>
                </Text>
                <Group gap="xs" wrap="nowrap" className="shrink-0">
                  <ExpertiseBadge level={entry.level} />
                  <ActionIcon
                    variant="subtle"
                    onClick={() => openEdit(entry)}
                    aria-label={`Modifica ${entry.city.name}`}
                  >
                    <IconPencil size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="strawberry"
                    onClick={() => handleRemove(entry)}
                    aria-label={`Rimuovi ${entry.city.name}`}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <AddActionButton label="Aggiungi una città" onClick={openAdd} />

      {modalOpen && (
        <AddCityModal knownCities={knownCities} editing={editing} onClose={closeModal} onSaved={handleSaved} />
      )}
    </div>
  )
}
