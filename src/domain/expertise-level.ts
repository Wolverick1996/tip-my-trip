export type ExpertiseLevel = "base" | "expert" | "local"

export const EXPERTISE_LEVELS: ExpertiseLevel[] = ["base", "expert", "local"]

const LEVEL_VALUE: Record<ExpertiseLevel, number> = {
  base: 1,
  expert: 2,
  local: 3,
}

const LEVEL_LABEL: Record<ExpertiseLevel, string> = {
  base: "Base",
  expert: "Expert",
  local: "Local",
}

export function expertiseLevelValue(level: ExpertiseLevel): number {
  return LEVEL_VALUE[level]
}

export function expertiseLevelLabel(level: ExpertiseLevel): string {
  return LEVEL_LABEL[level]
}
