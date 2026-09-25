"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { expertiseLevelLabel } from "@/domain/expertise-level"
import { AddCityModal } from "./AddCityModal"
import type { ResolvedKnownCity } from "./resolved-known-city"
import { removeKnownCityAction } from "./actions"

// Anche i client component vengono pre-renderizzati sul server, per mandare subito dell'HTML, e poi vengono
// "idratati" nel browser. Leaflet usa `window` appena importato: senza `ssr: false` quel pre-rendering fallirebbe.
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
    router.refresh()
  }

  async function handleRemove(entry: ResolvedKnownCity) {
    if (!window.confirm(`Rimuovere ${entry.city.name} dalle città conosciute?`)) {
      return
    }
    await removeKnownCityAction(entry.city.id)
    router.refresh()
  }

  return (
    <div className="relative mt-6">
      <WorldMap knownCities={knownCities} />

      {knownCities.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center text-zinc-500">
          <span aria-hidden className="text-4xl">
            📍
          </span>
          <p>Aggiungi una città per vederla qui</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {knownCities.map((entry) => (
            <li
              key={entry.city.id}
              className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <span className="text-sm">
                {entry.city.name} <span className="text-zinc-500">— {entry.city.country}</span>{" "}
                <span className="text-zinc-500">({expertiseLevelLabel(entry.level)})</span>
              </span>
              <span className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(entry)}
                  aria-label={`Modifica ${entry.city.name}`}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(entry)}
                  aria-label={`Rimuovi ${entry.city.name}`}
                >
                  🗑️
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white shadow-lg"
        aria-label="Aggiungi una città"
      >
        +
      </button>

      {modalOpen && <AddCityModal knownCities={knownCities} editing={editing} onClose={closeModal} />}
    </div>
  )
}
