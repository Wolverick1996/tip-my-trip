import { Schema } from "effect"
import { EmailAddress, parseWhatsAppNumber } from "../contact-format"

describe("EmailAddress", () => {
  test.each(["mario.rossi@example.com", "a@b.co"])("accetta %s", (email) => {
    expect(Schema.is(EmailAddress)(email)).toBe(true)
  })

  test.each([
    ["mario.rossi@example", "nessun dominio con punto (nessun TLD)"],
    ["mario rossi@example.com", "spazio nella parte locale"],
    ["@example.com", "parte locale vuota"],
    ["mario.rossi@.com", "dominio vuoto prima del punto"],
    ["mario.rossi@example.com ", "spazio finale"],
    ["non-una-email", "nessuna @"],
  ])("rifiuta %s (%s)", (email) => {
    expect(Schema.is(EmailAddress)(email)).toBe(false)
  })
})

describe("parseWhatsAppNumber", () => {
  test("un numero italiano valido, con spazi, torna in formato E.164", () => {
    expect(parseWhatsAppNumber("+39 333 123 4567")).toBe("+393331234567")
  })

  test("un numero di un altro paese valido viene accettato", () => {
    expect(parseWhatsAppNumber("+44 20 7946 0958")).toBe("+442079460958")
  })

  test.each([
    ["333 123 4567", "nessun prefisso internazionale, nessun paese di riferimento"],
    ["+39123", "troppo corto per l'Italia"],
    ["+1 555 123 4567", "prefisso 555 statunitense, riservato/fittizio, non un numero reale"],
    ["non un numero", "non numerico"],
  ])("rifiuta %s (%s)", (number) => {
    expect(parseWhatsAppNumber(number)).toBeUndefined()
  })
})
