"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

export function WelcomeOnboarding() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ref = useRef<HTMLDialogElement>(null)
  const show = searchParams.get("onboarding") === "1"

  useEffect(() => {
    if (show) {
      ref.current?.showModal()
    }
  }, [show])

  if (!show) {
    return null
  }

  return (
    <dialog
      ref={ref}
      onClose={() => router.replace("/my-world")}
      aria-labelledby="onboarding-title"
      className="m-auto w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="onboarding-title" className="text-lg font-semibold">
        Tutto pronto
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Ora puoi usare l&apos;app: seleziona una città e trova chi la conosce davvero.
      </p>
      <button
        type="button"
        onClick={() => ref.current?.close()}
        className="mt-6 w-full rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Inizia
      </button>
    </dialog>
  )
}
