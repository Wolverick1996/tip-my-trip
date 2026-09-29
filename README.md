# TipMyTrip

Prototipo di una web app che mette in contatto chi organizza un viaggio con chi conosce davvero la destinazione, nato come progetto di apprendimento: l'obiettivo principale è imparare [Effect](https://effect.website), non costruire un prodotto completo.

> ### Scheda tecnica
>
> - **Stack**: Next.js · React · TypeScript · Effect · Mantine · Tailwind CSS · Jest
> - **Avvio rapido**: `npm install && npm run dev`, poi `http://localhost:3000` — dettagli in [Come eseguirlo e verificarlo](#come-eseguirlo-e-verificarlo)
> - **Documentazione**: [ROADMAP.md](./ROADMAP.md) (stato del progetto) · [AGENTS.md](./AGENTS.md) (visione e metodo di lavoro) · [docs/decisions.md](docs/decisions.md) (log delle decisioni) · [docs/effect/](docs/effect/README.md) (concetti di Effect usati)
> - **CI**: GitHub Actions esegue lint, test e build a ogni push/PR su `main`

---

## Perché questo progetto

L'idea nasce da un problema vissuto in prima persona come Travel Coordinator: organizzare un viaggio in una città che non si conosce bene è più facile parlando con chi quella città la conosce davvero, piuttosto che affidarsi a una guida generica o a ricerche tra Google Maps, TripAdvisor, blog, ecc. Il parere di chi una destinazione la vive, o l'ha vissuta a lungo, resta più affidabile di una fonte generalista, perché sa distinguere tra alternative invece di limitarsi a elencarle.

Il concetto di fondo è che ognuno di noi può essere un consulente di viaggi per qualcun altro: non serve essere professionisti del settore, basta aver viaggiato ed essere disposti a dare consigli sui luoghi in cui si è stati — anche solo la propria città d'origine. Questo si applica ad esempio a consigli su ristoranti, attività da fare o musei da visitare.

Per questo il bisogno non riguarda solo chi organizza viaggi per professione, ma chiunque viaggi per conto proprio e voglia lo stesso tipo di consiglio informato. Evolvendo il prodotto in questa direzione, il ruolo di "esperto" potrebbe anche diventare un'opportunità di business per i "viaggiatori provetti" che decidessero di offrire i propri servizi tramite la piattaforma (consulenze gratuite affiancate a consulenze a pagamento, più elaborate e su misura per l'utente).

## Cosa fa (in breve)

Un solo tipo di account copre due ruoli, che spesso coincidono nella stessa persona: chi organizza un viaggio selezionando le città da visitare, e chi quelle città le conosce e si rende disponibile per dare consigli. Qui è riassunto il flusso a livello utente; dominio, algoritmo di matching e user journey completo sono in [docs/product-brief.md](docs/product-brief.md).

La registrazione è volutamente minimale: nome, lingue conosciute e almeno un contatto tra WhatsApp ed email.

Dopo la registrazione, l'utente atterra sul suo "mondo", una mappa interattiva delle proprie città conosciute. Aggiungendone una e scegliendo il livello di conoscenza (Base, Expert o Local) diventa un conoscitore di quel luogo, eleggibile per essere contattato per consigli sulla destinazione.

Nella sezione dei viaggi, l'utente può invece creare un viaggio selezionando le città che attraverserà. Un algoritmo di matching assegna un punteggio ai viaggiatori che conoscono quelle città e condividono almeno una lingua con l'organizzatore; chi non passa questi due filtri non compare tra i risultati, nemmeno con un punteggio basso. Sulla lingua si potrebbe tornare se in futuro il prodotto introducesse una chat con traduzione integrata, oggi esplicitamente fuori scope (vedi [AGENTS.md](./AGENTS.md)).

Per ogni candidato che passa i filtri si vedono punteggio, città coperte con il relativo livello di expertise e lingue in comune, inline nel flusso di creazione del viaggio. L'organizzatore sceglie quali tenere come riferimento: salvato il viaggio, accanto a ogni esperto scelto ne ritrova i contatti (WhatsApp/email), e ha così già a portata di mano le persone a cui chiedere consiglio per ciascuna tappa.

