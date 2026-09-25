"use client"

import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useEffect } from "react"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import { expertiseLevelLabel } from "@/domain/expertise-level"
import type { ResolvedKnownCity } from "./resolved-known-city"

// Le icone di default di Leaflet puntano a percorsi relativi al bundler che
// Turbopack/Webpack non risolvono — le sostituiamo con URL diretti al CDN.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

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
    <MapContainer center={[20, 0]} zoom={2} style={{ height: 400, width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {knownCities.map((known) => (
        <Marker key={known.city.id} position={[known.city.lat, known.city.lng]} icon={markerIcon}>
          <Popup>
            {known.city.name}, {known.city.country} — {expertiseLevelLabel(known.level)}
          </Popup>
        </Marker>
      ))}
      <FitToMarkers knownCities={knownCities} />
    </MapContainer>
  )
}
