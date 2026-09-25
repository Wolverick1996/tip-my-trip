# TipMyTrip — AGENTS.md

## Cos'è

TipMyTrip è un prototipo web che nasce da una necessità incontrata lavorando come Travel Coordinator: quando si organizza un viaggio in una città poco conosciuta, è utile parlare con qualcuno che quella città la conosce davvero (es. "Devo portare 15 persone a pranzo a Madrid, conosci qualche ristorante adatto?"). TipMyTrip mette in contatto chi organizza il viaggio con chi conosce bene la destinazione.

**Obiettivo del progetto**: è soprattutto un esercizio di apprendimento di Effect. La qualità del codice e la comprensione di quello che si sta facendo contano più della quantità di funzionalità. Non è rocket engineering (not yet, perlomeno).

## Come funziona (visione)

- Un utente si registra indicando le lingue che parla, le città che conosce e il livello di conoscenza di ciascuna: **Base** (ci è passato/l'ha visitata), **Expert** (ci è stato diverse volte, sa confrontare alternative), **Local** (ci vive o l'ha vissuta, può quasi costruire un itinerario). Le città conosciute si vedono come pin su una mappa.
- Un Travel Coordinator crea un viaggio selezionando le città da visitare; il sistema trova le persone utili per quelle destinazioni.
- Il matching deve essere semplice e **spiegabile** (niente algoritmi sofisticati per ora), tenendo conto ad esempio di: città conosciute, livello di expertise, lingue in comune, quante città del viaggio conosce una persona.
- Nessuna chat interna per l'MVP: sul profilo si mostrano icone WhatsApp/email con contatti fittizi.

Il primo vertical slice a cui puntare: **seleziono una città → trovo le persone che la conoscono → vedo i risultati → apro un profilo → vedo come contattarlo.**

## MVP — dentro e fuori

**Dentro**: gestione città conosciute, livello di expertise, lingue, creazione di un viaggio, matching, risultati del matching, profilo dell'esperto, contatti (mock).

**Fuori per ora** (non aggiungere pensando "potrebbe servire in futuro"): backend reale, database, autenticazione reale, chat, notifiche, integrazioni reali con WhatsApp/email, recommendation engine, traduzioni, infrastruttura cloud, microservizi.

Dati mock/in-memory per il prototipo.

## Stack tecnico

Next.js, React, TypeScript, Effect, Jest, Tailwind CSS.

## Architettura (principi generali)

Hexagonal Architecture / Ports & Adapters, ma pragmatica:

