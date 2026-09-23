# Errori tipizzati: `Data.TaggedError`

Usati per: i fallimenti prevedibili di un use case, es. "città non trovata" o "coordinatore non trovato" in `findExpertsForCity`.

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

Il campo `_tag: "CityNotFoundError"` (aggiunto automaticamente da `Data.TaggedError`) serve a distinguere errori diversi in uno `switch`/pattern match, se un use case può fallire in più modi:

```ts
switch (error._tag) {
  case "CityNotFoundError": /* ... */
  case "TravelerNotFoundError": /* ... */
}
```

## Distinzione importante: fallimento vs "nessun risultato"

Un errore tipizzato si usa solo per situazioni davvero eccezionali (un id che non esiste). "Nessun esperto trovato per una città" **non** è un errore: è un successo con una lista vuota — la ricerca ha funzionato, semplicemente non ci sono match. Confondere le due cose (far fallire un Effect quando in realtà il risultato è solo vuoto) è un errore di design che vale la pena testare esplicitamente.

## Nei test

Un `Effect` che fallisce non lancia un'eccezione JS in senso classico: il fallimento è nel canale `Error` del tipo, non qualcosa che va "catturato". Per asserire che un Effect fallisce con l'errore tipizzato giusto, si usa `Effect.flip` (inverte i canali successo/errore, così l'errore diventa un valore normale su cui fare assert dopo un `runPromise`):

```ts
const error = await Effect.runPromise(Effect.flip(programChePuòFallire))
expect(error._tag).toBe("CityNotFoundError")
```
