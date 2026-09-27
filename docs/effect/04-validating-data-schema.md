# Validare dati: `Schema`

Usato per: controllare che l'email inserita in fase di registrazione abbia un formato sintatticamente valido (`registerTraveler`, `domain/contact-format.ts`), e che ogni lingua selezionata sia una di quelle che l'app conosce davvero (`registerTraveler`, `domain/language.ts`).

## Il problema che risolve

Fino ad ora `registerTraveler` controllava solo "il campo non è vuoto" — un `if` su una stringa. Controllare un **formato** (un'email ha una `@` e un dominio con un punto) con `if`/regex sparsi a mano è la stessa idea ma diventa presto ripetitivo, e il risultato del controllo (vero/falso) non porta con sé nessuna informazione su *cosa* non va — bisognerebbe scrivere il messaggio d'errore a mano ogni volta, vicino a ogni `if`.

## Cos'è `Schema`

`Schema` è il modulo di Effect per descrivere **la forma attesa di un dato** — non solo il tipo TypeScript (che sparisce a runtime), ma anche vincoli che TypeScript da solo non può esprimere, come "questa stringa deve rispettare questo pattern". Una definizione è dichiarativa, non una funzione scritta a mano:

```ts
import { Schema } from "effect"

const EmailAddress = Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
```

`Schema.String` è lo schema di base "una stringa qualsiasi"; `Schema.pattern(regex)` è un **filtro** che si aggiunge sopra con `.pipe(...)` — stesso operatore `pipe` già visto in `00-basics.md`, qui incatena "prima dev'essere una stringa, poi deve rispettare questo pattern" invece di comporre funzioni.

## Come si usa: `Schema.is`

Uno schema da solo non fa nulla — va eseguito contro un valore. Per il nostro caso (un controllo sì/no, non serve altro) basta `Schema.is`:

```ts
Schema.is(EmailAddress)("a@b.com") // true
Schema.is(EmailAddress)("non-una-email") // false
```

`Schema.is` restituisce un semplice `boolean` — nessun `Effect`, nessun canale d'errore: è una funzione pura di validazione, usabile in un normale `if` dentro `registerTraveler`:

```ts
if (input.contact.email && !Schema.is(EmailAddress)(input.contact.email)) {
  return yield* Effect.fail(new InvalidRegistrationError({ reason: "L'email non è in un formato valido." }))
}
```

Il messaggio d'errore resta scritto a mano vicino all'`if`, coerente con come `registerTraveler` gestisce già gli altri controlli (nome vuoto, nessuna lingua) — non serve altro per questo caso.

## Un altro filtro: `Schema.Literal`, uno tra un insieme di valori noti

`Schema.pattern` verifica un *formato* (una forma che la stringa deve rispettare). Per le lingue il controllo è diverso: non c'è un pattern, serve sapere se il codice è uno tra quelli che l'app supporta davvero (le ~40 lingue con una bandiera in `LANGUAGE_FLAGS`, non tutte le ~184 di `iso-639-1`). `Schema.Literal` costruisce uno schema che accetta solo esattamente i valori passati:

```ts
export const isSupportedLanguage = Schema.is(Schema.Literal(...Object.keys(LANGUAGE_FLAGS)))
```

`Object.keys(LANGUAGE_FLAGS)` dà l'elenco di codici a runtime (es. `["it", "en", "es", ...]`); `Schema.Literal(...)` li accetta come argomenti separati (da cui lo spread `...`) e costruisce uno schema che valida "questo valore è uno di questi, esattamente" — diverso da `Schema.pattern`, che valida una *forma*, non un'appartenenza a un insieme. Stesso `Schema.is` di prima per ottenere un `boolean` riusabile:

```ts
isSupportedLanguage("it") // true — è tra le lingue con bandiera
isSupportedLanguage("sw") // false — Swahili è un codice ISO 639-1 reale, ma non tra quelli che offriamo
```

## Trasformare, non solo controllare: `Schema.Trim` e `Schema.decode`

Usato per: la query di `GET /api/cities` (`src/app/api/cities/route.ts`).

`Schema.is` risponde solo sì o no. Per la query di ricerca servono due cose in più: il valore **ripulito** (senza spazi attorno) e, se non va bene, un errore che entri nel canale d'errore di Effect, non un `boolean`.

```ts
const CityQuery = Schema.Trim.pipe(Schema.maxLength(100))
```

- `Schema.Trim` non è solo un filtro, è una **trasformazione**: quando decodifica una stringa la restituisce già senza spazi iniziali e finali. Uno schema può quindi cambiare il dato, non solo verificarlo.
- `Schema.maxLength(100)` è un filtro, come `Schema.pattern`. Messo dopo la trasformazione, si applica alla stringa già ripulita: `"  lisb  "` viene prima ripulita in `"lisb"`, poi controllata.

Per eseguire uno schema dentro un programma Effect si usa `Schema.decode`:

```ts
const query = yield* Schema.decode(CityQuery)(rawQuery)
```

`Schema.decode(schema)(valore)` restituisce un `Effect<string, ParseError>`: in caso di successo il valore trasformato, altrimenti un failure tipizzato `ParseError`, con il dettaglio di quale vincolo non è rispettato. Dentro `Effect.gen`, `yield*` estrae il valore, oppure interrompe il programma propagando il `ParseError`, come qualunque altro errore tipizzato (vedi `02-typed-errors.md`).

**Quando `is` e quando `decode`.**
- `Schema.is` basta quando serve un controllo sì o no dentro un `if`, e il messaggio d'errore lo si scrive a mano, come in `registerTraveler`.
- `Schema.decode` serve quando si vuole il valore trasformato, oppure quando il fallimento deve entrare nel flusso di Effect.

## Validare oggetti che arrivano da fuori: `Schema.Struct` e `Schema.decodeUnknown…`

Usato per: i dati che una Server Action riceve dal browser (`createTripAction` in `src/app/my-trips/actions.ts`) e i file JSON letti dagli adapter (`src/infrastructure/json-file.ts`, `file-traveler-repository.ts`, `file-trip-repository.ts`).

**Il problema.** I tipi TypeScript esistono solo in compilazione. Quando i dati arrivano da fuori (la richiesta di un browser, un file su disco) il compilatore non può garantire niente: una Server Action è di fatto un endpoint pubblico, e un file può essere stato modificato a mano. Un cast come `input as CreateTripInput` fa solo tacere il compilatore; se i dati hanno una forma diversa, l'errore salta fuori più avanti, lontano dalla causa.

**Descrivere la forma di un oggetto.** Oltre agli schemi per valori singoli (`Schema.String`, `Schema.Literal`) ce ne sono per strutture composte:

```ts
const CreateTripInput = Schema.Struct({
  title: Schema.String,
  cityIds: Schema.Array(Schema.String),
  expertIds: Schema.Array(Schema.String),
})
```

- `Schema.Struct({ … })` descrive un oggetto con quei campi, ognuno con il suo schema.
- `Schema.Array(schema)` descrive un array i cui elementi rispettano `schema`.
- `Schema.optional(schema)` rende un campo facoltativo (es. `title` di un viaggio salvato).
- `Schema.mutable(…)` fa sì che il tipo risultante abbia array modificabili invece che `readonly`: di default gli schemi producono tipi `readonly`, e senza `mutable` non sarebbero assegnabili ai tipi del dominio (`Traveler[]`, `Trip[]`), che usano array normali.

Dallo schema TypeScript ricava anche il tipo, quindi descrizione a runtime e tipo in compilazione non possono andare fuori sincrono.

**Controllare un valore sconosciuto.** Le funzioni `decodeUnknown…` accettano un `unknown`, verificano che rispetti lo schema e restituiscono il valore tipizzato. Cambia solo il modo in cui segnalano il fallimento:

| Funzione | Se i dati non vanno bene | Usata in |
|---|---|---|
| `Schema.decodeUnknownEither(schema)(valore)` | restituisce un `Either`: `Left` con un `ParseError`, `Right` con il valore | `createTripAction`: un input sbagliato diventa un messaggio d'errore per l'utente |
| `Schema.decodeUnknownSync(schema)(valore)` | lancia un'eccezione | `readJsonFile`: un file corrotto è un guasto, e dentro `Effect.sync` diventa un defect (vedi `02-typed-errors.md`) |
| `Schema.decode(schema)(valore)` | restituisce un `Effect` che fallisce con `ParseError` | la route `GET /api/cities` (sezione sopra) |

```ts
const decoded = Schema.decodeUnknownEither(CreateTripInput)(input)
if (Either.isLeft(decoded)) {
  return { error: "Dati del viaggio non validi." }
}
const { title, cityIds, expertIds } = decoded.right // tipizzati
```

La scelta dipende da cosa significa il fallimento in quel punto: un errore previsto da mostrare (`Either`), un guasto da non gestire (`Sync`, che lancia), o un passo dentro un programma Effect (`decode`).

**Alternativa in TypeScript puro.** Controlli scritti a mano campo per campo (`typeof input.title === "string" && Array.isArray(input.cityIds) && …`), facili da dimenticare quando il tipo cambia, oppure una libreria di validazione in più. `Schema` fa già parte di `effect`.
