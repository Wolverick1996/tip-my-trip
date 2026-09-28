"use client"

import { Button, Group } from "@mantine/core"
import { IconLuggage, IconWorld } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/my-world", label: "Il mio mondo", icon: IconWorld },
  { href: "/my-trips", label: "I miei viaggi", icon: IconLuggage },
]

export function MainNav() {
  const pathname = usePathname()

  if (pathname === "/register") {
    return null
  }

  return (
    <Group component="nav" aria-label="Navigazione principale" justify="center" py="md">
      <Group bg="white" p={4} gap={4} className="rounded-full">
        {LINKS.map((link) => {
          const active = pathname === link.href
          return (
            <Button
              key={link.href}
              component={Link}
              href={link.href}
              aria-current={active ? "page" : undefined}
              variant={active ? "filled" : "subtle"}
              color={active ? "lagoon" : "cream"}
              radius="xl"
              size="md"
              leftSection={<link.icon size={16} />}
            >
              {link.label}
            </Button>
          )
        })}
      </Group>
    </Group>
  )
}
