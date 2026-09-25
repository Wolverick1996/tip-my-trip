import type { City } from "@/domain/city"
import type { ExpertiseLevel } from "@/domain/expertise-level"

export interface ResolvedKnownCity {
  city: City
  level: ExpertiseLevel
}
