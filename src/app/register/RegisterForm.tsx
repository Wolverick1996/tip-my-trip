"use client"

import { Alert, Button, Input, Stack, Text, TextInput } from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { useForm } from "@mantine/form"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import type { LanguageCode } from "@/domain/language"
import { registerAction, type RegisterFormState } from "./actions"
import { LanguagePicker } from "./LanguagePicker"

interface RegisterValues {
  name: string
  languages: LanguageCode[]
  whatsApp: string
  email: string
}

export function RegisterForm() {
  const [state, setState] = useState<RegisterFormState>({ success: false })
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<RegisterValues>({
    initialValues: { name: "", languages: [], whatsApp: "", email: "" },
  })

  useEffect(() => {
    if (state.success) {
      router.replace("/my-world?onboarding=1")
    }
  }, [state.success, router])

  function handleSubmit(values: RegisterValues) {
    const formData = new FormData()
    formData.set("name", values.name)
    for (const code of values.languages) formData.append("languages", code)
    formData.set("whatsApp", values.whatsApp)
    formData.set("email", values.email)
    startTransition(async () => {
      setState(await registerAction(formData))
    })
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md" mt="md">
        {state.error && (
          <Alert color="strawberry" icon={<IconAlertCircle size={16} />} aria-live="polite">
            {state.error}
          </Alert>
        )}

        <TextInput label="Nome" required {...form.getInputProps("name")} />

        <LanguagePicker
          label="Lingue parlate"
          selected={form.values.languages}
          onChange={(next) => form.setFieldValue("languages", next)}
        />

        <div>
          <Input.Label htmlFor="whatsapp-number" mb={5}>
            WhatsApp
          </Input.Label>
          <PhoneInput
            id="whatsapp-number"
            className="gap-2 h-[calc(2.25rem*var(--mantine-scale))] border-[calc(0.0625rem*var(--mantine-scale))] border-(--mantine-color-cream-6) bg-(--mantine-color-white) rounded-(--mantine-radius-default) px-[calc(2.25rem*var(--mantine-scale)/3)] [font-family:var(--mantine-font-family)] text-(length:--mantine-font-size-md) text-(--mantine-color-text) transition-[border-color] duration-100 ease-[ease] focus-within:border-(--mantine-primary-color-filled)"
            international
            defaultCountry="IT"
            value={form.values.whatsApp}
            numberInputProps={{
              className: "outline-none placeholder:text-(--mantine-color-placeholder)",
            }}
            onChange={(value) => form.setFieldValue("whatsApp", value ?? "")}
          />
        </div>

        <TextInput label="Email" type="email" {...form.getInputProps("email")} />

        <Text size="sm" c="dimmed">
          Indica almeno un contatto tra WhatsApp ed email.
        </Text>

        <Button type="submit" loading={pending}>
          Registrati
        </Button>
      </Stack>
    </form>
  )
}
