"use client"

import { Paper, Text } from "@mantine/core"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect } from "react"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import { EXPERTISE_LEVELS, expertiseLevelLabel, type ExpertiseLevel } from "@/domain/expertise-level"
import { expertiseLevelMapMarkerColor } from "@/app/expertise-level-colors"
import type { ResolvedKnownCity } from "./resolved-known-city"

const LEVEL_BAR_COUNT: Record<ExpertiseLevel, number> = {
  base: 1,
  expert: 2,
  local: 3,
}

const EXPERTISE_LEGEND = EXPERTISE_LEVELS.map((level) => ({ level, label: expertiseLevelLabel(level) }))

function levelBars(level: ExpertiseLevel, width = 6): string {
  const count = LEVEL_BAR_COUNT[level]
  const gap = 2.5
  const firstY = 12.5 - ((count - 1) * gap) / 2
  return Array.from(
    { length: count },
    (_, index) => `<rect x="${12.5 - width / 2}" y="${firstY + index * gap - 0.75}" width="${width}" height="1.5" rx="0.75" fill="var(--mantine-color-text)"/>`,
  ).join("")
}

function buildMarkerSvg(level: ExpertiseLevel): string {
  return `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg" style="overflow: visible">
    <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5s12.5-19.1 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${expertiseLevelMapMarkerColor(level)}" stroke="var(--mantine-color-white)" stroke-width="1.5" style="filter: drop-shadow(0 1px 1px var(--mantine-color-cream-6))"/>
    <circle cx="12.5" cy="12.5" r="5.5" fill="white"/>
    ${levelBars(level)}
  </svg>`
}

function buildMarkerIcon(level: ExpertiseLevel) {
  return L.divIcon({
    className: "",
    html: buildMarkerSvg(level),
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
  })
}

const markerIcons: Record<ExpertiseLevel, L.DivIcon> = {
  base: buildMarkerIcon("base"),
  expert: buildMarkerIcon("expert"),
  local: buildMarkerIcon("local"),
}

function FitToMarkers({ knownCities }: { knownCities: ResolvedKnownCity[] }) {
  const map = useMap()

  useEffect(() => {
    if (knownCities.length === 0) {
      return
    }
    if (knownCities.length === 1) {
      map.setView([knownCities[0].city.lat, knownCities[0].city.lng], 10)
      return
    }
    map.fitBounds(
      L.latLngBounds(knownCities.map((known) => [known.city.lat, known.city.lng])),
      { padding: [40, 40] },
    )
  }, [knownCities, map])

  return null
}

export function WorldMap({ knownCities }: { knownCities: ResolvedKnownCity[] }) {
  return (
    <Paper radius="lg" style={{ overflow: "hidden" }}>
      <div className="relative z-0">
        <MapContainer center={[20, 0]} zoom={2} style={{ height: 400, width: "100%", zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {knownCities.map((known) => {
            const levelLabel = expertiseLevelLabel(known.level)
            const cityLabel = `${known.city.name}, livello ${levelLabel}`

            return (
              <Marker
                key={known.city.id}
                position={[known.city.lat, known.city.lng]}
                icon={markerIcons[known.level]}
                title={cityLabel}
                alt={cityLabel}
              >
                <Popup>
                  {known.city.name}, {known.city.country} — {levelLabel}
                </Popup>
              </Marker>
            )
          })}
          <FitToMarkers knownCities={knownCities} />
        </MapContainer>

        <Paper
          className="absolute right-3 top-3 z-10"
          radius="md"
          p="xs"
          bg="cream.0"
          shadow="sm"
          aria-label="Legenda livelli di conoscenza"
        >
          {EXPERTISE_LEGEND.map(({ level, label }) => (
            <div key={level} className="flex items-center gap-2 py-0.5">
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                style={{ backgroundColor: expertiseLevelMapMarkerColor(level) }}
                aria-hidden
              >
                <span
                  className="flex h-3 w-3 flex-col items-center justify-center gap-px rounded-full bg-(--mantine-color-white)"
                >
                  {Array.from({ length: LEVEL_BAR_COUNT[level] }, (_, index) => (
                    <span key={index} className="h-px w-2 bg-(--mantine-color-text)" />
                  ))}
                </span>
              </span>
              <Text size="xs" fw={500}>
                {label}
              </Text>
            </div>
          ))}
        </Paper>
      </div>
    </Paper>
  )
}
