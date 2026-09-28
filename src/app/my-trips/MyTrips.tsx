"use client"

import { ActionIcon, Badge, Card, Group, Stack, Text, Title } from "@mantine/core"
import { modals } from "@mantine/modals"
import { notifications } from "@mantine/notifications"
import { IconLuggage, IconTrash } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AddActionButton } from "@/app/components/AddActionButton"
import { EmptyState } from "@/app/components/EmptyState"
import { ExpertiseBadge } from "@/app/components/ExpertiseBadge"
import type { CityId } from "@/domain/city"
import { getLanguageFlag, getLanguageName } from "@/domain/language"
import { deleteTripAction } from "./actions"
import { ContactLinks } from "./ContactLinks"
import { CoverageRow } from "./CoverageRow"
import { CreateTripModal } from "./CreateTripModal"
import type { ResolvedTrip } from "./resolved-trip"

export function MyTrips({ trips, organizerCityIds }: { trips: ResolvedTrip[]; organizerCityIds: CityId[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  function closeModal() {
    setModalOpen(false)
  }

  function handleDelete(trip: ResolvedTrip) {
    modals.openConfirmModal({
      title: "Eliminare il viaggio?",
      children: <Text size="sm">Eliminare il viaggio &quot;{trip.title}&quot;?</Text>,
      labels: { confirm: "Elimina", cancel: "Annulla" },
      cancelProps: { "data-autofocus": true },
      confirmProps: { color: "strawberry" },
      onConfirm: async () => {
        const result = await deleteTripAction(trip.id)
        if (result.error) {
          notifications.show({ color: "strawberry", message: result.error })
          return
        }
        router.refresh()
      },
    })
  }

  return (
    <div className="mt-6">
      {trips.length === 0 ? (
        <EmptyState icon={<IconLuggage size={36} stroke={1.5} aria-hidden />}>
          Nessun viaggio ancora: crea il primo con il pulsante +
        </EmptyState>
      ) : (
        <Stack gap="md">
          {trips.map((trip) => (
            <Card key={trip.id} withBorder padding="lg" bg="white">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Title order={2} size="h4" fw={500} className="min-w-0 flex-1">
                  {trip.title}
                </Title>
                <ActionIcon
                  variant="subtle"
                  color="strawberry"
                  className="shrink-0"
                  onClick={() => handleDelete(trip)}
                  aria-label={`Elimina viaggio ${trip.title}`}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>

              <Stack gap={0} mt="xs" role="list" aria-label="Copertura delle città">
                {trip.cities.map((city) => (
                  <CoverageRow
                    key={city.id}
                    cityName={city.name}
                    coveredBy={city.coveredBy}
                    knownByOrganizer={city.knownByOrganizer}
                  />
                ))}
              </Stack>

              {trip.experts.length === 0 ? (
                <Text size="sm" c="dimmed" mt="sm">
                  Nessun esperto scelto.
                </Text>
              ) : (
                <Stack gap="sm" mt="lg">
                  {trip.experts.map((expert) => (
                    <div key={expert.id}>
                      <Text size="md" fw={500}>
                        {expert.name}
                      </Text>
                      <Group gap={4} mt={4} role="group" aria-label="Livello di conoscenza delle città">
                        {expert.knownCities.map((city) => (
                          <ExpertiseBadge key={city.id} level={city.level} cityName={city.name} />
                        ))}
                      </Group>
                      <Group gap={4} mt={4} role="group" aria-label="Lingue in comune">
                        {expert.languages.map((code) => (
                          <Badge key={code} color="lagoon.2" variant="filled" autoContrast>
                            <span className="mr-1">{getLanguageFlag(code)}</span>
                            {getLanguageName(code)}
                          </Badge>
                        ))}
                      </Group>
                      <div className="mt-2">
                        <ContactLinks contact={expert.contact} />
                      </div>
                    </div>
                  ))}
                </Stack>
              )}
            </Card>
          ))}
        </Stack>
      )}

      <AddActionButton label="Crea un viaggio" onClick={() => setModalOpen(true)} />

      {modalOpen && <CreateTripModal organizerCityIds={organizerCityIds} onClose={closeModal} />}
    </div>
  )
}
