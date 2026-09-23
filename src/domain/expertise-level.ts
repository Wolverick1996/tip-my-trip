export type ExpertiseLevel = "base" | "expert" | "local"

const LEVEL_VALUE: Record<ExpertiseLevel, number> = {
  base: 1,
  expert: 2,
  local: 3,
}

export function expertiseLevelValue(level: ExpertiseLevel): number {
  return LEVEL_VALUE[level]
}
