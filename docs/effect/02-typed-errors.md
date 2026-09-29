# Errori tipizzati: `Data.TaggedError`

Usati per: i fallimenti prevedibili di un use case, es. "organizzatore non trovato" in `findExpertsForTrip`, o dati di registrazione non validi in `registerTraveler`.

## Il problema che risolvono

In TypeScript puro, `throw new Error("organizzatore non trovato")` è invisibile alla firma della funzione: niente nel tipo di ritorno dice che quella funzione può fallire. Chi la chiama può dimenticarsi completamente il `try/catch`, e il compilatore non se ne accorge — lo si scopre solo a runtime, quando ormai è tardi.

## Cos'è `Data`

`Data` è il modulo di Effect per definire tipi di dato semplici — inclusi gli errori — con dei comportamenti di base già pronti, senza scriverli a mano. Il più rilevante per noi: **uguaglianza strutturale**. Con una classe JS normale, due istanze con gli stessi campi non sono mai uguali (`new Foo(1) !== new Foo(1)`, anche se il contenuto è identico) — con `Data`, lo sono, il che torna utile confrontando errori nei test.

`Data.TaggedError(tag)` è una funzione factory (stesso principio di `Context.Tag` in `01`) che restituisce una classe base da estendere, parametrizzata con la forma dei campi dell'errore:

```ts
class TravelerNotFoundError extends Data.TaggedError("TravelerNotFoundError")<{
  travelerId: string
}> {}
```

La classe risultante fa tre cose insieme: estende `Error` di JavaScript (ha `.message`, uno stack trace, funziona con `instanceof Error`), imposta automaticamente il campo `_tag` al valore passato (`"TravelerNotFoundError"`), e ha uguaglianza strutturale. L'alternativa in TypeScript puro sarebbe scrivere a mano qualcosa come:

```ts
class TravelerNotFoundError extends Error {
  readonly _tag = "TravelerNotFoundError"
  constructor(readonly travelerId: string) {
    super(`Traveler not found: ${travelerId}`)
  }
}
```

`Data.TaggedError` evita questo boilerplate e aggiunge l'uguaglianza strutturale in più, che a mano andrebbe implementata a parte.

## Come si usano

Un use case che può fallire con questo errore ha un tipo come `Effect<Success, TravelerNotFoundError, Requirements>` — il fallimento è **nel tipo**, non nascosto in un `throw`. Chi chiama la funzione deve gestirlo esplicitamente (o propagarlo consapevolmente), perché il type-checker lo obbliga a farlo.

Il campo `_tag: "TravelerNotFoundError"` (aggiunto automaticamente da `Data.TaggedError`) serve a distinguere errori diversi, se un use case può fallire in più modi — concettualmente come uno `switch`/pattern match:

```ts
switch (error._tag) {
  case "TravelerNotFoundError": /* ... */
  case "TravelerNotFoundError": /* ... */
}
```

Nella pratica, in questo progetto non scriviamo `switch` di questo tipo — si usano `Either`/`catchTag`, visti più sotto in "Gestire un errore tipizzato in produzione". Qui l'idea è solo: `_tag` è ciò che rende possibile distinguere un errore dall'altro, in qualsiasi forma lo si consumi poi.

## Distinzione importante: fallimento vs "nessun risultato"

Un errore tipizzato si usa solo per situazioni davvero eccezionali (un id che non esiste). "Nessun esperto trovato per una città" **non** è un errore: è un successo con una lista vuota — la ricerca ha funzionato, semplicemente non ci sono match. Confondere le due cose (far fallire un Effect quando in realtà il risultato è solo vuoto) è un errore di design che vale la pena testare esplicitamente.

## Gestire un errore tipizzato in produzione: `Either` e `Effect.either`

Stesso principio dello stato vuoto già visto sopra: a volte un errore previsto va trattato come un valore assente per chi chiama, non rilanciato. `findCurrentUser` lo fa con la sessione: se il cookie punta a un profilo cancellato, `getTraveler` fallisce con `TravelerNotFoundError`, ma la funzione deve solo restituire `undefined`, come se la sessione non ci fosse — non propagare quell'errore. Lo strumento che rende possibile trattare un fallimento come un valore normale su cui fare un `if`, invece che come qualcosa da rilanciare o da gestire nel canale d'errore di Effect, è `Either`.

