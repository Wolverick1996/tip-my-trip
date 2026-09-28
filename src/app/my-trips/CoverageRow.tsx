import { Group, Text } from "@mantine/core"
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from "@tabler/icons-react"

export function CoverageRow({
  cityName,
  coveredBy,
  knownByOrganizer,
  noExperts = false,
}: {
  cityName: string
  coveredBy: string[]
  knownByOrganizer: boolean
  noExperts?: boolean
}) {
  const covered = coveredBy.length > 0
  const details = [
    ...(covered ? coveredBy : []),
    ...(knownByOrganizer
      ? [covered ? "La conosci anche tu" : "La conosci tu"]
      : []),
    ...(!covered && noExperts ? ["Nessun esperto disponibile"] : []),
  ]
  const status = covered
    ? { color: "mint.8", icon: <IconCircleCheck size={17} aria-hidden /> }
    : knownByOrganizer
      ? { color: "cream.7", icon: <IconInfoCircle size={17} aria-hidden /> }
      : { color: "orange.8", icon: <IconAlertTriangle size={17} aria-hidden /> }

  return (
    <div
      role="listitem"
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-(--mantine-color-cream-3) py-2 last:border-b-0"
    >
      <div className="min-w-0">
        <Text size="md" fw={500}>
          {cityName}
        </Text>
        {details.length > 0 && (
          <Text size="sm" c="dimmed">
            {details.map((detail, index) => (
              <span key={detail}>
                {index > 0 && " · "}
                <span className="whitespace-nowrap">{detail}</span>
              </span>
            ))}
          </Text>
        )}
      </div>
      <Group gap={6} wrap="nowrap" c={status.color}>
        {status.icon}
        <Text size="sm" fw={600}>
          {covered ? "Coperta" : "Scoperta"}
        </Text>
      </Group>
    </div>
  )
}