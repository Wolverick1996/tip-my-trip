# Eseguire un Effect: il confine con React

Usato per: il punto in cui un componente/route Next.js deve ottenere il risultato di un use case scritto con Effect.

## Il problema che risolve

Tutto ciò che si scrive con `Effect.gen`/`pipe` (use case, chiamate al port, ecc.) costruisce una _descrizione_ di un programma, non lo esegue — un po' come una Promise "lazy" invece che "eager". Finché si resta dentro il mondo Effect, si compongono descrizioni. React, però, lavora con Promise/valori concreti: da qualche parte serve un punto preciso in cui il mondo Effect "si accende" e produce un risultato reale.

## Come si usa: il meccanismo di base

```ts
const results = await Effect.runPromise(
  Effect.provide(
    findExpertsForTrip(cityIds, organizerId),
    FileTravelerRepositoryLive,
  ),
)
```

`Effect.runPromise` esegue l'Effect e restituisce una Promise normale — se l'Effect fallisce con un errore tipizzato, la Promise viene rigettata con quell'errore.

Questo è l'**unico** punto del codice dove il mondo Effect tocca il mondo React/Promise. Tutto il resto — `domain/`, `use-cases/`, il port, il `Layer` — non sa che React esiste, ed è per questo che resta testabile senza montare nessun componente.

## `ManagedRuntime`: centralizzare quale Layer è "quello vero"

Il meccanismo sopra funziona, ma se ogni pagina scrivesse `Effect.provide(effect, FileTravelerRepositoryLive)` per conto proprio, la Presentation dovrebbe importare direttamente l'implementazione concreta dell'infrastruttura — esattamente la conoscenza che nel pattern Ports & Adapters deve restare fuori da lì (è la stessa idea del `Factory.ts`/composition root discusso in `01-dependencies-context-and-layer.md`: la scelta di quale implementazione usare sta in un unico posto, non sparsa ovunque).

`ManagedRuntime.make(layer)` costruisce il Layer una volta e restituisce un oggetto con `runPromise` già "pre-collegato" a quel Layer:

```ts
// src/runtime.ts — unico punto che conosce gli adapter concreti
export const runtime = ManagedRuntime.make(Layer.mergeAll(FileTravelerRepositoryLive, FileTripRepositoryLive))
```

```ts
// nelle pagine: nessun import degli adapter, nessun Effect.provide
const results = await runtime.runPromise(findExpertsForTrip(cityIds, organizerId))
```

**Come fa `runtime` a "sapere" quale Layer usare per un Effect che non lo nomina mai?** Non c'è nessun binding per nome — è la stessa identità di `TravelerRepository` (il `Context.Tag` di `01`) usata in entrambi i posti come chiave. Ripercorrendo:

1. **`findExpertsForTrip`** fa `yield* TravelerRepository` dentro il suo `Effect.gen`. Questo non dice "usa l'adapter su file" — dice solo "cerca nel Context corrente qualcosa registrato sotto la chiave `TravelerRepository`, e dammelo". Il tipo risultante (`Effect<..., ..., TravelerRepository>`) è un segnaposto: "mi serve questa chiave", non un riferimento a un'implementazione specifica.
2. **`FileTravelerRepositoryLive`** è `Layer.succeed(TravelerRepository, {...implementazione...})` — costruisce un Context che contiene _esattamente_ quella chiave, con quel valore.
3. **`ManagedRuntime.make(Layer.mergeAll(FileTravelerRepositoryLive, FileTripRepositoryLive))`** costruisce quel Context una volta e lo tiene pronto dentro l'oggetto `runtime`.
4. Quando chiami `runtime.runPromise(findExpertsForTrip(...))`, il runtime fornisce quel Context all'Effect — è l'equivalente automatico di `Effect.provide(effect, quelContext)`. Quando l'esecuzione arriva a `yield* TravelerRepository`, cerca quella chiave nel Context fornito, la trova, e va avanti.

