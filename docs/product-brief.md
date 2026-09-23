# Product Brief

## Problema

Chi organizza un viaggio in una città che non conosce bene spesso ha bisogno di consigli pratici e affidabili (dove mangiare, cosa vedere, come muoversi) che una guida generica non dà. Parlare con qualcuno che quella città la conosce davvero — perché ci vive, ci ha vissuto o l'ha visitata spesso — risolve questo problema meglio di una ricerca generica.

## Utenti

Un solo tipo di account (`Traveler`, vedi [Dominio](#dominio)) copre due modi di usare il prodotto, spesso dalla stessa persona:

- **Travel Coordinator** — deve organizzare un viaggio (per lavoro, come nel caso d'origine di un Travel Coordinator professionista, o per sé) e cerca persone che conoscono le destinazioni.
- **Local/Esperto** — conosce una o più città a vari livelli e vuole essere trovato da chi organizza un viaggio lì.

Non c'è distinzione di ruolo nel dominio: chiunque si registri può sia indicare le città che conosce (ed essere trovato come esperto), sia creare un viaggio (ed essere un coordinator). Vedi `docs/decisions.md` per la motivazione.

## MVP

Riassunto (dettaglio completo in `AGENTS.md`): gestione città conosciute, livello di expertise, lingue, creazione di un viaggio, matching, risultati del matching, profilo dell'esperto, contatti (mock, no chat/integrazioni reali). Dati mock/in-memory, nessun backend/autenticazione reale.

## User journey

**Primo vertical slice** (singola città, per attraversare l'architettura senza costruire tutto):

Seleziono una città → vedo chi la conosce → vedo i risultati (ordinati, con breakdown) → apro un profilo → vedo come contattarlo (icone WhatsApp/email, contatti fittizi).

**Flusso completo** (dopo il vertical slice, Trip Planner multi-città):

Creo un viaggio selezionando più città → vedo i risultati del matching per l'intero viaggio → posso selezionare più esperti (non un solo "vincitore": posso volere consigli da persone diverse) → il sistema calcola quali città del viaggio restano scoperte dagli esperti già selezionati e mi ripropone il matching filtrato su quelle città rimanenti → apro profili → contatto.

Nota tecnica: il secondo flusso non richiede un algoritmo diverso — "matching filtrato su una città" è lo stesso algoritmo applicato a un sottoinsieme delle città del viaggio (vedi [Matching](#matching)). La parte nuova è lo stato "chi ho selezionato per questo viaggio" e il calcolo delle città scoperte, non l'algoritmo di matching in sé.

**Registrazione** (onboarding, non nel vertical slice): lingue parlate, città conosciute, livello per ciascuna.

## Dominio

Bozza concettuale (verrà raffinata quando l'Architect definisce i tipi concreti in codice):

- **Language** — codice + etichetta (lista mock fissa, es. it, en, es, fr...).
- **ExpertiseLevel** — `Base` | `Expert` | `Local`, ordinabile (Base < Expert < Local).
- **City** — id, nome, paese, coordinate (per il pin sulla mappa mock).
- **KnownCity** — città + livello, appartiene a un Traveler.
- **Traveler** — id, nome, lingue parlate, città conosciute (`KnownCity[]`), contatti (whatsapp/email fittizi). Nessun ruolo separato: può comparire sia come esperto trovato da altri, sia come coordinatore che crea viaggi.
- **Trip** — id, titolo, coordinatore (un Traveler), città da visitare.
- **MatchResult** — un Traveler candidato + punteggio + breakdown esplicativo (vedi sotto).

## Matching

Il matching deve essere semplice e **spiegabile**: niente algoritmi sofisticati, una funzione pura (stesso input → stesso output, nessuna dipendenza esterna) facile da testare con casi tabellari.

**Filtri di esclusione** (un candidato che non li passa non compare nei risultati):

1. Conosce almeno una città del viaggio.
2. Condivide almeno una lingua con il coordinatore — un match linguisticamente impossibile non è un match valido, indipendentemente da quanto il candidato sia altrimenti competente.

**Punteggio 0-100** (solo su chi passa i filtri):

- `coverageScore` = (città del viaggio conosciute dal candidato / totale città del viaggio) × 60
- `expertiseScore` = (livello medio sulle città in comune, su scala 1-3 dove Base=1/Expert=2/Local=3, diviso 3) × 40
- `totalScore` = coverageScore + expertiseScore, arrotondato

**Esempio**: viaggio a Madrid + Barcellona + Siviglia. Un candidato conosce Madrid (Local) e Barcellona (Expert), parla italiano e inglese; il coordinatore parla italiano.

- Filtri: 2/3 città ✓, lingua italiana in comune ✓ → passa
- coverageScore = (2/3) × 60 ≈ 40
- avgLevel = (3 + 2) / 2 = 2.5 → expertiseScore = (2.5/3) × 40 ≈ 33
- totalScore ≈ 73

**Breakdown per la UI** (non solo il numero): città in comune con relativo livello, e lingue condivise — es. "Conosce 2/3 città del viaggio (Local a Madrid, Expert a Barcellona), parla italiano".

**Ordinamento**: punteggio decrescente; a parità, numero di città in comune decrescente, poi alfabetico (determinismo nei test).

**Fuori scope per ora**: nessun machine learning, nessun collaborative filtering, nessuna nozione di "città vicine" — solo intersezione diretta di insiemi (città, lingue).
