# Roadmap

Stato reale del progetto, non un elenco di intenzioni. Aggiornata quando cambia qualcosa di importante.

## Fatto

- Scaffold tecnico: Next.js (App Router, Turbopack), TypeScript, Tailwind CSS, ESLint, Jest (via `next/jest`), Effect — installati e verificati (build, lint, test passano).
- CI GitHub Actions: lint/test in parallelo, build a seguire.
- `docs/product-brief.md`: problema, utenti, MVP, user journey, dominio concettuale, algoritmo di matching.
- `docs/decisions.md`: decisioni prese finora, con motivazione.
- `docs/effect/`: concetti Effect necessari al vertical slice, spiegati da zero (basi, dipendenze, errori tipizzati, esecuzione).
- Strategia di testing per il vertical slice discussa e approvata (non formalizzata in un doc a parte — guida per quando si scrive il codice, vedi `docs/effect/` e la sezione Testing di `AGENTS.md`).
- `domain/`: entità (`City`, `Language`, `ExpertiseLevel`, `Traveler`, `Trip`), funzione pura `matchTravelers()` e i suoi test.
- Port `TravelerRepository` (in `domain/`), errori tipizzati (`TravelerNotFoundError`), use case `findExpertsForCity` (in `use-cases/`), implementazione in-memory con dati mock (in `infrastructure/`) — con i rispettivi test (Layer di test per il use case, `Effect.flip` per gli errori tipizzati).
- **Primo vertical slice completo**: Home (selezione città) → `/results/[cityId]` (esperti trovati, con breakdown) → `/experts/[travelerId]` (profilo, città conosciute, contatti WhatsApp/email mock). Verificato end-to-end in browser (Playwright): nessun errore console/pagina, stato vuoto per città senza match, contatti mancanti non generano link rotti.

## In corso / prossimo

Nessuno step aperto sul primo vertical slice. Prossimo blocco di lavoro: uno tra registrazione, mappa città o Trip Planner multi-città (vedi sotto) — da decidere insieme.

## Dopo il vertical slice

- Registrazione (lingue, città conosciute, livello) — non serve al vertical slice, che parte da dati mock già popolati.
- Mappa delle città (mock) e aggiunta di una città.
- Trip Planner multi-città: shortlist di più esperti per viaggio, calcolo automatico delle città scoperte (vedi `docs/decisions.md`).
- Dashboard, Home.