**`Either<A, E>`** è un tipo dato che rappresenta uno dei due possibili esiti di qualcosa: un successo (`Right(valore)`, con un `A`) o un fallimento (`Left(errore)`, con un `E`) — mai entrambi, sempre uno dei due. Stesso principio di `Option` (che rappresenta "un valore o niente"), ma qui il "niente" porta con sé un'informazione — l'errore — invece di essere vuoto.

**`Effect.either(effect)`** prende un `Effect<A, E, R>` che può fallire e lo trasforma in un `Effect<Either<A, E>, never, R>`: non fallisce **mai** (il canale errore diventa `never`) — l'eventuale fallimento originale diventa un valore `Left(errore)` normale, non qualcosa che va gestito nel canale d'errore. Dopo averlo eseguito, hai in mano un oggetto JS qualsiasi, non più "un Effect":

```ts
const result = await runtime.runPromise(Effect.either(getTraveler(travelerId)))
// result è { _tag: "Right", right: Traveler } oppure { _tag: "Left", left: TravelerNotFoundError }

return Either.isRight(result) ? result.right : undefined
```

**Perché non un semplice `try/catch`?** In TypeScript puro:

```ts
try {
  const traveler = await getTravelerPromiseVersion(travelerId)
} catch (err) {
  // err qui è "unknown": cattura anche un difetto imprevisto, non solo il "non trovato" che ci interessa
}
```

`try/catch` farebbe lo stesso lavoro per questo singolo caso, ma con una differenza concreta: `catch` cattura _qualsiasi_ eccezione, quindi un `try/catch` così ampio nasconderebbe un difetto reale (es. un bug, un file corrotto) dietro lo stesso `undefined` di "profilo non trovato". Con `Either`, `result.left` resta tipizzato esattamente `TravelerNotFoundError`: solo quel fallimento previsto diventa `undefined`, un difetto continua a propagare invece di sparire silenziosamente.

Qui c'è un solo tag possibile (`TravelerNotFoundError`), quindi non serve distinguere niente. Se invece una pipeline potesse fallire con tag diversi e servisse reagire solo a uno specifico, lasciando propagare gli altri, lo strumento è `Effect.catchTag(effect, "NomeTag", (errore) => altroEffect)`.

## Normalizzare più errori diversi in uno solo: `Effect.mapError`

Usato per: le Server Action (`src/app/my-world/actions.ts`, `src/app/my-trips/actions.ts`), dove una singola pipeline può fallire per motivi diversi — un `ParseError` di `Schema.decodeUnknown`, un `InvalidTripError` da `createTrip` — ma chi esegue la pipeline (`runAction`, in `src/app/lib/run-action.ts`) si aspetta sempre la stessa forma di errore, senza dover conoscere ogni variante.

`Effect.mapError(effect, (errore) => nuovoErrore)` trasforma il canale errore di un `Effect<A, E, R>` in un `Effect<A, E2, R>`, applicando la funzione solo se l'Effect fallisce (se ha successo non fa nulla). A differenza di `Effect.catchTag`, che intercetta _un tag specifico_ e lascia propagare gli altri, `mapError` trasforma _qualunque_ fallimento arrivi in quel punto — utile quando, come qui, non interessa distinguere i tag ma solo portare tutto a una forma comune:

```ts
const { cityId, level } = yield* Schema.decodeUnknown(SetKnownCityInput)(input).pipe(
  Effect.mapError(() => new InvalidInput({ message: "Dati non validi." })),
)
```

Qui il `ParseError` di Schema (che porta i dettagli tecnici di cosa non ha rispettato lo schema) diventa un `InvalidInput` locale con solo il messaggio da mostrare all'utente: il resto della pipeline, e `runAction` alla fine, vedono sempre lo stesso tipo di errore invece di uno diverso per ogni passo che può fallire.