L'app permette infine di modificare ed eliminare città conosciute, e di eliminare viaggi creati.

## Cosa non fa, e perché

Non c'è chat, non c'è autenticazione reale, non c'è un motore di matching basato su machine learning, non c'è un ambiente di produzione (hosting, monitoring, scalabilità, traffico concorrente): il prototipo gira solo in locale.

La lista di esclusioni è definita fin dall'inizio in [AGENTS.md](./AGENTS.md), sotto "MVP — dentro e fuori". Ogni esclusione ha una ragione precisa:

- la chat è un prodotto a sé (infrastruttura realtime, notifiche, storicizzazione lato server): i pulsanti di contatto sono link reali verso WhatsApp (`wa.me`) ed email (`mailto:`), solo il numero e l'indirizzo dietro sono fittizi. Bastano a chiudere il prototipo, senza costruire un secondo prodotto dentro il primo;
- l'autenticazione reale è un problema già risolto altrove (Firebase o Auth0, per dire): costruirla da zero non insegna niente di nuovo su Effect o sul dominio, aggiunge solo superficie da mantenere;
- per lo stesso motivo non c'è un vero profile management: modificare i propri dati (nome, lingue, contatti) dopo la registrazione è un CRUD generico che non aggiunge nulla da imparare — la gestione post-registrazione resta limitata a città conosciute (`/my-world`) e viaggi (`/my-trips`);
- il matching deve restare una funzione pura e spiegabile — città in comune, lingue condivise, nessuna scatola nera — perché è quello che il dominio richiede: un modello ML sarebbe un peggioramento travestito da sofisticazione;
- un ambiente di produzione vero non aggiunge niente all'esercizio: l'obiettivo è imparare Effect e un'architettura pulita, non gestire hosting o operatività.

Una nota a parte, diversa dalle esclusioni sopra: il "profilo dell'esperto" non è mai diventato una pagina o sezione a sé — le informazioni (punteggio, città coperte, expertise, lingue, contatti) si vedono già inline nel flusso di creazione del viaggio e nel viaggio salvato. Non è una scelta di scope come le altre, ma di implementazione: una pagina dedicata non avrebbe aggiunto valore rispetto a mostrarle dove servono.

## Scelte tecniche principali

Questa sezione raccoglie solo le scelte tecniche più importanti, che senz'altro varrebbe la pena menzionare presentando il prototipo; il log completo, comprese le decisioni più specifiche, è in [docs/decisions.md](docs/decisions.md).

### Architettura esagonale pragmatica, non da manuale

Il dominio (`src/domain/`) contiene le regole di business e dichiara di cosa ha bisogno dall'esterno tramite un "port" (un'interfaccia, es. `TravelerRepository`); l'infrastruttura implementa quel port (oggi su file JSON); la presentation (le pagine React) non parla mai direttamente con l'infrastruttura, ma passa sempre da uno use case. In pratica: passare da file JSON a un database vero significa scrivere solo una nuova implementazione del port, senza toccare dominio o interfaccia.
L'alternativa più semplice sarebbe stata nessuna architettura formale: leggere e scrivere i file JSON direttamente dentro le route o i componenti, come capita spesso in un prototipo usa-e-getta.

**Perché**: uno degli obiettivi del progetto è imparare a strutturare un'app Effect tenendo dominio e infrastruttura disaccoppiati, e l'architettura esagonale si presta bene ai meccanismi di dependency injection di Effect (i `Layer`).

**Compromesso**: il pattern non è applicato ovunque allo stesso modo — dati statici come il catalogo delle città, le lingue e i livelli di expertise sono esportati direttamente, senza un port dedicato, perché non hanno un'implementazione alternativa da sostituire. È una versione un po' più snella di quella "classica", più improntata alla facilità di lettura, testing e modifica.

### Stack tecnologico familiare, design system pronto all'uso, UI mobile first