Il punto chiave: `domain/traveler-repository.ts` esporta un'unica classe `TravelerRepository`, e sia `find-experts-for-trip.ts` sia `file-traveler-repository.ts` importano _quella stessa_ classe — è il riferimento condiviso (non una stringa, non una convenzione di naming) a fare da chiave. Se per errore ne esistessero due copie diverse, il binding fallirebbe e TypeScript lo segnalerebbe a compile-time, perché i due `TravelerRepository` sarebbero tipi diversi.

Le pagine tornano a conoscere solo i use case. Se domani l'implementazione cambiasse (es. un vero backend), si tocca solo `src/runtime.ts`.

Nei **test** invece si continua a usare `Effect.provide` diretto con un `Layer` costruito lì per lì (vedi `01`): lì si vuole un Layer diverso a ogni test, non uno condiviso e a lunga vita come `runtime`.

**Alternativa in TypeScript puro.** Un use case sarebbe semplicemente una funzione `async` che ritorna una `Promise` direttamente — non esisterebbe questo passaggio esplicito, perché non c'è una fase "descrizione" separata da una fase "esecuzione". Il vantaggio del confine esplicito è che tutto ciò che sta a monte (use case, port, dominio) resta puramente dichiarativo e componibile finché non lo si esegue — comodo soprattutto nei test, dove si fornisce un `Layer` diverso e si esegue solo lì.

## `runSyncExit` ed `Exit`: tradurre il risultato in una risposta HTTP

Usato per: `GET /api/cities` (`src/app/api/cities/route.ts`, con `runSyncExit`), `GET /api/trip-matches` (`src/app/api/trip-matches/route.ts`, con `runPromiseExit`, vedi sotto "Quale funzione usare per eseguire il programma") e `runAction` (`src/app/lib/run-action.ts`), che fa lo stesso per le Server Action ma traduce l'esito in `{ error?: string }` invece che in una risposta HTTP.

`runtime.runPromise` restituisce il valore di successo, oppure **rigetta** la Promise se l'Effect fallisce. Nelle pagine va bene: o si usa `Effect.either` per trasformare un failure in un ramo della UI, oppure si lascia che l'errore arrivi alla pagina d'errore di Next. In una route API invece ogni esito deve diventare una risposta con lo status giusto: successo → `200`, failure previsto → `400`, defect → `500`. Serve quindi il risultato completo, non solo il valore.

`Effect.runSyncExit(effect)` esegue l'Effect in modo **sincrono** e restituisce un `Exit`, un valore che descrive com'è finita l'esecuzione. Non lancia mai, qualunque cosa sia successa dentro:

- `Exit.Success`, con il valore;
- `Exit.Failure`, con una **`Cause`**, che dice _perché_ è fallito: un failure (`Fail`, con l'errore tipizzato), un defect (`Die`, con l'eccezione), un'interruzione, o una combinazione di questi.

```ts
const exit = Effect.runSyncExit(searchCitiesByQuery(query))

return Exit.match(exit, {
  onSuccess: (results) => Response.json(results, { headers: { "Cache-Control": "..." } }),
  onFailure: (cause) => {
    if (Option.isSome(Cause.failureOption(cause))) {
      return Response.json({ error: "Query troppo lunga" }, { status: 400 })
    }
    console.error(Cause.pretty(cause))
    return Response.json({ error: "Errore interno" }, { status: 500 })
  },
})
```

- `Exit.match` è l'equivalente di uno `switch` sui due casi: il type-checker obbliga a gestirli entrambi.
- `Cause.failureOption(cause)` restituisce l'errore tipizzato se la causa contiene un failure (qui l'unico possibile è il `ParseError` della validazione), `None` altrimenti. `None` significa che il fallimento è un defect o un'interruzione.
- `Cause.pretty(cause)` produce una descrizione leggibile, con lo stack dell'eccezione, da scrivere nei log. Al client arriva solo un messaggio generico.

### Quale funzione usare per eseguire il programma

La scelta dipende da due domande:

- **Il programma chiede servizi?** Lo dice `R` in `Effect<A, E, R>`. Se chiede un port (es. `TravelerRepository`) serve `runtime`, che contiene il `Layer`; se `R = never` basta `Effect`.
- **Ha passi asincroni?** Se è tutto sincrono si usa `runSync…`; se c'è una Promise (una query a un database, o una funzione async come sotto), serve `runPromise…`.

