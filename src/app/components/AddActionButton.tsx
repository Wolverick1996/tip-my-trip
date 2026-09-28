import { ActionIcon } from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"

export function AddActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <ActionIcon
      size={56}
      radius="xl"
      onClick={onClick}
      className="fixed bottom-6 right-6 shadow-lg"
      aria-label={label}
    >
      <IconPlus size={28} />
    </ActionIcon>
  )
}