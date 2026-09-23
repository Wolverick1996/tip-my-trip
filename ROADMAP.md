# Roadmap

Stato reale del progetto, non un elenco di intenzioni. Aggiornata quando cambia qualcosa di importante.

## Fatto

- Scaffold tecnico: Next.js (App Router, Turbopack), TypeScript, Tailwind CSS, ESLint, Jest (via `next/jest`), Effect — installati e verificati (build, lint, test passano).
- CI GitHub Actions: lint/test in parallelo, build a seguire.
- `docs/product-brief.md`: problema, utenti, MVP, user journey, dominio concettuale, algoritmo di matching.
- `docs/decisions.md`: decisioni prese finora, con motivazione.
- `docs/effect/`: concetti Effect necessari al vertical slice, spiegati da zero (basi, dipendenze, errori tipizzati, esecuzione).
- Strategia di testing per il vertical slice discussa e approvata (non formalizzata in un doc a parte — guida per quando si scrive il codice, vedi `docs/effect/` e la sezione Testing di `AGENTS.md`).

## In corso / prossimo

**Primo vertical slice** (singola città → risultati → profilo → contatti): nessun codice applicativo ancora scritto. Da costruire, in ordine:

1. `domain/` — entità (`City`, `Language`, `ExpertiseLevel`, `Traveler`, `Trip`, `MatchResult`) e la funzione pura `matching()`, con i suoi test.
2. Port del repository in `domain/`, use case in `use-cases/`, implementazione in-memory in `infrastructure/`.
3. UI minima: selezione città, lista risultati con breakdown, profilo esperto, contatti mock.

## Dopo il vertical slice (non ancora iniziato)

- Registrazione (lingue, città conosciute, livello) — non serve al vertical slice, che parte da dati mock già popolati.
- Mappa delle città (mock) e aggiunta di una città.
- Trip Planner multi-città: shortlist di più esperti per viaggio, calcolo automatico delle città scoperte (vedi `docs/decisions.md`).
- Dashboard, Home.
