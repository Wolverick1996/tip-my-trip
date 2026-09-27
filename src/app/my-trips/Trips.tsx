"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { CityId } from "@/domain/city"
import { deleteTripAction } from "./actions"
import { ContactLinks } from "./ContactLinks"
import { CreateTripModal } from "./CreateTripModal"
import { coverageLabel, type ResolvedTrip } from "./resolved-trip"

export function Trips({ trips, organizerCityIds }: { trips: ResolvedTrip[]; organizerCityIds: CityId[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  function closeModal() {
    setModalOpen(false)
    router.refresh()
  }

  async function handleDelete(trip: ResolvedTrip) {
    if (!window.confirm(`Eliminare il viaggio "${trip.title}"?`)) {
      return
    }
    const result = await deleteTripAction(trip.id)
    if (result.error) {
      window.alert(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="mt-6">
      {trips.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-zinc-500">
          <span aria-hidden className="text-4xl">
            🧳
          </span>
          <p>Nessun viaggio ancora: crea il primo con il pulsante +</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {trips.map((trip) => (
            <li key={trip.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="font-medium">{trip.title}</h2>

              <ul className="mt-2 text-sm">
                {trip.cities.map((city) => (
                  <li key={city.id}>
                    {city.name} <span className="text-zinc-500">— {coverageLabel(city)}</span>
                  </li>
                ))}
              </ul>

              {trip.experts.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">Nessun esperto scelto.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-3">
                  {trip.experts.map((expert) => (
                    <li key={expert.id} className="text-sm">
                      <p className="font-medium">{expert.name}</p>
                      <p className="text-zinc-600 dark:text-zinc-400">Parla {expert.languages.join(", ")}</p>
                      <div className="mt-1">
                        <ContactLinks contact={expert.contact} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => handleDelete(trip)}
                className="mt-4 text-sm text-red-600 hover:underline"
              >
                Elimina viaggio
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white shadow-lg"
        aria-label="Crea un viaggio"
      >
        +
      </button>

      {modalOpen && <CreateTripModal organizerCityIds={organizerCityIds} onClose={closeModal} />}
    </div>
  )
}
