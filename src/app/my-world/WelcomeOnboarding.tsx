"use client"

import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { useRouter, useSearchParams } from "next/navigation"

export function WelcomeOnboarding() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const show = searchParams.get("onboarding") === "1"

  function close() {
    router.replace("/my-world")
  }

  return (
    <Modal opened={show} onClose={close} title="Tutto pronto" centered>
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Ora puoi usare l&apos;app: seleziona una città e trova chi la conosce davvero.
        </Text>
        <Group justify="flex-end">
          <Button data-autofocus onClick={close}>
            Inizia
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