Con Effect già come scoglio principale, il resto dello stack è una scelta deliberatamente conservativa: limitare le novità tecnologiche introdotte in parallelo concentra l'impegno di apprendimento su Effect. Per l'interfaccia è stato importato un design system (Mantine), con i suoi componenti pronti all'uso (bottoni, campi, dialog, notifiche), invece di costruirli da zero: l'alternativa sarebbe stata partire da solo Tailwind e disegnare ogni componente a mano. Per lo stesso motivo l'interfaccia è pensata come mobile-first — una sola colonna centrata, pochi breakpoint per aggiustamenti minori — invece di un layout desktop dedicato (sidebar, colonne affiancate): il caso d'uso reale (organizzare un viaggio, guardare una mappa, cercare un esperto) è quello più comune da telefono, e due layout avrebbero aggiunto complessità senza insegnare niente in più su Effect.

**Perché**: Effect non è legato al frontend, quindi il tempo investito a rifinire l'interfaccia — componenti da zero o un secondo layout desktop — non avrebbe portato benefici di apprendimento aggiuntivi su Effect o sul dominio.

**Compromesso**: meno controllo sul dettaglio visivo rispetto a componenti custom, e su desktop il prototipo funziona ma non sfrutta lo spazio extra (stesso layout stretto, solo centrato) — entrambi accettabili perché la resa estetica non è l'obiettivo dell'esercizio.

### Effect per dependency injection ed errori tipizzati, non ovunque

Effect si ferma ai port e agli errori previsti, non è ovunque nel codice: le regole di dominio, matching incluso (`src/domain/matching.ts`), restano funzioni pure (nel dominio Effect compare solo nella definizione di port, errori e schemi di validazione), e use case di puro lookup come `get-city` o `search-cities` restano funzioni normali. Viene utilizzato solo dove c'è una dipendenza da iniettare (i port, tramite i `Layer` già citati per l'architettura) o un errore previsto da propagare nel tipo invece che in un `throw` invisibile alla firma — esattamente i due casi in cui, in TypeScript puro, si userebbe un'interfaccia con composition root o un tipo di ritorno esplicito (i meccanismi che Effect aggiunge sopra sono approfonditi in [docs/effect/01-dependencies-context-and-layer.md](docs/effect/01-dependencies-context-and-layer.md) e [docs/effect/02-typed-errors.md](docs/effect/02-typed-errors.md)).

**Perché**: sulla distinzione tra un errore previsto (es. organizzatore non trovato) e un difetto imprevisto (es. un file JSON corrotto) il vantaggio è reale già oggi. Nelle due route scritte con Effect (`GET /api/cities`, `GET /api/trip-matches`) questa distinzione diventa direttamente una risposta HTTP diversa (400 contro 500), senza dover ispezionare a mano un errore generico dentro un `catch`. Non tutto quello che "potrebbe non andare" è però un errore previsto: una città non trovata è `undefined`, una ricerca senza risultati è un array vuoto — modellarli come un errore tipizzato sarebbe stato usare Effect per cerimonia, non per risolvere un problema reale.

**Compromesso**: con due soli port (`TravelerRepository`, `TripRepository`) oggi, il vantaggio della dependency injection di Effect è invece ancora marginale — lo stesso risultato si otterrebbe con interfacce e un composition root manuale — ed entrambe le route, più le cinque Server Action che scrivono dati, sono scritte interamente con Effect anche dove un semplice `if` più `try/catch` sarebbe bastato. È una scelta di apprendimento deliberata: esercitare da subito l'intero pattern, in vista di quando use case, port ed errori asincroni cresceranno davvero.

### Matching semplice e spiegabile, deliberatamente senza machine learning

