import type { TravelerId } from "./domain/traveler"

// Nessuna registrazione/autenticazione nell'MVP: la UI usa questo id fisso
// come "utente corrente" che crea i viaggi. Non è dato di dominio (non
// descrive una regola) né infrastruttura (non è un dettaglio implementativo
// di un adapter) — è uno stub applicativo, allo stesso livello di
// src/runtime.ts.
export const CURRENT_ORGANIZER_ID: TravelerId = "u-organizer"