- **Domain** — modello e regole di business (non dipende da React né dall'infrastruttura).
- **Application** — use case.
- **Infrastructure** — repository e implementazioni (per l'MVP: in-memory).
- **Presentation** — React/UI.

Evitare factory, generic repository, interfacce per ogni cosa e dependency injection artificiale se non portano un vantaggio reale. Le scelte concrete di dominio e architettura vengono definite e documentate in `docs/decisions.md` prima di essere implementate, non date per scontate qui.

## Commenti nel codice

Ridotti al minimo: il codice dev'essere il più possibile autoesplicativo (nomi chiari, funzioni piccole), non spiegato a parole vicino a sé. Un commento si scrive solo per un perché non ovvio che il codice da solo non può dire (un vincolo nascosto, un workaround per un problema specifico, un comportamento che sorprenderebbe chi legge) — mai per descrivere cosa fa il codice o ripetere il nome di una variabile/funzione in prosa. Il "perché" di una decisione più ampia (una scelta architetturale, un trade-off, la motivazione dietro un'API scelta) va in `docs/decisions.md` o `docs/effect/`, non in un blocco di commento nel codice.

Le scorciatoie che esistono solo perché questo è un prototipo, e che in produzione sparirebbero o cambierebbero (dati in memoria, sessione nel cookie…), si segnano con un commento JSDoc (`/** … */`) con il tag `@prototype`, così si trovano tutte con una ricerca e l'editor mostra la nota anche nell'hover, in ogni punto in cui il simbolo viene usato. Il tag dice in una riga cosa lo sostituirebbe in produzione, e va solo dove la scorciatoia è definita (la funzione, il file), non ripetuto a ogni punto in cui viene usata.

## Effect

È la parte più importante del progetto dal punto di vista tecnico, e si parte da zero: non dare per scontato che l'utente conosca già pattern, best practice o modi corretti di strutturare un'applicazione Effect. Ogni volta che si introduce un concetto Effect significativo, va spiegato (cosa fa, perché lo usiamo lì, quale problema risolve, quale sarebbe l'alternativa in TypeScript normale) e documentato in `docs/effect/`. Effect va usato dove ha senso, non ovunque per forza.

## Testing

Non è un esercizio di coverage. Prima di scrivere test, capire cosa vale la pena testare: regole del dominio, matching, use case, edge case, gestione degli errori, parti che usano Effect. Il dominio e gli use case devono poter essere testati senza React.

## Agent del progetto

Non vanno coinvolti tutti in ogni attività: si attivano in base al problema. Ognuno ha un'icona e un nome fissi, per rendere esplicito chi sta parlando quando dà un contributo specifico (domanda, osservazione, proposta): **icona Nome — contenuto**, es. "🎯 Giulia — Questo rientra nell'MVP o è scope creep?".

- 🎯 **Giulia — Product Manager** — focus su problema, utenti, MVP; evita feature creep.
- 📊 **Marco — Business Strategist** — valore del prodotto, modello, incentivi, assunzioni; utile nelle decisioni di prodotto.
- 📋 **Sara — Requirements Analyst** — trasforma idee in requisiti concreti, individua ambiguità ed edge case.
- 🎨 **Luca — UX Designer** — user flow, interazioni e UI, tenendo conto di responsive e accessibilità.
- 🏗️ **Elena — Architect** — dominio, struttura del progetto, Ports & Adapters, uso di Effect, dipendenze.
- 🧪 **Davide — Test Architect** — cosa vale la pena testare e come, soprattutto per dominio, use case ed Effect.
- 💻 **Chiara — Developer** — implementa mantenendo il codice semplice, leggibile e coerente con le decisioni prese.
- 🔍 **Paolo — Code Reviewer** — rivede il codice implementato: correttezza, architettura, test, leggibilità, uso di Effect.

Sono anche subagent Claude Code veri e propri, in `.claude/agents/*.md` (in sperimentazione), invocabili singolarmente con l'Agent tool: ognuno riparte da un contesto vuoto (deve rileggersi `AGENTS.md`/`docs/` da sé) e ha un set di tool ristretto coerente col ruolo — es. il Code Reviewer non ha accesso a Write/Edit, quindi non può correggere codice mentre lo rivede, solo segnalare. I ruoli "di prospettiva" (Product Manager, Business Strategist, Requirements Analyst, UX Designer) sono in sola lettura; Architect e Test Architect possono scrivere documentazione ma non codice applicativo; solo il Developer ha accesso completo.

Definire un subagent non lo fa attivare da solo: parte solo se lo si invoca esplicitamente con l'Agent tool. Quando una decisione rientra chiaramente nel dominio di uno di questi ruoli, invocarlo davvero (non solo discuterne direttamente con chi lavora sul progetto) — altrimenti restano definizioni sulla carta mai usate.

## Come si lavora

Per ogni nuova funzionalità o modifica:

1. capire cosa si vuole ottenere;
2. evidenziare problemi o ambiguità;
3. definire uno scope ragionevole;
4. decidere la soluzione;
5. implementare;
6. fare i test necessari;
7. fare una review;
8. aggiornare documentazione e roadmap quando serve.

Non limitarsi a eseguire quanto richiesto: se una soluzione proposta è troppo complessa, un requisito è ambiguo, c'è un edge case importante o una scelta non ha senso, va segnalato. Allo stesso tempo, non trasformare ogni piccola modifica in una riunione: se la scelta è semplice e reversibile, prendere una decisione ragionevole e andare avanti. Chiedere conferma solo per decisioni importanti che non si possono prendere ragionevolmente da soli — in particolare, prima di implementare l'algoritmo di matching va proposta una strategia semplice e spiegata la scelta.

## Git

- Mai fare commit o push in autonomia. Quando un milestone o un pezzo di lavoro logico è completo, proporre un messaggio di commit e fermarsi — l'utente rivede il diff e fa commit/push da sé.
- I messaggi di commit proposti stanno su una riga sola, con prefisso [gitmoji](https://gitmoji.dev/) coerente con il tipo di modifica.

## Regola generale

Priorità: **capire → mantenere semplice → scrivere buon codice → imparare Effect.** Non serve un'architettura perfetta sulla carta: serve capire perché si sta facendo una cosa, poterla testare e poterla modificare senza paura. Se per ottenere questo bisogna rinunciare a un po' di sofisticazione, va bene.

## Documentazione da mantenere

- `AGENTS.md` — questo file (`CLAUDE.md` punta qui).
- `ROADMAP.md` — stato reale del progetto.
- `docs/product-brief.md` — problema, utenti, MVP, user journey, dominio, matching.
- `docs/decisions.md` — decisioni importanti e motivazione.
- `docs/effect/` — solo i concetti Effect realmente usati.
- `docs/master-prompt.md` — testo originale con cui è stato definito il progetto. Riferimento storico, non un documento vivo: se qualcosa qui diventa obsoleto si aggiornano gli altri documenti, non questo.

Breve e utile, non un esercizio di documentazione.

## Stato attuale

Vedi `ROADMAP.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

