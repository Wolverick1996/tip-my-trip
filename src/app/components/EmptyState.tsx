import type { ReactNode } from "react"
import { Stack, Text } from "@mantine/core"

type EmptyStateProps = {
  icon: ReactNode
  children: ReactNode
}

export function EmptyState({ icon, children }: EmptyStateProps) {
  return (
    <Stack align="center" gap="xs" py="xl" mt="md" c="dimmed">
      {icon}
      <Text ta="center" w="100%">
        {children}
      </Text>
    </Stack>
  )
}