**Non toglie niente al beneficio degli errori tipizzati.** Il tipo continua a costringere a gestire ogni fallimento — `mapError`/`catchTag` sono gli strumenti previsti per farlo, non un modo per aggirare il compilatore. Qui però il `() =>` ignora deliberatamente il `ParseError` originale invece di leggerci dentro (es. quale campo non rispettava lo schema): il tipo obbliga comunque a gestire il fallimento, ma non a farlo con la massima precisione possibile. Per un prototipo un messaggio generico basta; in un'app con più utenti attivi in parallelo, varrebbe la pena costruire il messaggio a partire dal `ParseError` invece di scartarlo.

**Alternativa in TypeScript puro.** Un `if`/`else` o un `try/catch` a ogni passo che può fallire, per tradurre a mano l'errore in un messaggio prima di continuare: stesso risultato, ma ripetuto esplicitamente invece che con un operatore riusabile.

## Nei test

Un `Effect` che fallisce non lancia un'eccezione JS in senso classico: il fallimento è nel canale `Error` del tipo, non qualcosa che va "catturato". Per asserire che un Effect fallisce con l'errore tipizzato giusto, si usa `Effect.flip` (inverte i canali successo/errore, così l'errore diventa un valore normale su cui fare assert dopo un `runPromise`):

```ts
const error = await Effect.runPromise(Effect.flip(programChePuòFallire))
expect(error._tag).toBe("TravelerNotFoundError")
```

## Failure e defect: due tipi di fallimento

Usato per: `GET /api/cities` (`src/app/api/cities/route.ts`), per distinguere una query non valida (risposta `400`) da un'eccezione imprevista (risposta `500`); `GET /api/trip-matches` lo stesso, con due failure diversi (`BadRequest`, `Unauthorized`) invece di uno solo.

Effect distingue due modi in cui un programma può fallire:

- **Failure**: un errore _previsto_, che fa parte del contratto della funzione. Sta nel tipo, nel canale `E` di `Effect<A, E, R>`, e chi chiama deve gestirlo. È tutto quello visto finora in questo file: `TravelerNotFoundError`, `InvalidRegistrationError`, e anche il `ParseError` che `Schema.decode` produce quando un dato non rispetta lo schema (vedi `04-validating-data-schema.md`).
- **Defect**: un errore _imprevisto_, cioè un bug o un guasto. Non sta nel tipo, perché nessuno lo ha dichiarato e il chiamante non può farci niente di sensato se non registrarlo e rispondere "qualcosa è andato storto". Per esempio un'eccezione lanciata dentro un `Effect.sync(() => ...)`, o un errore reso fatale di proposito con `Effect.die`.

Esempio dalla route:

```ts
const searchCitiesByQuery = (rawQuery: string) =>
  Effect.gen(function* () {
    const query = yield* Schema.decode(CityQuery)(rawQuery) // può fallire con ParseError → failure
    const cities = yield* Effect.sync(() => searchCities(query)) // se lancia → defect
    return cities.map(({ id, name, country }): CitySearchResult => ({ id, name, country }))
  })
```

Il tipo risultante è `Effect<CitySearchResult[], ParseError, never>`: nel canale d'errore compare solo `ParseError`. Il possibile `throw` dentro `searchCities` non c'è, ed è corretto così: non è un esito previsto della ricerca, è un bug.

**Alternativa in TypeScript puro.** Un `if` per la validazione e un `try/catch` attorno alla ricerca. Funziona, ma la distinzione "previsto contro imprevisto" la fa solo chi legge il codice: nel `catch` arriva tutto insieme, tipizzato `unknown`. Con Effect la distinzione è nel tipo: i failure hanno un tipo preciso, i defect no.

Come si traduce un fallimento, failure o defect, in una risposta HTTP è spiegato in `03-running-effects.md`, sezione "`runSyncExit` ed `Exit`".

**Nota.** In questa route Effect è usato soprattutto per imparare questo pattern: la ricerca è sincrona e non ha dipendenze, e la versione con `if` e `try/catch` era sufficiente (vedi `docs/decisions.md`, voce "Ricerca città dal client"). Il pattern diventerà necessario quando la ricerca passerà a un database, con errori veri e asincroni.
