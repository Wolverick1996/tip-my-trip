# Dipendenze: `Context.Tag` e `Layer`

Usati per: dare al use case `findExpertsForCity` un modo di leggere i `Traveler` senza dover sapere se vengono da un array in memoria o (un domani) da un vero database.

## Come si fa DI in TypeScript puro

Due strade ingenue, prima di arrivare a quella fatta bene.

- **Parametro esplicito, ripetuto a ogni livello** ("prop drilling" applicato alle funzioni) — se `findExpertsForCity` chiama `scoreTraveler`, che chiama `checkLanguageMatch`, e tutte e tre hanno bisogno del repository, va ripassato esplicitamente a ognuna, anche a quelle che lo usano solo per inoltrarlo oltre:

  ```ts
  function findExpertsForCity(repo: TravelerRepository, cityId: CityId) {
    return scoreTraveler(repo, cityId /* ... */)
  }
  function scoreTraveler(repo: TravelerRepository, cityId: CityId /* ... */) {
    return checkLanguageMatch(repo /* ... */)
  }
  function checkLanguageMatch(repo: TravelerRepository /* ... */) {
    /* ... */
  }
  ```

- **Singleton importato** — comodo, ma nasconde la dipendenza:

  ```ts
  import { travelerRepository } from "./the-repo"

  function findExpertsForCity(cityId: CityId) {
    return travelerRepository.findAll()   // dipendenza invisibile guardando la firma
  }
  ```

  Niente nella firma di `findExpertsForCity(cityId: CityId)` rivela che dipende da qualcosa di esterno. Sostituirlo in un test richiede mockare il modulo intero (`jest.mock("./the-repo")`), non semplicemente passare un valore diverso.

La strada **fatta bene** in hexagonal architecture, in stile funzionale, è questa:

**1. Il contratto** — un'interfaccia:

```ts
export interface TravelerRepository {
  findAll(): Promise<Traveler[]>
}
```