Il matching è una funzione pura: due filtri di esclusione (nessuna città o nessuna lingua in comune con l'organizzatore) e un punteggio 0-100 che pesa copertura delle città e livello di expertise, mostrato in UI con il relativo breakdown testuale. Un modello più sofisticato (pesi appresi dai dati, collaborative filtering) non è stato preso in considerazione.

**Perché**: sarebbe stato un eccesso di complessità per un prototipo, ancora prima che un problema di spiegabilità — e comunque un punteggio che non si sa spiegare a un organizzatore non è utile qui. I pesi restano arbitrari ma dichiarati, e cambiarli è una modifica di due numeri, non un retraining.

**Compromesso**: con pochi candidati il punteggio distingue bene; con tanti smette di farlo. L'expertise ha solo 3 livelli e la copertura è vincolata al numero di città del viaggio, quindi con una base utenti grande è normale che decine di candidati finiscano con lo stesso punteggio esatto — oggi lo spareggio è per numero di città coperte e poi alfabetico, un criterio che non dice nulla su chi sia davvero il migliore tra pari. In futuro, l'algoritmo potrebbe complicarsi per dare più risoluzione (es. punteggi dalle consulenze date come peso aggiuntivo), ma servirebbe più fine-tuning e coinvolgimento di business/prodotto per capire la direzione giusta.

### Persistenza su file JSON dietro un port, già nella forma che avrebbe in produzione

Traveler e viaggi sono salvati in file JSON su disco, dietro `TravelerRepository`/`TripRepository`: in produzione sarebbe una query sul database filtrata per città, qui invece il matching scorre il JSON di mock — passare a un database vero significa scrivere un altro adapter, non toccare dominio o use case.

**Perché**: un database vero è già fuori scope per l'intero MVP (vedi [Cosa non fa](#cosa-non-fa-e-perché)); tra le alternative compatibili con questo vincolo, il JSON su file resta la più adatta a questo prototipo, oltre che facilmente intercambiabile quando si passasse davvero a un DB. Sono state scartate le altre due praticabili: dati nel cookie (limite di ~4KB, avrebbe imposto tetti arbitrari su viaggi e città conosciute) e una copia in `localStorage` (il server non la vede, avrebbe richiesto uno stato "ripristino sessione" solo per la demo).

**Compromesso**: quello di un prototipo dichiarato — nessun lock, nessuna migrazione, un id di sessione nel cookie non firmato — accettabile perché coerente con l'assenza di autenticazione reale nell'MVP.

### Testing mirato, non a coverage

Si testa solo ciò che aggiunge confidenza reale: regole di dominio, matching, use case, edge case, gestione degli errori e le parti scritte con Effect, sfruttandolo quando possibile invece di aggirarlo con mock generici. L'alternativa sarebbe stata puntare a una percentuale di coverage; scartata perché un numero alto non dice se i test verificano qualcosa che conta.

**Perché**: il matching, essendo una funzione pura, è dove si investe di più; il repository dei traveler su file è testato anche su dati corrotti, perché lì un fallimento silenzioso vorrebbe dire perdita di dati non rilevata. Dove il codice usa già Effect, i test lo sfruttano invece di aggirarlo con un framework di mocking a parte: un `Layer.succeed` con dati in memoria fa da test double esplicito, `Effect.flip` permette di asserire su un errore tipizzato con un `expect` normale — stessa lingua del codice che testano.

**Compromesso**: cosa valga la pena testare resta un giudizio, non una metrica. Se in futuro uno use case oggi di pura delega (`get-city`, `search-cities`, `get-traveler`) guadagnasse una regola propria, nessun numero di coverage lo segnalerebbe: tocca a chi lo tocca accorgersene e aggiungere un test.

## Uso dell'AI

Il progetto è volutamente AI-driven. Il punto di partenza è stato un master prompt ([docs/master-prompt.md](docs/master-prompt.md)), scritto con cura a partire dall'idea originale per descrivere nel modo più completo possibile problema, obiettivi e vincoli.

L'obiettivo era farsi guidare dall'AI nell'apprendimento di Effect: è stato chiesto che, ogniqualvolta venisse introdotto un nuovo concetto, venisse generata una documentazione esaustiva sull'argomento. Così è nata `docs/effect`: imparare le potenzialità della libreria sul proprio caso d'uso reale è stato molto più produttivo e stimolante che costruire le classiche app da tutorial. La documentazione, numerata e ordinata per argomento, resta riutilizzabile in futuro, come degli appunti universitari. In parallelo, è stato chiesto all'AI di generare e mantenere nel corso degli sviluppi i file di roadmap e decisions, anch'essi ovviamente rifiniti di volta in volta.

Sono stati inoltre definiti 8 ruoli come subagent Claude Code reali (Product Manager, Architect, Test Architect, Code Reviewer, ecc.), ognuno con accesso ristretto ai tool coerente col ruolo — es. il Code Reviewer non può modificare codice, solo segnalarlo — invocati quando la decisione rientrava nel loro ambito, invece di discutere tutto genericamente con un solo assistente. Un po' un overkill per alcuni ruoli, in particolare Business Strategist (visto che lo scope del prototipo era già stabilito a monte) o Test Architect (i test non sono il core dell'esercizio), ma averli lì non costa nulla, e in uno scenario di produzione verrebbero interpellati senz'altro più di quanto fatto finora. È stato anche chiesto espressamente all'AI di non assecondare le scelte fatte ma di portare un parere critico tramite l'agent di riferimento, soprattutto dove lo scope non è di pertinenza diretta di un profilo da Software Engineer (es. Business Strategist).

