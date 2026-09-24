import { CITIES } from "@/domain/city"
import type { ExpertiseLevel } from "@/domain/expertise-level"

const LEVEL_LABEL: Record<ExpertiseLevel, string> = {
  base: "Base",
  expert: "Expert",
  local: "Local",
}

export function levelLabel(level: ExpertiseLevel): string {
  return LEVEL_LABEL[level]
}

export function cityName(cityId: string): string {
  return CITIES.find((city) => city.id === cityId)?.name ?? cityId
}