**2. L'implementazione concreta** — un oggetto, verificato dal compilatore contro l'interfaccia tramite structural typing (non serve `implements`, basta l'annotazione di tipo):

```ts
export const inMemoryTravelerRepository: TravelerRepository = {
  async findAll() { /* ... */ },
}
```

**3. Il use case dichiara di dipendere dall'interfaccia**, come parametro — un solo punto di iniezione, non ripetuto a ogni chiamata interna:

```ts
export const findExpertsForCity = (
  cityId: CityId,
  travelerRepository: TravelerRepository,
) => {
  // usa travelerRepository.findAll()
}
```

**4. Un composition root (`Factory.ts` o simile) inietta l'implementazione concreta**, una volta, all'avvio:

```ts
findExpertsForCity(cityId, inMemoryTravelerRepository)
```

Il use case conosce solo `TravelerRepository`, non `inMemoryTravelerRepository` né (un domani) Prisma o un altro ORM. Il binding è manuale (`Factory.ts` decide esplicitamente cosa passare), non un container con reflection/decorator: a runtime l'interfaccia sparisce del tutto (le interfacce TypeScript sono erase, non esistono compilate in JS), resta solo l'oggetto concreto passato come argomento.

Questo pattern funziona bene e risolve già **visibilità e type-safety**: se `Factory.ts` dimentica di passare l'argomento, o l'oggetto non rispetta l'interfaccia, TypeScript non compila. Effect non aggiunge questo — TypeScript lo fa già bene anche senza Effect.

## Cosa cambia davvero con `Context.Tag` + `Layer`

Tre differenze concrete rispetto al pattern sopra:

- **Il requisito si propaga da solo attraverso composizioni annidate, non solo a un livello.** Nel pattern sopra, se `findExpertsForCity` chiamasse internamente un'altra funzione che ha anch'essa bisogno di `TravelerRepository` (o di un port diverso), bisognerebbe passarglielo esplicitamente come ulteriore parametro — re-injection manuale a ogni nuovo livello di chiamata. Con Effect, se una funzione Effect ne chiama un'altra con `yield*` che richiede un port diverso, il tipo `Requirements` si unisce automaticamente ai due — un solo `Effect.provide` alla fine soddisfa tutto, qualunque sia la profondità della composizione.
- **Niente liste di parametri posizionali che crescono.** Nell'esempio reale, `Factory.ts` passa una sequenza di argomenti posizionali (`cardProviders, dbBnplRepository, instalmentRepository, dbAgentRepository, ...`) — funziona, ma più dipendenze si aggiungono più quella lista è fragile (ordine da rispettare, facile confondersi). `Layer` si combina (`Layer.merge`) e viene applicato per identità del `Context.Tag`, non per posizione.
- **`Context.Tag` non sparisce a runtime, a differenza di un'interfaccia TS.** È una classe reale (`extends Context.Tag(...)`), quindi esiste anche compilata in JS — deve esistere, perché Effect la usa come chiave per cercare l'implementazione giusta nell'ambiente quando esegue l'Effect (`Effect.provide`). Un'interfaccia TS pura, invece, è solo un controllo a compile-time: a runtime non ne resta traccia, come giustamente notato nell'esempio sopra.

Per un solo port in-memory come nel nostro vertical slice, il primo vantaggio è ancora marginale — diventa tangibile quando use case e port aumentano.

## Cosa sono, concretamente

**`Context`** è un contenitore di servizi, tipizzato — non è legato 1:1 a un `Effect`: si costruisce (da uno o più `Layer`) nel momento in cui esegui un Effect, e lo stesso `Context` può servire a eseguirne tanti diversi. Il parametro `R` di un `Effect` dice solo "cosa deve contenere il Context perché io possa girare" — l'Effect non "ha" un Context proprio, lo richiede quando arriva il momento.

**`Context.Tag`** è la chiave con cui un servizio viene cercato in un `Context`. È due cose insieme: un tipo TypeScript (la forma del servizio, come farebbe un'`interface`) e un valore reale a runtime. Deve esistere anche a runtime perché la ricerca nel `Context` avviene mentre il programma gira, non in compilazione — un'`interface` pura, erasa in compilazione, non potrebbe fare da chiave:

```ts
class TravelerRepository extends Context.Tag("TravelerRepository")<
  TravelerRepository,
  {
    readonly findAll: () => Effect.Effect<Traveler[]>
    readonly findById: (id: TravelerId) => Effect.Effect<Traveler>
  }
>() {}
```

`TravelerRepository` compare tre volte in quella dichiarazione, con tre ruoli diversi: la stringa `"TravelerRepository"` è l'identità a runtime del Tag (per convenzione uguale al nome della classe, ma potrebbe essere qualsiasi stringa); il nome della classe è quello che usi nel codice; il primo parametro generico è la classe che si autoreferenzia (un trick di TypeScript necessario perché Effect possa dedurre che `yield*` su questa classe restituisce se stessa come servizio).

`yield* TravelerRepository` significa: "cerca nel `Context` corrente l'implementazione registrata sotto questa chiave, e dammela".

**`Layer`** descrive come costruire un servizio da mettere in un `Context`. Un'app tipicamente ne ha più d'uno — uno per servizio — combinati insieme in un unico `Context` fornito una volta sola all'avvio, non un `Layer` a testa per ogni `Effect`. Nel nostro vertical slice, con un solo port, ce n'è uno solo e non c'è ancora nulla da combinare:

```ts
const InMemoryTravelerRepositoryLive = Layer.succeed(
  TravelerRepository,             // per quale Tag
  TravelerRepository.of({         // l'implementazione da registrare
    findAll: () => Effect.succeed(mockTravelers),
    findById: (id) => /* ... */,
  }),
)
```

Questa è la forma più semplice (`Layer.succeed`, consegna diretta di un'implementazione già pronta). `Layer` può fare anche di più — costruire un servizio che dipende da altri, che può fallire nella costruzione, o che gestisce un ciclo di vita (apertura/chiusura di una risorsa) — ma per il nostro port in-memory non serve: non c'è nessuna vera "costruzione" da fare.

## Come si usano insieme nel use case

Il port `TravelerRepository` (definito sopra) si richiede con `yield*`, dentro un `Effect.gen`:

```ts
const findExpertsForCity = (cityId: CityId, organizerId: TravelerId) =>
  Effect.gen(function* () {
    const repo = yield* TravelerRepository   // "dammi qualcosa che soddisfi questo port"
    const organizer = yield* repo.findById(organizerId)
    const travelers = yield* repo.findAll()
    return matchTravelers({ cityIds: [cityId] }, organizer, travelers)   // la funzione pura di matching
  })
```

Il tipo risultante è `Effect<MatchResult[], SomeError, TravelerRepository>`. Quel terzo parametro ("Requirements") dice al type-checker: "per eseguire questo Effect, deve esistere un `TravelerRepository` nell'ambiente". Se ce lo si dimentica, il codice non compila — come col pattern interfaccia + Factory sopra, ma qui il requisito si accumula da solo componendo funzioni, senza dover ripetere il parametro a ogni nuovo livello.

Per eseguire il use case, si "fornisce" il `Layer` (`InMemoryTravelerRepositoryLive`, definito sopra):

```ts
Effect.provide(
  findExpertsForCity(cityId, organizerId),
  InMemoryTravelerRepositoryLive,
)
```

## Decisione per il progetto: solo `Layer`, niente Factory separata

Il `Factory.ts` del pattern sopra fa lo stesso lavoro di `Layer`: è un composition root che decide quale implementazione concreta iniettare. Nel progetto usiamo `Layer` come unico meccanismo di wiring e non teniamo anche una Factory a parte: farebbero lo stesso lavoro due volte (vedi `docs/decisions.md`).

## Nei test

Nei test si fornisce un `Layer` diverso, con dati di fixture scritti a mano, invece di mockare funzioni con `jest.fn()` — l'adapter in-memory è già l'implementazione "vera" per l'MVP, quindi anche nei test si fornisce una sua variante con dati diversi, non un doppio finto.
