import { Schema } from "effect"
import { isValidPhoneNumber, parsePhoneNumberWithError } from "libphonenumber-js"

export const EmailAddress = Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))

export function parseWhatsAppNumber(number: string): string | undefined {
  return isValidPhoneNumber(number) ? parsePhoneNumberWithError(number).number : undefined
}
