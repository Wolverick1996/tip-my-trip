"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import type { LanguageCode } from "@/domain/language"
import { registerAction, type RegisterFormState } from "./actions"
import { LanguagePicker } from "./LanguagePicker"

const initialState: RegisterFormState = { success: false }

export function RegisterForm() {
  const [state, setState] = useState(initialState)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const [name, setName] = useState("")
  const [languages, setLanguages] = useState<LanguageCode[]>([])
  const [whatsApp, setWhatsApp] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (state.success) {
      router.replace("/?onboarding=1")
    }
  }, [state.success, router])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set("name", name)
    for (const code of languages) formData.append("languages", code)
    formData.set("whatsApp", whatsApp)
    formData.set("email", email)
    startTransition(async () => {
      setState(await registerAction(formData))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      {state.error && (
        <p
          aria-live="polite"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nome</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Lingue parlate</span>
        <LanguagePicker selected={languages} onChange={setLanguages} />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">WhatsApp</span>
        <PhoneInput
          international
          defaultCountry="IT"
          value={whatsApp}
          onChange={(value) => setWhatsApp(value ?? "")}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <p className="text-xs text-zinc-500">Indica almeno un contatto tra WhatsApp ed email.</p>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Registrazione…" : "Registrati"}
      </button>
    </form>
  )
}