|               | `R = never`                          | Con servizi                                                 |
| ------------- | ------------------------------------ | ----------------------------------------------------------- |
| **Sincrono**  | `Effect.runSyncExit` (`/api/cities`) | `runtime.runSyncExit`                                       |
| **Asincrono** | `Effect.runPromiseExit`              | `runtime.runPromiseExit` (`/api/trip-matches`, `runAction`) |

Le versioni `…Exit` non lanciano mai: restituiscono l'esito, che poi `Exit.match` traduce in status HTTP.

**Alternativa in TypeScript puro.** Un `try/catch` con dentro degli `if` per capire quale errore è arrivato, su un valore tipizzato `unknown`. Con `Exit` e `Cause` i casi sono enumerati e tipizzati, e il failure previsto è distinto dal defect già nella struttura dei dati.

## Portare una `Promise` dentro una pipeline Effect: `Effect.promise`

Usato per: `GET /api/trip-matches` (`src/app/api/trip-matches/route.ts`), che compone `findCurrentUser()` — una funzione `async` di `src/current-user.ts`, non scritta con Effect — dentro un `Effect.gen`.

Le sezioni precedenti mostrano il confine nella direzione "Effect → Promise": si finisce di comporre con Effect e si esegue con `runPromise`/`runSyncExit`. Qui succede il contrario: si sta scrivendo una pipeline Effect e serve il risultato di una funzione già scritta altrove come `async`/`Promise` normale. `findCurrentUser` resta così apposta, perché la usano anche pagine e Server Action `async` di per sé (Server Component, funzioni React): non ha nessun motivo per diventare un Effect solo per questa route, non è un port e non ha un errore tipizzato da propagare (ritorna sempre `Traveler | undefined`, mai un `throw`).

Il problema: `yield*` dentro `Effect.gen` funziona solo con valori `Effect`, non con `Promise`. Serve un modo per far entrare un risultato che arriva da fuori.

```ts
const organizer = yield* Effect.promise(() => findCurrentUser())
if (!organizer) {
  return yield* Effect.fail(new Unauthorized())
}
```

`Effect.promise(thunk)` prende una funzione che ritorna una `Promise` e la trasforma in un `Effect<A>`: quando la pipeline arriva a quel punto, chiama il thunk, aspetta la Promise e continua con il valore risolto così com'è (qui `A` è `Traveler | undefined`). Da lì in poi il resto della pipeline — `Effect.fail`, la chiamata allo use case — è Effect normale, e arriva insieme a tutto il resto a `Exit.match` in fondo alla route.

**`Effect.promise` vs `Effect.tryPromise`.** `Effect.promise` presuppone che la Promise non venga mai **rigettata**: se lo fosse, l'eccezione diventerebbe un _defect_ (un `Die`, non un failure tipizzato — vedi `docs/effect/02-typed-errors.md`), lo stesso trattamento di un bug imprevisto. Va bene per `findCurrentUser`, che è `async` ma non contiene nessun `throw`. `Effect.tryPromise` è la versione per una Promise che _può_ rigettare: prende in più una funzione `catch` che trasforma il rigetto in un errore tipizzato, così il fallimento entra nel tipo `E` invece di restare un defect — servirebbe per una `fetch` verso un servizio esterno o un'API di libreria che può lanciare, non qui.

**Quando NON serve.** Se `findCurrentUser` fosse già scritta con Effect (invece che `async`), basterebbe comporla con un semplice `yield*`, senza passare da `Effect.promise` — il passaggio esiste solo per attraversare il confine tra i due mondi, non è un pattern da applicare sempre.

**Alternativa in TypeScript puro.** Semplicemente `await findCurrentUser()` dentro una funzione `async` — esattamente cosa faceva la vecchia versione della route, prima di essere riscritta con Effect. Il valore ottenuto è identico a quello di `Effect.promise`; il vantaggio di quest'ultimo non sta nel dato, ma nel restare componibile con il resto della pipeline Effect (`Effect.fail`, `Effect.catchTag`) invece di dover gestire subito il caso `undefined` con un `if` isolato dal resto.