L'idea era di lavorare quasi "in pair" con Claude Code, non come autocomplete ma seguendo un processo esplicito documentato in [AGENTS.md](./AGENTS.md): per ogni funzionalità si parte da capire l'obiettivo, si evidenziano ambiguità ed edge case, si decide uno scope, si implementa, si scrivono i test necessari, si aggiornano documentazione e roadmap, si fa una review manuale, supportata dagli agent pertinenti — Code Reviewer e Architect di norma, Test Architect per interventi sui test, Product Manager per decisioni di alto livello. Ogni modifica è passata da quella review, spesso con richieste di semplificare codice o struttura prima di considerarla chiusa; il commit, in particolare, non è mai stato delegato: resta sempre un passo manuale, fatto dopo aver rivisto il diff.

## Lezioni apprese e prossimi passi

Il progetto è stato utilissimo per imparare un sacco di concetti interessanti di Effect, documentati man mano nel corso degli sviluppi: la docs, generata con l'AI, è stata rivista e iterata con prompt volti a renderla via via più chiara e comprensibile ("spiegami meglio cosa fa questo", "rendi il concetto più semplice", "fornisci un esempio preso dal nostro codice", "spiegamelo a confronto col pattern classico", ecc.).

Al di là dei singoli concetti (elencati in [docs/effect/README.md](docs/effect/README.md)), la cosa più importante è stata proprio avere riscontro tangibile su quella che inizialmente era una percezione: Effect dà al codice una struttura dichiarativa utile non solo a chi lo legge, ma anche — e forse soprattutto — a un'AI che ci lavora. È una scelta di design dello strumento che si rivela lungimirante in un'epoca in cui scrivere codice è un'attività sempre più delegata a questo tipo di strumenti. Porta anche la programmazione funzionale un passo oltre TypeScript "puro": rende esplicito nel tipo ciò che di solito resta nascosto nel codice, e la composizione di `Effect` sostituisce le classiche catene di funzioni con `try/catch` annidati.

La curva di apprendimento di Effect, anche per via della sua sintassi non proprio intuitiva, è piuttosto alta, e la sensazione è che una settimana di full immersion sia servita solo a grattare la superficie: i prossimi passi naturali sono consolidare i concetti appresi con più pratica e affrontare quelli rimasti fuori, con lo stesso approccio documentativo adottato qui, che si è rivelato molto efficace. Il primo candidato è la concorrenza, con `Effect.all` e le Fiber: oggi, ad esempio, `findExpertsForTrip` legge organizzatore e candidati uno dopo l'altro, anche se le due letture sono indipendenti.

## Come eseguirlo e verificarlo

```
npm install
npm run dev     # dev server su http://localhost:3000
npm test        # test Jest
npm run lint    # ESLint + Prettier
npm run build   # build di produzione
```

Con `npm run dev` attivo si può navigare l'app liberamente: registrarsi, aggiungere città al proprio mondo e creare viaggi.

Il matching lavora di default sui viaggiatori mock già presenti nei dati; per avere riscontro anche su un profilo reale si può aprire una seconda scheda in incognito e registrare lì una seconda utenza, con almeno una lingua in comune con la prima (altrimenti il filtro linguistico la escluderebbe comunque dai risultati). Aggiunta a quel secondo profilo una o più città conosciute, si torna sulla prima utenza e si crea un viaggio che includa quelle città: tra i risultati del matching dovrebbe comparire proprio il secondo utente come esperto.

Per ripartire da una situazione pulita basta cancellare sia il cookie di sessione sia la cartella `.data/`, dove sono salvati i profili creati.
