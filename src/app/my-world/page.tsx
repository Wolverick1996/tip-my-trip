import { Suspense } from "react"
import { Text } from "@mantine/core"
import { getCurrentUser } from "@/current-user"
import { getCity } from "@/use-cases/get-city"
import { PageWrapper } from "@/app/components/PageWrapper"
import { MyWorld } from "./MyWorld"
import type { ResolvedKnownCity } from "./resolved-known-city"
import { WelcomeOnboarding } from "./WelcomeOnboarding"

export default async function MyWorldPage() {
  const traveler = await getCurrentUser()

  const knownCities: ResolvedKnownCity[] = traveler.knownCities.flatMap((known) => {
    const city = getCity(known.cityId)
    return city ? [{ city, level: known.level }] : []
  })

  return (
    <PageWrapper>
      <Suspense fallback={null}>
        <WelcomeOnboarding />
      </Suspense>

      <h1 className="text-xl font-semibold">Il mio mondo</h1>
      <Text c="dimmed" mt="sm">
        Le città che conosci, sulla mappa e in elenco.
      </Text>

      <MyWorld knownCities={knownCities} />
    </PageWrapper>
  )
}
