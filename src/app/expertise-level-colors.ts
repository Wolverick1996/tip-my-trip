import type { ExpertiseLevel } from "@/domain/expertise-level"

export function expertiseLevelBadgeColor(level: ExpertiseLevel): string {
  switch (level) {
    case "base":
      return "cream.4"
    case "expert":
      return "coconut.8"
    case "local":
      return "mint.8"
  }
}

export function expertiseLevelChipOutlineColor(level: ExpertiseLevel): string {
  switch (level) {
    case "base":
      return "cream.6"
    case "expert":
      return "coconut.9"
    case "local":
      return "mint.8"
  }
}

export function expertiseLevelMapMarkerColor(level: ExpertiseLevel): string {
  switch (level) {
    case "base":
      return "var(--mantine-color-cream-5)"
    case "expert":
      return "var(--mantine-color-coconut-8)"
    case "local":
      return "var(--mantine-color-mint-8)"
  }
}