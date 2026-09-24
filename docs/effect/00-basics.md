# Le basi: il tipo `Effect` e la sintassi `Effect.gen`

Prima di tutto il resto, perché questi due elementi compaiono in ogni file successivo e senza capirli il resto non si legge.

## Cos'è un `Effect`

Un `Effect<A, E, R>` è la **descrizione** di un programma, non il suo risultato — un po' come una funzione non ancora chiamata, o una ricetta non ancora seguita. I tre parametri dicono:

- **`A`** — cosa produce se va a buon fine (il "successo").
- **`E`** — con cosa può fallire, se può fallire (il tipo dell'errore — vedi `02-typed-errors.md`).
- **`R`** — di cosa ha bisogno per essere eseguito (le dipendenze — vedi `01-dependencies-context-and-layer.md`).

Quindi `Effect<Traveler[], CityNotFoundError, TravelerRepository>` si legge: "un programma che, se eseguito, produce un array di `Traveler`, può fallire con `CityNotFoundError`, e per essere eseguito ha bisogno di un `TravelerRepository`".

Finché non lo esegui esplicitamente (vedi `03-running-effects.md`), un `Effect` non fa nulla — è solo una descrizione, componibile con altre descrizioni.

I due costruttori più semplici:

```ts
Effect.succeed(42)              // Effect<number, never, never> — successo garantito, nessun errore, nessuna dipendenza
Effect.fail(new MyError())      // Effect<never, MyError, never> — fallimento garantito
```

`never` nel tipo vuol dire "questo non può succedere" — `Effect.succeed(42)` non può mai fallire, quindi il suo canale errore è `never`.

Altri due costruttori che si usano spesso:

```ts
Effect.sync(() => mockTravelers.push(traveler))   // Effect<void, never, never> — esegue un side effect sincrono
Effect.void                                        // Effect<void, never, never> — non fa nulla, serve solo il "successo"
```

`Effect.sync(fn)` avvolge una funzione sincrona che fa qualcosa (una mutazione, una scrittura) e si assume non lanci eccezioni — usato ad esempio in `infrastructure/in-memory-traveler-repository.ts` per `save`, che deve solo aggiungere un elemento a un array, senza restituire un valore utile. `Effect.void` è una scorciatoia già pronta per "successo, nessun valore" — comodo nei test quando un metodo del port non serve davvero (es. un `save` finto che non deve fare nulla).

## Perché la sintassi sembra strana: `Effect.gen` e `yield*`

TypeScript non ha una sintassi nativa per scrivere "fai questo, poi questo, poi questo" in modo generico per qualsiasi tipo di computazione. Ha però i **generatori** (`function*`/`yield`), pensati originariamente per altro, e Effect li riusa per ottenere lo stesso risultato: scrivere codice sequenziale che sembra imperativo, anche se sotto sotto sta componendo `Effect` immutabili.

```ts
const program = Effect.gen(function* () {
  const a = yield* Effect.succeed(2)
  const b = yield* Effect.succeed(3)
  return a + b
})
// program: Effect<number, never, never>
```

`yield*` è l'operatore di "sblocco": dato un `Effect<A, E, R>`, `yield*` dentro `Effect.gen` ti dà direttamente il valore `A`, un po' come `await` ti dà il valore risolto di una `Promise`. La differenza è che `yield*` funziona con l'intero modello di Effect (errori tipizzati e dipendenze inclusi), non solo con l'asincronia.

Se uno degli `Effect` a cui fai `yield*` può fallire o ha una dipendenza, quel fallimento/dipendenza si propaga automaticamente al tipo di `program` — è esattamente il meccanismo che rende possibile la "propagazione automatica" di cui si parla in `01-dependencies-context-and-layer.md`.

Ogni `yield*` è un punto in cui "srotoli" un `Effect` per ottenere il suo valore, dentro una funzione che a sua volta produce un `Effect` più grande componendo i pezzi. Il tipo finale si costruisce sommando quello che ogni `yield*` porta con sé — vediamolo su `E`, con due funzioni ipotetiche che possono fallire in modo diverso:

```ts
declare function parseCityId(input: string): Effect.Effect<CityId, ParseError>
declare function loadCity(id: CityId): Effect.Effect<City, CityNotFoundError>

const program = Effect.gen(function* () {
  const cityId = yield* parseCityId(rawInput)   // Effect<CityId, ParseError>
  const city = yield* loadCity(cityId)          // Effect<City, CityNotFoundError>
  return city
})
```

- `yield* parseCityId(rawInput)` dà `cityId`, contribuisce `E = ParseError`.
- `yield* loadCity(cityId)` dà `city`, contribuisce `E = CityNotFoundError`.
- Il `return city` finale fissa `A = City`.

Sommando: `A = City`, `E = ParseError | CityNotFoundError` (unione dei due errori possibili). Quindi `program: Effect<City, ParseError | CityNotFoundError, never>` — un fallimento in uno qualsiasi dei due passaggi si propaga automaticamente al tipo finale, senza bisogno di scriverlo a mano.

`R` (le dipendenze) si somma esattamente con la stessa logica quando uno `yield*` richiede qualcosa — il meccanismo concreto per farlo (`Context.Tag`) è in `01-dependencies-context-and-layer.md`.

## `pipe`: l'altro stile, per composizione senza generatori

Effect offre anche `pipe`, per comporre operazioni senza generatori — utile per trasformazioni brevi. Due combinatori diversi, per due casi diversi:

- **`map`** quando il passaggio successivo è un valore semplice (`(A) => B`).
- **`flatMap`** quando il passaggio successivo è **un altro `Effect`** (`(A) => Effect<B, E2, R2>`) — se usassi `map` in quel caso otterresti un `Effect<Effect<B>>` annidato, che nessuno esegue da solo; `flatMap` lo "appiattisce" in un unico `Effect<B>`, unendo anche gli eventuali `E`/`R` del secondo Effect.

```ts
pipe(
  Effect.succeed(2),                             // Effect che contiene 2
  Effect.map((n) => n + 1),                      // valore semplice: 2 → 3
  Effect.flatMap((n) => Effect.succeed(n * 2)),   // Effect che restituisce un altro Effect: 3 → 6
)
// risultato: Effect che, eseguito, produce 6
```

Qui `Effect.succeed(n * 2)` è comunque un `Effect`, quindi il passaggio successivo a `map((n) => n + 1)` usa `flatMap`: se al suo posto ci fosse stato `map((n) => Effect.succeed(n * 2))`, il risultato sarebbe stato un `Effect<Effect<number>>` annidato — nessuno lo eseguirebbe automaticamente. Nella pratica capita ogni volta che il passaggio successivo è una funzione che a sua volta ritorna un `Effect` (es. un'altra chiamata a un repository, un altro use case) — anche se qui, essendo solo aritmetica, si sarebbe potuto scrivere altrettanto bene con due `map` di fila.

Ogni riga prende l'`Effect` prodotto dalla riga sopra e lo trasforma in uno nuovo — non è una sequenza di variabili come in `Effect.gen`, è una catena: il valore passa da uno step al successivo senza mai comparire come variabile intermedia.

Nel progetto usiamo principalmente `Effect.gen` per i use case (si legge come codice imperativo normale, più leggibile quando ci sono più passaggi in sequenza), e `pipe` solo dove la composizione è breve e lineare — non c'è una regola rigida, ma se un `Effect.gen` con 1-2 `yield*` diventasse più chiaro come `pipe`, va bene anche quello.

## Come leggere il resto della documentazione

Con questi due concetti (il tipo `Effect<A, E, R>` e la sintassi `Effect.gen`/`yield*`), gli esempi negli altri file di `docs/effect/` dovrebbero essere leggibili riga per riga. Se qualcosa non torna anche con queste basi, va segnalato e documentato qui — non dare per scontato che si capisca da soli.
