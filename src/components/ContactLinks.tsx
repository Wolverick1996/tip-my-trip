import type { TravelerContact } from "@/domain/traveler"

function whatsappHref(number: string): string {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}`
}

export function ContactLinks({ contact }: { contact: TravelerContact }) {
  if (!contact.whatsapp && !contact.email) {
    return <p className="text-sm text-zinc-500">Nessun contatto disponibile.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {contact.whatsapp && (
        <li>
          <a
            href={whatsappHref(contact.whatsapp)}
            className="inline-flex items-center gap-2 text-green-700 hover:underline"
          >
            <span aria-hidden>💬</span> WhatsApp
          </a>
        </li>
      )}
      {contact.email && (
        <li>
          <a
            href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-2 text-blue-700 hover:underline"
          >
            <span aria-hidden>✉️</span> {contact.email}
          </a>
        </li>
      )}
    </ul>
  )
}
