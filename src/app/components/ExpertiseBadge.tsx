import { Badge } from "@mantine/core"
import { expertiseLevelLabel, type ExpertiseLevel } from "@/domain/expertise-level"
import { expertiseLevelBadgeColor } from "@/app/expertise-level-colors"

export function ExpertiseBadge({ level, cityName }: { level: ExpertiseLevel; cityName?: string }) {
  const label = expertiseLevelLabel(level)

  return (
    <Badge color={expertiseLevelBadgeColor(level)} variant="filled" autoContrast>
      {cityName ? `${cityName} · ${label}` : label}
    </Badge>
  )
}
