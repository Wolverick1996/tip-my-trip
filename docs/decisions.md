# Decision log

Decisioni che avrebbero potuto essere diverse e che cambiano architettura, comportamento o modo di lavorare, con il loro perché. Descrive lo stato attuale, non la storia: i dettagli implementativi stanno nel codice.

- [Dominio e matching](#dominio-e-matching)
- [Struttura e convenzioni](#struttura-e-convenzioni)
- [Route e sessione](#route-e-sessione)
- [Città: catalogo, ricerca, nomi](#città-catalogo-ricerca-nomi)
- [Registrazione e validazione](#registrazione-e-validazione)
- [Build e test](#build-e-test)

## Dominio e matching

- **Un solo tipo `Traveler`, nessun ruolo separato**

  Chi si registra può comparire come esperto (se indica città conosciute) e creare viaggi come organizzatore: nel dominio non esistono `Expert` e `TravelOrganizer` distinti.

  **Perché**: nella realtà la stessa persona ricopre spesso entrambi i ruoli.

- **Lingua come filtro di esclusione, non come peso nel punteggio**

  `matchTravelers` scarta un candidato che non condivide nessuna lingua con l'organizzatore (e ovviamente chi non conosce nessuna città del viaggio). L'organizzatore stesso ovviamente non compare mai tra i propri risultati.

  **Perché**: un match con cui non si può parlare è inutilizzabile a prescindere da quanto il candidato conosca la città, quindi non deve avere un punteggio.

- **Punteggio: copertura 60% + livello di expertise 40%**

  Il punteggio 0-100 somma la copertura (quota delle città del viaggio che il candidato conosce, peso 60) e il livello medio sulle città in comune (peso 40). Formula, esempio e ordinamento sono in `docs/product-brief.md`.

  **Perché**: sono le due dimensioni che restano dopo i filtri, e la copertura conta un po' di più. I pesi sono arbitrari ma facili da spiegare e da cambiare (moltiplicatori su rapporti 0-1).

- **Città conosciute: `setKnownCity` e `removeKnownCity`, invariante nel dominio**

  Aggiunta e modifica del livello sono un solo use case, `setKnownCity(travelerId, cityId, level)`: se la città è già conosciuta ne aggiorna il livello, altrimenti la aggiunge. La rimozione è un use case distinto, `removeKnownCity(travelerId, cityId)`. L'invariante "al massimo un livello per città" sta nel dominio, nella funzione pura `upsertKnownCity` di `domain/traveler.ts`, e si testa senza repository.

  **Perché**: per l'utente aggiungere e modificare sono lo stesso flusso (riselezionare una città già conosciuta apre la modifica). La rimozione ha input diversi e richiede conferma.

- **`TravelerRepository.save` è un upsert**

  `save(traveler)` sostituisce il traveler se l'id esiste già, altrimenti lo inserisce. Non esiste un `update` separato.

  **Perché**: persistere lo stato corrente di un aggregato è una sola operazione, che sia la prima registrazione o una modifica. Un `update` introdurrebbe la precondizione "deve già esistere" e un nuovo errore senza significato di dominio. Il ripristino della sessione (vedi "Persistenza simulata") si basa su questa proprietà.

## Struttura e convenzioni

- **Struttura delle cartelle**

  ```
  src/
    app/              # routing Next.js e componenti delle singole route (Presentation)
    components/       # componenti condivisi tra più route (oggi non esiste)
    domain/           # tipi, regole pure, port, errori tipizzati
    use-cases/        # un file per use case
    infrastructure/   # adapter dei port, catalogo città, dati mock
    runtime.ts        # ManagedRuntime: sceglie gli adapter veri (composition root)
    current-user.ts   # lettura/scrittura della sessione
    user-cookie.ts    # solo il nome del cookie, condiviso da proxy e sessione
    proxy.ts          # redirect e protezione delle API
  ```

  - I port stanno in `domain/`: è il dominio a dichiarare di cosa ha bisogno, l'infrastruttura lo implementa. Così `domain/` non dipende da React, Next.js né dalle implementazioni concrete, e si testa in isolamento.
  - La Presentation (`app/`) non importa mai da `infrastructure/`: passa sempre da uno use case, anche quando è un semplice inoltro (es. `getCity`), così cambiare un adapter non tocca le pagine.
  - `infrastructure/` è piatta: sottocartelle servirebbero solo con più implementazioni dello stesso port (es. in-memory vs un vero backend).
  - Un componente sta in `src/components/` solo se lo importano 2 o più route; altrimenti sta accanto all'unica pagina che lo usa, in `src/app/<route>/`, insieme a Server Action e tipi di quella route. Si sposta quando compare davvero il secondo consumatore: spostare un file costa poco, indovinare in anticipo la riusabilità no.
  - I dati di riferimento senza logica né implementazioni alternative (lingue selezionabili in `domain/language.ts`, livelli in `domain/expertise-level.ts`, catalogo città in `infrastructure/city-catalog.ts`) sono esportati direttamente, senza port. Lingue e livelli stanno in `domain/` perché sono scelte del prodotto; il catalogo città sta in `infrastructure/` perché è un dataset esterno letto da disco (con `fs`, solo lato server).
  - Il nome del cookie sta da solo in `user-cookie.ts` perché lo importa anche `proxy.ts`: prenderlo da `current-user.ts` trascinerebbe nel proxy anche `runtime` e `next/headers`.
  - I nomi leggibili dei valori di dominio stanno accanto al tipo (`getLanguageName`, `expertiseLevelLabel`, `EXPERTISE_LEVELS`): "Base", "Expert", "Local" sono vocabolario del prodotto, non di una schermata.

- **Quando usare Effect**

  Effect si usa solo quando risolve uno di due problemi: una dipendenza da iniettare (un port, con `Context.Tag` e `Layer`) o un errore previsto da propagare nel tipo. Il resto è TypeScript normale: usarlo per uniformità aggiungerebbe cerimonia senza benefici.

  Un risultato assente non è un errore: una città non trovata è `undefined`, una ricerca senza risultati è un array vuoto (vedi `docs/effect/02-typed-errors.md`, "fallimento vs nessun risultato").

  Unica eccezione voluta: la route `GET /api/cities`, scritta con Effect per esercitare il pattern che servirà con un database (vedi "Ricerca città dal client").

- **Moduli usati da client component: mai dipendenze, neanche indirette, dal catalogo città**

  Un modulo importato da un client component non deve raggiungere `infrastructure/city-catalog.ts`. Le pagine che mostrano il nome di una città da un id sono Server Component e chiamano `getCity`; i client component ricevono dati già risolti (es. `ResolvedKnownCity`) o usano solo moduli senza dipendenze (`domain/expertise-level.ts`).

  **Perché**: il catalogo carica `all-the-cities`, che usa `fs`. Se un solo export di un modulo arriva nel bundle del browser ci arriva tutto il modulo con le sue importazioni (il tree-shaking non lo evita, il caricamento ha effetti collaterali), e il build fallisce con "Can't resolve 'fs'". Il confine client/server va rispettato a livello di file.

## Route e sessione

- **Route `/register` e `/my-world`, e il proxy decide dove mandarti**

  "Il mio mondo" è `/my-world`; non esiste una `page.tsx` di root. `src/proxy.ts` contiene tutta la regola "dove devi stare" e reindirizza con un solo salto:

  - senza cookie, qualunque pagina diversa da `/register` (compresa `/`) porta a `/register`;
  - con il cookie, `/` e `/register` portano a `/my-world`.

  Le route sotto `/api/` non vengono mai reindirizzate: sono chiuse per default e si aprono una per una in `PUBLIC_API_PATHS` (oggi solo `/api/cities`). Le altre, senza cookie, ricevono `401` in JSON.

  **Perché**: una sola regola in un solo punto, così le pagine possono dare per scontato che il cookie ci sia. Per le API un redirect non ha senso: una `fetch` finirebbe a leggere come JSON la pagina HTML di `/register`.

  **Scartato**: lasciar passare tutto ciò che inizia con `/api/`, perché una nuova API privata resterebbe pubblica finché qualcuno non si ricorda di proteggerla.

- **Persistenza simulata: il cookie conserva il `Traveler` e lo reinserisce dopo un riavvio**

  I traveler stanno in memoria e si azzerano a ogni riavvio del server; in produzione se ne occuperebbe il database. Per simularne la persistenza, il cookie `tipmytrip_user` contiene il `Traveler` completo in JSON, riscritto con `setCurrentUser` a ogni modifica. Ogni punto che legge l'utente corrente usa `getSyncedCurrentUser()`: legge il cookie con `getCurrentUser()` e reinserisce il traveler nel repository con `syncCurrentTraveler` (un `repo.save`).

  Gli stati possibili sono due: senza cookie si va alla registrazione, con il cookie si usa l'app. Un cookie con JSON corrotto (possibile solo modificandolo a mano) non è gestito: Next mostra la sua pagina d'errore.

  **Perché**:
  - senza reinserimento, dopo un riavvio bisognerebbe registrarsi di nuovo, e anche la propria ricerca smetterebbe di funzionare (`findExpertsForCity` legge le lingue dell'organizzatore dal repository);
  - si usa lo stesso port e lo stesso `save` di ogni altro use case, senza un percorso di persistenza parallelo;
  - gli use case non sanno niente del cookie: il loro `TravelerNotFoundError` resta nel tipo, anche se nell'uso reale non capita più.

  **Limiti accettati**: il cookie non è firmato né validato, quindi chi lo modifica a mano può inserire un `Traveler` arbitrario nel repository (coerente con l'assenza di autenticazione); il limite di circa 4KB di un cookie basta per un profilo con poche città.

  **In produzione**: il cookie conterrebbe solo un id di sessione verificato lato server, e il reinserimento sparirebbe.

## Città: catalogo, ricerca, nomi

- **Catalogo città: dataset in `infrastructure/`, ricerca pura in `domain/`, nessun port**

  `infrastructure/city-catalog.ts` carica una volta `all-the-cities` (circa 135k città GeoNames) e lo converte in `City`. La ricerca è una funzione pura in `domain/city.ts`, `searchCities(cities, query)`, che riceve l'elenco come parametro e quindi si testa con pochi dati finti. Gli use case `searchCities` e `getCity` fanno da ponte verso la Presentation; `getCity` chiama direttamente `findCityById` del catalogo, senza passare dal dominio, perché risolvere un id è un lookup senza regole da incapsulare.

  **Perché**: niente port né Effect, perché il catalogo è un dataset unico, in sola lettura, senza implementazioni alternative né stato da isolare nei test (a differenza di `TravelerRepository`, le cui scritture sono osservate da altri use case). Non c'è nessuna dipendenza da iniettare e nessun errore previsto: una città non trovata è `undefined`.

- **Ricerca città dal client: Route Handler `GET /api/cities`, non Server Action**

  Il codice server può essere chiamato dal browser in due modi:
  - una **Server Action** è una funzione scritta sul server che il client chiama come una funzione normale (`await setKnownCityAction(...)`); Next la trasforma da sé in una richiesta HTTP;
  - un **Route Handler** è un endpoint HTTP classico (`src/app/api/cities/route.ts` risponde a `GET /api/cities?q=...`), che il client chiama con `fetch`.

  Le **mutazioni**, cioè le operazioni che modificano dati (`registerAction`, `setKnownCityAction`, `removeKnownCityAction`), sono Server Action. La **ricerca città** del modale, che legge soltanto, è un Route Handler. Le pagine renderizzate sul server non passano da nessuno dei due: chiamano gli use case direttamente.

  **Perché**:
  - le Server Action vengono eseguite una alla volta, in coda, non si possono annullare e sono sempre richieste `POST`, che non si mettono in cache. Per una ricerca mentre si digita è un problema: scrivendo "Ro" e poi "Roma", la ricerca di "Roma" aspetta che finisca quella di "Ro", ormai inutile, e ogni ricerca arriva al server anche se identica a una già fatta. Con una `GET` fatta con `fetch` ogni richiesta parte subito, un `AbortController` annulla quella precedente a ogni tasto, e le risposte si possono mettere in cache;
  - per le mutazioni invece le Server Action sono comode: il tipo di ritorno arriva al client senza scrivere niente, includono una protezione contro le richieste partite da altri siti (CSRF), e nello stesso punto si può riscrivere il cookie;
  - far chiamare a una pagina server il proprio Route Handler aggiungerebbe un giro HTTP inutile verso se stessa.

  Come si comporta la route:

  - **Pubblica e in cache.** Restituisce città uguali per tutti, senza dati dell'utente, quindi non richiede il cookie (`PUBLIC_API_PATHS`) e le risposte si riusano per un'ora (`Cache-Control`): la seconda ricerca di "Roma" non arriva al server.
  - **Risponde con un DTO**, cioè una forma dei dati pensata per il client e separata dal modello interno: `CitySearchResult` ha solo `id`, `name` e `country`, non l'intero `City`. Sta in `city-search-result.ts`, fuori dalla route, così il client lo importa senza trascinarsi dietro il catalogo.
  - **Scritta con Effect, per scelta didattica**: query troppo lunga → `400`, eccezione imprevista → `500`. È lo schema che servirà con un database.

  **In produzione** (non implementato):

  - **Database indicizzato** al posto del catalogo in memoria: ricerca asincrona e fallibile, quindi port `CityCatalog` ed Effect negli use case, con il guasto del database come errore (es. `503`).
  - **Rate limiting** della piattaforma o con un contatore condiviso (es. Redis): uno in memoria vale per un solo processo e non riconosce l'IP in modo affidabile.
  - **Una libreria di data fetching** lato client per richieste doppie, cache nel browser e nuovi tentativi.
  - **Osservabilità**: log strutturati, metriche, tracing.

- **Risultati mostrati come "Città, Paese", senza regione**

  La ricerca mostra "Springfield, Stati Uniti", non la regione o lo stato interno.

  **Perché**: la regione servirebbe solo a distinguere omonimi nello stesso paese, un caso raro che appesantirebbe ogni riga.

  **Limiti accettati**: due omonimi nello stesso paese si distinguono solo dopo la selezione, sulla mappa.

- **Nomi città anglicizzati: tabella di override per le principali**

  GeoNames usa il nome inglese per molte città note ("Rome", "Milan"). `CITY_NAME_OVERRIDES` in `infrastructure/city-catalog.ts` mette il nome italiano al posto di quello inglese per una trentina di città, usando l'id GeoNames come chiave.

  **Perché**: lo stesso nome serve per mostrare e per cercare, quindi senza la tabella cercare "Milano" non troverebbe niente. Una soluzione completa sarebbe sproporzionata per un prototipo.

  **In produzione**: la tabella verrebbe generata da uno script, dai nomi per lingua di GeoNames (`alternateNames`) o da Wikidata, e la ricerca indicizzerebbe più varianti di ogni nome (locale, italiano, altri).

  **Scartato**: un servizio di traduzione in tempo reale, anche in produzione, perché aggiunge dipendenza di rete e costi per un dato che non cambia.

## Registrazione e validazione

- **Email: solo controllo sintattico, con `Schema` di Effect**

  `registerTraveler` verifica che l'email abbia un formato plausibile (`Schema.pattern`), non che esista.

  **Perché**: basta a scartare gli errori di battitura, e nell'MVP non c'è nessuna integrazione reale con l'email. `Schema` fa già parte di `effect`, quindi niente librerie in più.

- **Numero WhatsApp: validazione reale per paese con `libphonenumber-js`**

  Il campo ha il selettore del prefisso (`react-phone-number-input`), e `parseWhatsAppNumber` in `domain/contact-format.ts` verifica che il numero sia valido per il suo paese e lo salva in formato internazionale (`"+393331234567"`).

  **Perché**: lunghezze e prefissi cambiano da paese a paese, e reimplementarli sarebbe fragile. Queste librerie sono lo standard in JavaScript.

- **Form di registrazione: submit gestito a mano, non `<form action>`**

  `RegisterForm` gestisce l'invio da sé (`onSubmit`) e chiama `registerAction`, invece di passarla all'attributo `action` del form.

  **Perché**: con `<form action>` React svuota i campi dopo ogni invio, anche in caso di errore: un'email non valida farebbe perdere tutto quello che l'utente aveva scritto.

## Build e test

- **Test in `__tests__/` per cartella**

  I test stanno in una sottocartella `__tests__/` dentro ogni cartella di sorgenti (es. `src/domain/__tests__/matching.test.ts`).

  **Perché**: i test non si mescolano ai sorgenti nell'elenco dei file, non c'è un secondo albero da tenere allineato a `src/`, ed è una convenzione che Jest riconosce senza configurazione.
