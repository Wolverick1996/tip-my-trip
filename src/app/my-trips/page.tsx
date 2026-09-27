import { getCurrentUser } from "@/current-user"
import { getLanguageName } from "@/domain/language"
import { cityCoverage, tripTitle } from "@/domain/trip"
import { runtime } from "@/runtime"
import { getCity } from "@/use-cases/get-city"
import { listTrips } from "@/use-cases/list-trips"
import type { ResolvedTrip } from "./resolved-trip"
import { Trips } from "./Trips"

export default async function TripsPage() {
  const organizer = await getCurrentUser()
  const organizerCityIds = organizer.knownCities.map((known) => known.cityId)
  const tripsWithExperts = await runtime.runPromise(listTrips(organizer.id))

  const trips: ResolvedTrip[] = tripsWithExperts.map(({ trip, experts }) => {
    const cityName = (cityId: string) => getCity(cityId)?.name ?? cityId
    const expertName = (id: string) => experts.find((expert) => expert.id === id)?.name ?? id
    const coverage = cityCoverage(
      trip.cityIds,
      experts.map((expert) => ({ id: expert.id, cityIds: expert.knownCities.map((known) => known.cityId) })),
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
        languages: expert.languages.map(getLanguageName),
        contact: expert.contact,
      })),
    }
  })

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">I miei viaggi</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Scegli le città e trova chi le conosce davvero.</p>

      <Trips trips={trips} organizerCityIds={organizerCityIds} />
    </div>
  )
}
