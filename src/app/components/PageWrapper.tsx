import type { ReactNode } from "react"

type PageWrapperProps = {
  children: ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">{children}</main>
}
