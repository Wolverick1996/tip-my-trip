# Eseguire un Effect: il confine con React

Usato per: il punto in cui un componente/route Next.js deve ottenere il risultato di un use case scritto con Effect.

## Il problema che risolve

Tutto ciò che si scrive con `Effect.gen`/`pipe` (use case, chiamate al port, ecc.) costruisce una *descrizione* di un programma, non lo esegue — un po' come una Promise "lazy" invece che "eager". Finché si resta dentro il mondo Effect, si compongono descrizioni. React, però, lavora con Promise/valori concreti: da qualche parte serve un punto preciso in cui il mondo Effect "si accende" e produce un risultato reale.

## Come si usa: il meccanismo di base

```ts
const results = await Effect.runPromise(
  Effect.provide(
    findExpertsForCity(cityId, organizerId),
    InMemoryTravelerRepositoryLive,
  ),
)
```

`Effect.runPromise` esegue l'Effect e restituisce una Promise normale — se l'Effect fallisce con un errore tipizzato, la Promise viene rigettata con quell'errore.

Questo è l'**unico** punto del codice dove il mondo Effect tocca il mondo React/Promise. Tutto il resto — `domain/`, `use-cases/`, il port, il `Layer` — non sa che React esiste, ed è per questo che resta testabile senza montare nessun componente.

## `ManagedRuntime`: centralizzare quale Layer è "quello vero"

Il meccanismo sopra funziona, ma se ogni pagina scrivesse `Effect.provide(effect, InMemoryTravelerRepositoryLive)` per conto proprio, la Presentation dovrebbe importare direttamente l'implementazione concreta dell'infrastruttura — esattamente la conoscenza che nel pattern Ports & Adapters deve restare fuori da lì (è la stessa idea del `Factory.ts`/composition root discusso in `01-dependencies-context-and-layer.md`: la scelta di quale implementazione usare sta in un unico posto, non sparsa ovunque).

`ManagedRuntime.make(layer)` costruisce il Layer una volta e restituisce un oggetto con `runPromise` già "pre-collegato" a quel Layer:

```ts
// src/runtime.ts — unico punto che conosce InMemoryTravelerRepositoryLive
export const runtime = ManagedRuntime.make(InMemoryTravelerRepositoryLive)
```

```ts
// nelle pagine: nessun import di InMemoryTravelerRepositoryLive, nessun Effect.provide
const results = await runtime.runPromise(findExpertsForCity(cityId, organizerId))
```

**Come fa `runtime` a "sapere" quale Layer usare per un Effect che non lo nomina mai?** Non c'è nessun binding per nome — è la stessa identità di `TravelerRepository` (il `Context.Tag` di `01`) usata in entrambi i posti come chiave. Ripercorrendo:

1. **`findExpertsForCity`** fa `yield* TravelerRepository` dentro il suo `Effect.gen`. Questo non dice "usa l'in-memory" — dice solo "cerca nel Context corrente qualcosa registrato sotto la chiave `TravelerRepository`, e dammelo". Il tipo risultante (`Effect<..., ..., TravelerRepository>`) è un segnaposto: "mi serve questa chiave", non un riferimento a un'implementazione specifica.
2. **`InMemoryTravelerRepositoryLive`** è `Layer.succeed(TravelerRepository, {...implementazione...})` — costruisce un Context che contiene *esattamente* quella chiave, con quel valore.
3. **`ManagedRuntime.make(InMemoryTravelerRepositoryLive)`** costruisce quel Context una volta e lo tiene pronto dentro l'oggetto `runtime`.
4. Quando chiami `runtime.runPromise(findExpertsForCity(...))`, il runtime fornisce quel Context all'Effect — è l'equivalente automatico di `Effect.provide(effect, quelContext)`. Quando l'esecuzione arriva a `yield* TravelerRepository`, cerca quella chiave nel Context fornito, la trova, e va avanti.

Il punto chiave: `domain/traveler-repository.ts` esporta un'unica classe `TravelerRepository`, e sia `find-experts-for-city.ts` sia `in-memory-traveler-repository.ts` importano *quella stessa* classe — è il riferimento condiviso (non una stringa, non una convenzione di naming) a fare da chiave. Se per errore ne esistessero due copie diverse, il binding fallirebbe e TypeScript lo segnalerebbe a compile-time, perché i due `TravelerRepository` sarebbero tipi diversi.

Le pagine tornano a conoscere solo i use case. Se domani l'implementazione cambiasse (es. un vero backend), si tocca solo `src/runtime.ts`.

Nei **test** invece si continua a usare `Effect.provide` diretto con un `Layer` costruito lì per lì (vedi `01`): lì si vuole un Layer diverso a ogni test, non uno condiviso e a lunga vita come `runtime`.

## Alternativa in TypeScript puro

Senza Effect, un use case sarebbe semplicemente una funzione `async` che ritorna una `Promise` direttamente — non esisterebbe questo passaggio esplicito, perché non c'è una fase "descrizione" separata da una fase "esecuzione". Il vantaggio di avere il confine esplicito è che tutto ciò che sta a monte (use case, port, dominio) resta puramente dichiarativo e componibile finché non lo si esegue — comodo soprattutto nei test, dove si fornisce un `Layer` diverso e si esegue solo lì.

## `runSyncExit` ed `Exit`: tradurre il risultato in una risposta HTTP

Usato per: `GET /api/cities` (`src/app/api/cities/route.ts`).

`runtime.runPromise` restituisce il valore di successo, oppure **rigetta** la Promise se l'Effect fallisce. Nelle pagine va bene: o si usa `Effect.either` per trasformare un failure in un ramo della UI, oppure si lascia che l'errore arrivi alla pagina d'errore di Next. In una route API invece ogni esito deve diventare una risposta con lo status giusto: successo → `200`, failure previsto → `400`, defect → `500`. Serve quindi il risultato completo, non solo il valore.

`Effect.runSyncExit(effect)` esegue l'Effect in modo **sincrono** e restituisce un `Exit`, un valore che descrive com'è finita l'esecuzione. Non lancia mai, qualunque cosa sia successa dentro:

- `Exit.Success`, con il valore;
- `Exit.Failure`, con una **`Cause`**, che dice *perché* è fallito: un failure (`Fail`, con l'errore tipizzato), un defect (`Die`, con l'eccezione), un'interruzione, o una combinazione di questi.

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

- **Il programma chiede servizi?** Lo dice `R` in `Effect<A, E, R>`. Se chiede un port (es. `TravelerRepository`) serve `runtime`, che contiene il `Layer`; se `R = never`, come nella route, basta `Effect`.
- **Ha passi asincroni?** Se è tutto sincrono, come qui, si usa `runSync…`; se c'è una Promise (es. una query a un database), serve `runPromise…`.

| | `R = never` | Con servizi |
|---|---|---|
| **Sincrono** | `Effect.runSyncExit` (la route oggi) | `runtime.runSyncExit` |
| **Asincrono** | `Effect.runPromiseExit` | `runtime.runPromiseExit` (la route con un database) |

Le versioni `…Exit` non lanciano mai: restituiscono l'esito, che poi `Exit.match` traduce in status HTTP.

**Alternativa in TypeScript puro.** Un `try/catch` con dentro degli `if` per capire quale errore è arrivato, su un valore tipizzato `unknown`. Con `Exit` e `Cause` i casi sono enumerati e tipizzati, e il failure previsto è distinto dal defect già nella struttura dei dati.
