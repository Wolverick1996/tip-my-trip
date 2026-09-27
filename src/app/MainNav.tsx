"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/my-world", label: "Il mio mondo" },
  { href: "/my-trips", label: "I miei viaggi" },
]

export function MainNav() {
  const pathname = usePathname()

  if (pathname === "/register") {
    return null
  }

  return (
    <nav aria-label="Navigazione principale" className="border-b border-zinc-200 dark:border-zinc-800">
      <ul className="mx-auto flex max-w-2xl gap-6 px-6 py-3 text-sm">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="aria-[current=page]:font-semibold hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
