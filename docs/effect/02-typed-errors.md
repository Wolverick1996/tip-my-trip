# Errori tipizzati: `Data.TaggedError`

Usati per: i fallimenti prevedibili di un use case, es. "città non trovata" o "organizzatore non trovato" in `findExpertsForCity`.

## Il problema che risolvono

In TypeScript puro, `throw new Error("città non trovata")` è invisibile alla firma della funzione: niente nel tipo di ritorno dice che quella funzione può fallire. Chi la chiama può dimenticarsi completamente il `try/catch`, e il compilatore non se ne accorge — lo si scopre solo a runtime, quando ormai è tardi.

## Cos'è `Data`

`Data` è il modulo di Effect per definire tipi di dato semplici — inclusi gli errori — con dei comportamenti di base già pronti, senza scriverli a mano. Il più rilevante per noi: **uguaglianza strutturale**. Con una classe JS normale, due istanze con gli stessi campi non sono mai uguali (`new Foo(1) !== new Foo(1)`, anche se il contenuto è identico) — con `Data`, lo sono, il che torna utile confrontando errori nei test.

`Data.TaggedError(tag)` è una funzione factory (stesso principio di `Context.Tag` in `01`) che restituisce una classe base da estendere, parametrizzata con la forma dei campi dell'errore:

```ts
class CityNotFoundError extends Data.TaggedError("CityNotFoundError")<{
  cityId: string
}> {}
```

La classe risultante fa tre cose insieme: estende `Error` di JavaScript (ha `.message`, uno stack trace, funziona con `instanceof Error`), imposta automaticamente il campo `_tag` al valore passato (`"CityNotFoundError"`), e ha uguaglianza strutturale. L'alternativa in TypeScript puro sarebbe scrivere a mano qualcosa come:

```ts
class CityNotFoundError extends Error {
  readonly _tag = "CityNotFoundError"
  constructor(readonly cityId: string) {
    super(`City not found: ${cityId}`)
  }
}
```

`Data.TaggedError` evita questo boilerplate e aggiunge l'uguaglianza strutturale in più, che a mano andrebbe implementata a parte.

## Come si usano

Un use case che può fallire con questo errore ha un tipo come `Effect<Success, CityNotFoundError, Requirements>` — il fallimento è **nel tipo**, non nascosto in un `throw`. Chi chiama la funzione deve gestirlo esplicitamente (o propagarlo consapevolmente), perché il type-checker lo obbliga a farlo.

Il campo `_tag: "CityNotFoundError"` (aggiunto automaticamente da `Data.TaggedError`) serve a distinguere errori diversi, se un use case può fallire in più modi — concettualmente come uno `switch`/pattern match:

```ts
switch (error._tag) {
  case "CityNotFoundError": /* ... */
  case "TravelerNotFoundError": /* ... */
}
```

Nella pratica, in questo progetto non scriviamo `switch` di questo tipo — si usano `Either`/`catchTag`, visti più sotto in "Gestire un errore tipizzato in produzione". Qui l'idea è solo: `_tag` è ciò che rende possibile distinguere un errore dall'altro, in qualsiasi forma lo si consumi poi.

## Distinzione importante: fallimento vs "nessun risultato"

Un errore tipizzato si usa solo per situazioni davvero eccezionali (un id che non esiste). "Nessun esperto trovato per una città" **non** è un errore: è un successo con una lista vuota — la ricerca ha funzionato, semplicemente non ci sono match. Confondere le due cose (far fallire un Effect quando in realtà il risultato è solo vuoto) è un errore di design che vale la pena testare esplicitamente.

## Gestire un errore tipizzato in produzione: `Either` e `Effect.either`

Stesso principio dello stato vuoto già visto sopra: "profilo non trovato" è un ramo diverso della UI, non un evento eccezionale da segnalare a qualcun altro — serve quindi un modo per controllare il risultato con un `if` normale, invece di gestire un canale d'errore.

**`Either<A, E>`** è un tipo dato che rappresenta uno dei due possibili esiti di qualcosa: un successo (`Right(valore)`, con un `A`) o un fallimento (`Left(errore)`, con un `E`) — mai entrambi, sempre uno dei due. Stesso principio di `Option` (che rappresenta "un valore o niente"), ma qui il "niente" porta con sé un'informazione — l'errore — invece di essere vuoto.

**`Effect.either(effect)`** prende un `Effect<A, E, R>` che può fallire e lo trasforma in un `Effect<Either<A, E>, never, R>`: non fallisce **mai** (il canale errore diventa `never`) — l'eventuale fallimento originale diventa un valore `Left(errore)` normale, non qualcosa che va gestito nel canale d'errore. Dopo averlo eseguito, hai in mano un oggetto JS qualsiasi, non più "un Effect":

```ts
const result = await runtime.runPromise(Effect.either(getTravelerProfile(travelerId)))
// result è { _tag: "Right", right: Traveler } oppure { _tag: "Left", left: TravelerNotFoundError }

if (Either.isLeft(result)) {
  return <p>Profilo non trovato.</p>
}

const traveler = result.right
```

**Perché non un semplice `try/catch`?** In TypeScript puro:

```ts
try {
  const traveler = await getTravelerProfilePromiseVersion(travelerId)
} catch (err) {
  // err qui è "unknown" — richiede un instanceof/cast a mano prima di poterlo usare
}
```

`try/catch` farebbe lo stesso lavoro per questo singolo caso, ma con una differenza concreta: `catch` in TypeScript tipizza sempre l'errore catturato come `unknown` (qualsiasi cosa può essere lanciata in JS, il compilatore non può saperlo), quindi va ristretto a mano. Con `Either`, `result.left` resta tipizzato esattamente `TravelerNotFoundError` — l'informazione arriva dal canale d'errore di Effect, non da un `throw` generico, e attraversa il confine fino a React senza perdere precisione.

Se in futuro servisse davvero distinguere *quale* errore è successo (non solo se è fallito), lo strumento è `Effect.catchTag(effect, "NomeTag", (errore) => altroEffect)` — intercetta solo quel tag, lascia propagare gli altri.

## Nei test

Un `Effect` che fallisce non lancia un'eccezione JS in senso classico: il fallimento è nel canale `Error` del tipo, non qualcosa che va "catturato". Per asserire che un Effect fallisce con l'errore tipizzato giusto, si usa `Effect.flip` (inverte i canali successo/errore, così l'errore diventa un valore normale su cui fare assert dopo un `runPromise`):

```ts
const error = await Effect.runPromise(Effect.flip(programChePuòFallire))
expect(error._tag).toBe("CityNotFoundError")
```
