import { allLanguages, getLanguageName, isSupportedLanguage } from "../language"

test("capitalizza il nome nativo anche quando iso-639-1 lo restituisce minuscolo", () => {
  expect(getLanguageName("fi")).toBe("Suomi") // iso-639-1 restituisce "suomi"
  expect(getLanguageName("hu")).toBe("Magyar") // iso-639-1 restituisce "magyar"
})

test("allLanguages: ogni lingua ha una bandiera, nessun duplicato, ordinate per nome", () => {
  const languages = allLanguages()

  expect(languages.length).toBeGreaterThan(30)
  expect(languages.every((lang) => lang.flag.length > 0)).toBe(true)

  const codes = languages.map((lang) => lang.code)
  expect(new Set(codes).size).toBe(codes.length)

  const names = languages.map((lang) => lang.name)
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
})

test("isSupportedLanguage accetta solo le lingue con una bandiera", () => {
  expect(isSupportedLanguage("it")).toBe(true)
  expect(isSupportedLanguage("sw")).toBe(false) // codice ISO 639-1 reale (Swahili), ma non in LANGUAGE_FLAGS
  expect(isSupportedLanguage("xx")).toBe(false) // non un codice ISO 639-1
})
