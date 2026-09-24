# Roadmap

Stato reale del progetto: cosa è stato fatto, cosa manca. Si aggiorna solo quando cambia qualcosa di importante, non è un log di attività. Legenda: ✅ fatto, 🚧 in corso, ⬜ non ancora iniziato.

- ✅ Scaffold tecnico: Next.js (App Router, Turbopack), TypeScript, Tailwind CSS, ESLint, Jest (via `next/jest`), Effect — installati e verificati (build, lint, test passano).
- ✅ CI GitHub Actions: lint/test in parallelo, build a seguire.
- ✅ `docs/product-brief.md`: problema, utenti, MVP, user journey, dominio concettuale, algoritmo di matching.
- ✅ `docs/decisions.md`: decisioni prese finora, con motivazione.
- ✅ `docs/effect/`: concetti Effect necessari al vertical slice, spiegati da zero (basi, dipendenze, errori tipizzati, esecuzione).
- ✅ Strategia di testing per il vertical slice discussa e approvata (non formalizzata in un doc a parte — guida per quando si scrive il codice, vedi `docs/effect/` e la sezione Testing di `AGENTS.md`).
- ✅ `domain/`: entità (`City`, `Language`, `ExpertiseLevel`, `Traveler`, `Trip`), funzione pura `matchTravelers()` e i suoi test.
- ✅ Port `TravelerRepository` (in `domain/`), errori tipizzati (`TravelerNotFoundError`), use case `findExpertsForCity` (in `use-cases/`), implementazione in-memory con dati mock (in `infrastructure/`) — con i rispettivi test (Layer di test per il use case, `Effect.flip` per gli errori tipizzati).
- ✅ **Primo vertical slice completo**: Home (selezione città) → `/results/[cityId]` (esperti trovati, con breakdown) → `/experts/[travelerId]` (profilo, città conosciute, contatti WhatsApp/email mock). Verificato end-to-end in browser (Playwright): nessun errore console/pagina, stato vuoto per città senza match, contatti mancanti non generano link rotti.
- ✅ Review completa del vertical slice (use case, infrastructure, runtime, componenti, pagine): corretto un bug (l'organizzatore poteva comparire come match di se stesso), una violazione architetturale (`CITIES` spostato in `domain/` come dato statico, `CURRENT_ORGANIZER_ID` spostato in `src/current-user.ts` — la Presentation non importa più nulla direttamente da `infrastructure/`), e `/experts/[id]` con id inesistente ora mostra "Profilo non trovato" nella pagina (`Effect.either`), stesso principio dello stato vuoto dei risultati (vedi `docs/effect/02-typed-errors.md`).
- ✅ **Registrazione** (`/register`), obbligatoria: nome, lingue, almeno un contatto (WhatsApp o email). Validazione server-side (`registerTraveler`, errori tipizzati, formato email con `Schema` di Effect, numero WhatsApp con selettore prefisso e validazione reale per paese via `react-phone-number-input`/`libphonenumber-js`), `TravelerRepository` ora scrivibile (`save`), sessione minima via cookie (`src/current-user.ts`), nessun utente di default: `src/proxy.ts` reindirizza a `/register` qualsiasi pagina se il cookie manca, e viceversa. Lingue selezionabili con un multiselect con ricerca e bandiera (`LanguagePicker`, nomi da `iso-639-1`). A registrazione completata l'utente resta loggato in questo browser e viene portato in home, dove vede subito un onboarding ("Tutto pronto") sopra la home stessa.
- ⬜ "My Expertise": aggiungere/rimuovere città conosciute con livello per il traveler corrente — il naturale completamento della registrazione.
- ⬜ Mappa delle città (mock) e aggiunta di una città.
- ⬜ Trip Planner multi-città: shortlist di più esperti per viaggio, calcolo automatico delle città scoperte (vedi `docs/decisions.md`).
- ⬜ Dashboard, Home.

Prossimo blocco di lavoro da scegliere tra i tre ⬜ in cima — da decidere insieme, non ancora deciso.
