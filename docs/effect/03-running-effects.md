# Eseguire un Effect: il confine con React

Usato per: il punto in cui un componente/route Next.js deve ottenere il risultato di un use case scritto con Effect.

## Il problema che risolve

Tutto ciò che si scrive con `Effect.gen`/`pipe` (use case, chiamate al port, ecc.) costruisce una *descrizione* di un programma, non lo esegue — un po' come una Promise "lazy" invece che "eager". Finché si resta dentro il mondo Effect, si compongono descrizioni. React, però, lavora con Promise/valori concreti: da qualche parte serve un punto preciso in cui il mondo Effect "si accende" e produce un risultato reale.

## Come si usa

```ts
const results = await Effect.runPromise(
  Effect.provide(
    findExpertsForCity(cityId, coordinatorId),
    InMemoryTravelerRepositoryLive,
  ),
)
```

`Effect.runPromise` esegue l'Effect e restituisce una Promise normale — se l'Effect fallisce con un errore tipizzato, la Promise viene rigettata con quell'errore.

Questo è l'**unico** punto del codice dove il mondo Effect tocca il mondo React/Promise. Tutto il resto — `domain/`, `use-cases/`, il port, il `Layer` — non sa che React esiste, ed è per questo che resta testabile senza montare nessun componente.

## Alternativa in TypeScript puro

Senza Effect, un use case sarebbe semplicemente una funzione `async` che ritorna una `Promise` direttamente — non esisterebbe questo passaggio esplicito, perché non c'è una fase "descrizione" separata da una fase "esecuzione". Il vantaggio di avere il confine esplicito è che tutto ciò che sta a monte (use case, port, dominio) resta puramente dichiarativo e componibile finché non lo si esegue — comodo soprattutto nei test, dove si fornisce un `Layer` diverso e si esegue solo lì.
