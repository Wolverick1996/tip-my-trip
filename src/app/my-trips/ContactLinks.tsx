import { Button, Text } from "@mantine/core"
import { IconArrowUpRight, IconBrandWhatsapp, IconMail } from "@tabler/icons-react"
import type { ReactNode } from "react"
import type { TravelerContact } from "@/domain/traveler"

type ContactButtonLabel = {
  text: string
  icon: ReactNode
  ariaLabel?: string
}

function ContactButton({
  href,
  color,
  label,
}: {
  href: string
  color: "mint.9" | "orange.8"
  label: ContactButtonLabel
}) {
  return (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="outline"
      color={color}
      radius="sm"
      size="md"
      h={44}
      leftSection={label.icon}
      rightSection={<IconArrowUpRight size={16} />}
      aria-label={label.ariaLabel}
    >
      {label.text}
    </Button>
  )
}

function whatsAppHref(number: string): string {
  return `https://wa.me/${number.replace(/^\+/, "")}`
}

export function ContactLinks({ contact }: { contact: TravelerContact }) {
  if (!contact.whatsApp && !contact.email) {
    return (
      <Text size="sm" c="dimmed">
        Nessun contatto disponibile.
      </Text>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {contact.whatsApp && (
        <ContactButton
          href={whatsAppHref(contact.whatsApp)}
          color="mint.9"
          label={{
            text: "Scrivi su WhatsApp",
            icon: <IconBrandWhatsapp size={18} />,
            ariaLabel: `Scrivi su WhatsApp al ${contact.whatsApp}`,
          }}
        />
      )}
      {contact.email && (
        <ContactButton
          href={`mailto:${contact.email}`}
          color="orange.8"
          label={{
            text: "Invia email",
            icon: <IconMail size={18} />,
            ariaLabel: `Invia un'email a ${contact.email}`,
          }}
        />
      )}
    </div>
  )
}
