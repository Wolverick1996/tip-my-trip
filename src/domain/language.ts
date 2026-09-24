import { Schema } from "effect"
import ISO6391 from "iso-639-1"

export type LanguageCode = string

export interface LanguageOption {
  code: LanguageCode
  name: string
  englishName: string
  flag: string
}

const LANGUAGE_FLAGS: Record<string, string> = {
  it: "🇮🇹",
  en: "🇬🇧",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  pt: "🇵🇹",
  nl: "🇳🇱",
  ru: "🇷🇺",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  ar: "🇸🇦",
  pl: "🇵🇱",
  tr: "🇹🇷",
  sv: "🇸🇪",
  da: "🇩🇰",
  no: "🇳🇴",
  fi: "🇫🇮",
  el: "🇬🇷",
  cs: "🇨🇿",
  hu: "🇭🇺",
  ro: "🇷🇴",
  uk: "🇺🇦",
  he: "🇮🇱",
  hi: "🇮🇳",
  th: "🇹🇭",
  vi: "🇻🇳",
  id: "🇮🇩",
  bg: "🇧🇬",
  hr: "🇭🇷",
  sk: "🇸🇰",
  sl: "🇸🇮",
  sr: "🇷🇸",
  lt: "🇱🇹",
  lv: "🇱🇻",
  et: "🇪🇪",
  is: "🇮🇸",
  ga: "🇮🇪",
  ca: "🇪🇸",
  eu: "🇪🇸",
}

export const isSupportedLanguage = Schema.is(Schema.Literal(...Object.keys(LANGUAGE_FLAGS)))

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1)
}

export function getLanguageName(code: LanguageCode): string {
  return capitalize(ISO6391.getNativeName(code) || ISO6391.getName(code) || code)
}

export function getLanguageEnglishName(code: LanguageCode): string {
  return ISO6391.getName(code) || code
}

export function allLanguages(): LanguageOption[] {
  return Object.entries(LANGUAGE_FLAGS)
    .map(([code, flag]) => ({
      code,
      name: getLanguageName(code),
      englishName: getLanguageEnglishName(code),
      flag,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
