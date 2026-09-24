"use client"

import { useMemo, useState } from "react"
import { allLanguages } from "@/domain/language"
import type { LanguageCode } from "@/domain/language"

const OPTIONS = allLanguages()

export function LanguagePicker({
  selected,
  onChange,
}: {
  selected: LanguageCode[]
  onChange: (next: LanguageCode[]) => void
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return OPTIONS
    return OPTIONS.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.englishName.toLowerCase().includes(q) ||
        lang.code === q,
    )
  }, [query])

  function toggle(code: LanguageCode) {
    onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code])
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((code) => {
            const lang = OPTIONS.find((l) => l.code === code)
            return (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => toggle(code)}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-1 text-sm hover:border-red-400 dark:border-zinc-700"
                >
                  {lang?.flag && <span aria-hidden>{lang.flag}</span>}
                  {lang?.name ?? code}
                  <span aria-hidden className="text-zinc-400">
                    ×
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca una lingua…"
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />

      <ul className="max-h-48 overflow-y-auto rounded border border-zinc-200 dark:border-zinc-800">
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm text-zinc-500">Nessuna lingua trovata.</li>
        )}
        {filtered.map((lang) => (
          <li key={lang.code}>
            <label className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <input type="checkbox" checked={selected.includes(lang.code)} onChange={() => toggle(lang.code)} />
              {lang.flag && <span aria-hidden>{lang.flag}</span>}
              {lang.name}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
