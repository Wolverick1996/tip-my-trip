"use client"

import { MultiSelect } from "@mantine/core"
import { useState } from "react"
import { allLanguages } from "@/domain/language"
import type { LanguageCode } from "@/domain/language"

const availableLanguages = allLanguages()
const languageOptions = availableLanguages.map((lang) => ({
  value: lang.code,
  label: lang.flag ? `${lang.flag} ${lang.name}` : lang.name,
}))
const languageByCode = new Map(availableLanguages.map((lang) => [lang.code, lang]))

export function LanguagePicker({
  label,
  selected,
  onChange,
}: {
  label: string
  selected: LanguageCode[]
  onChange: (next: LanguageCode[]) => void
}) {
  const [dropdownOpened, setDropdownOpened] = useState(false)

  return (
    <MultiSelect
      label={label}
      data={languageOptions}
      value={selected}
      dropdownOpened={dropdownOpened}
      onDropdownOpen={() => setDropdownOpened(true)}
      onDropdownClose={() => setDropdownOpened(false)}
      onChange={(codes) => {
        setDropdownOpened(false)
        onChange(codes as LanguageCode[])
      }}
      className="w-full"
      placeholder="Cerca una lingua…"
      searchable
      nothingFoundMessage="Nessuna lingua trovata."
      filter={({ options, search }) => {
        const query = search.trim().toLowerCase()
        if (!query) return options
        return options.filter((option) => {
          if (!("value" in option)) return false
          const lang = languageByCode.get(option.value as LanguageCode)
          return (
            lang?.name.toLowerCase().includes(query) ||
            lang?.englishName.toLowerCase().includes(query) ||
            lang?.code === query
          )
        })
      }}
    />
  )
}
