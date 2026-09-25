# Effect in TipMyTrip

Qui documentiamo solo i concetti di Effect che usiamo davvero nel codice, mano a mano che li introduciamo — non un tutorial generale su Effect. Ogni voce spiega: cosa fa, perché lo usiamo qui, quale problema risolve, e quale sarebbe l'alternativa scrivendo TypeScript "normale" senza Effect.

Chi legge parte da zero su Effect (a differenza di Hexagonal Architecture / Ports & Adapters, già noto) — niente è dato per scontato.

## Organizzazione: un file per tema, non per API

Ogni file raggruppa un **tema** (dipendenze, errori, esecuzione...), non una singola funzione Effect. Il numero riflette quando quel tema è stato incontrato per la prima volta nel progetto — ma il file resta aperto: se più avanti emerge un concetto nuovo che appartiene a un tema già esistente (es. `Layer.merge` per combinare più port, o `Effect.flip` per testare errori tipizzati), si aggiunge a quel file invece di crearne uno nuovo. Un nuovo numero nasce solo per un tema davvero nuovo, non ancora coperto da nessuno dei file esistenti.

## Concetti documentati finora

0. [Le basi: il tipo Effect e la sintassi Effect.gen](./00-basics.md) — da leggere per prima cosa, senza questo il resto non si capisce.
1. [Dipendenze: Context.Tag e Layer](./01-dependencies-context-and-layer.md) — come un use case dichiara di cosa ha bisogno, e chi glielo fornisce.
2. [Errori tipizzati: Data.TaggedError](./02-typed-errors.md) — perché un fallimento compare nel tipo di una funzione invece che in un `throw`, e la differenza tra failure (errore previsto) e defect (bug).
3. [Eseguire un Effect: il confine con React](./03-running-effects.md) — dove il mondo Effect incontra Promise/React, e come tradurre un `Exit` in una risposta HTTP.
4. [Validare dati: Schema](./04-validating-data-schema.md) — controllare che un dato rispetti un formato, es. email e numero WhatsApp in fase di registrazione, e trasformare un valore con `Schema.decode` (la query di ricerca).

## Fuori scope per ora

Stream, Fiber, concorrenza avanzata — non servono al primo vertical slice. Si aggiungono qui (nuovo tema) quando servirà davvero gestire dati asincroni complessi o concorrenza, non prima.
