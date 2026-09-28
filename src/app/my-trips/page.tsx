import { Text } from "@mantine/core"
import { getCurrentUser } from "@/current-user"
import { cityCoverage, tripTitle } from "@/domain/trip"
import { runtime } from "@/runtime"
import { getCity } from "@/use-cases/get-city"
import { listTrips } from "@/use-cases/list-trips"
import { PageWrapper } from "@/app/components/PageWrapper"
import type { ResolvedTrip } from "./resolved-trip"
import { MyTrips } from "./MyTrips"

export default async function TripsPage() {
  const organizer = await getCurrentUser()
  const organizerCityIds = organizer.knownCities.map((known) => known.cityId)
  const trips = await runtime.runPromise(listTrips(organizer.id))

  const resolvedTrips: ResolvedTrip[] = trips.map((trip) => {
    const experts = trip.experts
    const cityName = (cityId: string) => getCity(cityId)?.name ?? cityId
    const expertName = (id: string) => experts.find((expert) => expert.id === id)?.name ?? id
    const coverage = cityCoverage(
      trip.cityIds,
      experts.map((expert) => ({ id: expert.id, cityIds: expert.matchedCities.map((known) => known.cityId) })),
      organizerCityIds,
    )

    return {
      id: trip.id,
      title: tripTitle(trip, cityName),
      cities: coverage.map((city) => ({
        id: city.cityId,
        name: cityName(city.cityId),
        coveredBy: city.coveredBy.map(expertName),
        knownByOrganizer: city.knownByOrganizer,
      })),
      experts: experts.map((expert) => ({
        id: expert.id,
        name: expert.name,
        knownCities: expert.matchedCities.map((city) => ({
          id: city.cityId,
          name: cityName(city.cityId),
          level: city.level,
        })),
        languages: expert.sharedLanguages,
        contact: expert.contact ?? {},
      })),
    }
  })

  return (
    <PageWrapper>
      <h1 className="text-xl font-semibold">I miei viaggi</h1>
      <Text c="dimmed" mt="sm">
        Scegli le città e trova chi le conosce davvero.
      </Text>

      <MyTrips trips={resolvedTrips} organizerCityIds={organizerCityIds} />
    </PageWrapper>
  )
}
