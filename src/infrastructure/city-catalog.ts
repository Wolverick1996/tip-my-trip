import allTheCities from "all-the-cities"
import countries from "i18n-iso-countries"
import it from "i18n-iso-countries/langs/it.json"
import type { City } from "@/domain/city"

countries.registerLocale(it)

/**
 * Nomi italiani per le città che `all-the-cities` (dataset GeoNames) riporta con il nome inglese/anglicizzato
 * ("Rome", "Milan", "Naples"...). Copre solo le principali città italiane/europee, non tutte le ~135k.
 * @prototype In produzione la tabella si genererebbe da `alternateNames` di GeoNames (vedi docs/decisions.md).
 */
const CITY_NAME_OVERRIDES: Record<number, string> = {
  3169070: "Roma",
  3173435: "Milano",
  3172394: "Napoli",
  3165524: "Torino",
  3164603: "Venezia",
  3176959: "Firenze",
  3176219: "Genova",
  2643743: "Londra",
  2988507: "Parigi",
  2867714: "Monaco di Baviera",
  524901: "Mosca",
  756135: "Varsavia",
  3067696: "Praga",
  264371: "Atene",
  2267057: "Lisbona",
  2800866: "Bruxelles",
  2747373: "L'Aia",
  2618425: "Copenaghen",
  683506: "Bucarest",
  792680: "Belgrado",
  3186886: "Zagabria",
  2673730: "Stoccolma",
  2964574: "Dublino",
  2650225: "Edimburgo",
  2657896: "Zurigo",
  2660646: "Ginevra",
  2886242: "Colonia",
  2911298: "Amburgo",
  2990440: "Nizza",
  2995469: "Marsiglia",
  2996944: "Lione",
  3128760: "Barcellona",
  2510911: "Siviglia",
}

export const CITIES: City[] = allTheCities.map((city) => ({
  id: String(city.cityId),
  name: CITY_NAME_OVERRIDES[city.cityId] ?? city.name,
  country: countries.getName(city.country, "it") ?? city.country,
  population: city.population,
  lat: city.loc.coordinates[1],
  lng: city.loc.coordinates[0],
}))

const CITIES_BY_ID = new Map(CITIES.map((city) => [city.id, city]))

export function findCityById(id: string): City | undefined {
  return CITIES_BY_ID.get(id)
}
