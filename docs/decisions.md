# Decision log

Decisioni importanti e motivo per cui sono state prese. Non un changelog: solo scelte che avrebbero potuto essere diverse e vale la pena ricordare perché non lo sono.

## Un solo tipo `Traveler`, nessun ruolo separato

Un utente registrato può sia comparire come esperto (se indica città conosciute) sia creare viaggi come organizzatore — non ci sono due tipi distinti (`Expert`/`TravelOrganizer`) nel dominio.

**Perché**: coerente con "niente autenticazione reale" nell'MVP; nella realtà la stessa persona ricopre spesso entrambi i ruoli (un Travel Organizer che a sua volta conosce bene alcune città); meno complessità per il prototipo.

## Lingua come filtro di esclusione, non come peso nel punteggio

Un candidato che non condivide nessuna lingua con l'organizzatore è escluso dai risultati, non semplicemente penalizzato nel punteggio.

**Perché**: un match linguisticamente impossibile non è utilizzabile a prescindere da quanto il candidato conosca le città — non ha senso dargli comunque un punteggio alto. Deciso dopo che la prima proposta (lingua come 20% del punteggio) non rifletteva questo vincolo.

## Punteggio di matching: copertura 60% + livello expertise 40%

Dopo aver tolto la lingua dal punteggio (vedi sopra), i pesi sono stati ridistribuiti tra i due fattori rimanenti invece di lasciare punti "vuoti".

**Perché**: sono le due dimensioni che restano dopo i filtri, pesate in modo che la copertura (quante città del viaggio conosce) conti leggermente più del livello medio di conoscenza — entrambe scelte arbitrarie ma semplici da spiegare e da cambiare in futuro (sono solo moltiplicatori su rapporti normalizzati 0-1).

## Shortlist multi-esperto e coverage automatica rimandate al Trip Planner multi-città

Il primo vertical slice supporta solo la selezione di una singola città. La possibilità di selezionare più esperti per un viaggio (non un solo "vincitore") e di calcolare automaticamente quali città restano scoperte, riproponendo il matching su quelle, è un requisito reale ma viene costruita quando si affronta il Trip Planner multi-città.

**Perché**: il vertical slice è scelto apposta per attraversare l'architettura senza costruire tutto il prodotto; l'algoritmo di matching sottostante non richiede modifiche per supportare questo caso (è lo stesso algoritmo applicato a un sottoinsieme di città) — solo la UI/stato di selezione va costruita più avanti.

## Struttura delle cartelle: Ports & Adapters pragmatico

```
src/
  app/                 # routing Next.js — Presentation
  components/          # componenti React condivisi — Presentation
  domain/              # entità, regole pure e i port (interfacce) dei repository
  use-cases/           # un file per use case
  infrastructure/      # implementazioni dei port + dati mock
```

I port vivono in `domain/`: è il dominio a dichiarare di cosa ha bisogno, in linguaggio suo — l'infrastruttura li implementa, non il contrario. `infrastructure/` è flat, senza sottocartelle: ne servirebbe una solo per separare più implementazioni (es. in-memory vs un vero backend), fuori scope per l'MVP — si introduce se e quando serve davvero.

**Perché**: coerente con l'evitare astrazioni e nesting non necessari (niente factory, generic repository, interfacce per ogni cosa se non portano un vantaggio reale). `domain/` resta indipendente da React, Next.js e dalle implementazioni concrete, quindi testabile in isolamento.

## File di test in `__tests__/` per cartella, non colocati né in un albero `test/` separato

I test vivono in una sottocartella `__tests__/` dentro ogni cartella di codice sorgente, es. `src/domain/__tests__/matching.test.ts` per `src/domain/matching.ts`. Scartate sia la colocation diretta (`src/domain/matching.test.ts`), sia un albero `test/` parallelo a `src/`.

**Perché**: preferenza per non avere file di test mescolati nella stessa lista di file dei sorgenti quando si guarda una cartella — scarta la colocation diretta. Un albero `test/` parallelo darebbe separazione totale ma introduce una seconda struttura di cartelle da tenere allineata a `src/`, complessità in più senza un vantaggio chiaro. `__tests__/` per cartella è la via di mezzo: separazione visiva senza duplicare la struttura altrove, ed è una convenzione nativa di Jest — nessuna modifica a `jest.config.mjs` necessaria.
