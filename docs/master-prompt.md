# Master prompt

Testo originale con cui è stato definito il progetto TipMyTrip, conservato
com'è stato scritto (non è un documento vivo: se qualcosa qui diventa
obsoleto, si aggiorna `docs/product-brief.md`, `docs/decisions.md` o
`ROADMAP.md`, non questo file).

---

## TipMyTrip

Voglio costruire TipMyTrip, un prototipo web che nasce da una necessità che ho incontrato lavorando come Travel Coordinator.

L'idea è semplice: quando devo organizzare un viaggio in una città che non conosco bene, può essere molto utile parlare con qualcuno che quella città la conosce davvero. Ad esempio: "Devo portare 15 persone a pranzo a Madrid, conosci qualche ristorante adatto?"

TipMyTrip vuole mettere in contatto queste due persone: chi sta organizzando il viaggio e chi conosce bene la destinazione.

Il progetto è soprattutto un esercizio di apprendimento di Effect e di software design. La qualità del codice e la comprensione di quello che sto facendo sono più importanti della quantità di funzionalità.

Non è rocket engineering (not yet, perlomeno).

### Tecnologie

- Next.js
- React
- TypeScript
- Effect
- Jest
- Tailwind CSS

Il repository è vuoto: partiamo da zero.

### Come funziona

Un utente può registrarsi e indicare:

- le lingue che parla (in fase di registrazione);
- le città che conosce;
- il livello di conoscenza di ogni città.

I livelli sono:

- Base — ci è passato o l'ha visitata e può dare consigli sui posti che conosce;
- Expert — ci è stato diverse volte e conosce abbastanza bene la città da poter confrontare alternative;
- Local — ci vive, ci ha vissuto o l'ha frequentata così tanto da poter quasi costruire un itinerario.

Le città conosciute vengono mostrate come pin su una mappa.

Un Travel Coordinator può invece creare un viaggio selezionando le città che visiterà. Il sistema deve trovare le persone che possono essere utili per quelle destinazioni.

Per l'MVP non voglio una chat interna. Sul profilo mostriamo semplicemente delle icone WhatsApp/email con contatti fittizi.

### Matching

Il matching deve essere semplice e soprattutto spiegabile.

Possiamo tenere conto, ad esempio, di:

- città conosciute;
- livello di expertise;
- lingue in comune;
- quante città del viaggio conosce una persona.

Non voglio costruire subito un algoritmo sofisticato.

Prima di implementarlo, gli agent devono propormi una strategia semplice, spiegarmi le scelte e renderla facilmente testabile.

### MVP

Le funzionalità principali sono:

- gestione delle città conosciute;
- livello di expertise;
- lingue;
- creazione di un viaggio;
- matching;
- risultati del matching;
- profilo dell'esperto;
- contatti.

Per il prototipo vanno benissimo dati mock/in-memory.

Non servono per ora:

- backend reale;
- database;
- autenticazione reale;
- chat;
- notifiche;
- integrazioni reali con WhatsApp/email;
- recommendation engine;
- traduzioni;
- infrastruttura cloud;
- microservizi.

Se una cosa non serve all'MVP, non aggiungiamola pensando che "potrebbe servire in futuro".

### UI

Voglio una web app utilizzabile sia desktop che mobile.

Le aree principali saranno indicativamente:

- Home;
- Dashboard;
- My Expertise;
- mappa delle città;
- aggiunta di una città;
- Trip Planner;
- Matching Results;
- Expert Detail.

Usiamo Tailwind CSS.

Per la mappa non è necessario integrare subito un servizio reale: per il prototipo va bene una soluzione mock.

Il primo vertical slice che vorrei arrivare a costruire è:

seleziono una città → trovo le persone che la conoscono → vedo i risultati → apro un profilo → vedo come contattarlo.

Questo deve essere sufficiente per attraversare buona parte dell'architettura senza costruire subito tutto il prodotto.

### Architettura

Voglio usare una Hexagonal Architecture / Ports & Adapters, mantenendola però pragmatica.

L'idea è avere una separazione tra:

- Domain — modello e regole di business;
- Application — use case;
- Infrastructure — repository e implementazioni;
- Presentation — React/UI.

Il dominio non deve dipendere da React o dall'infrastruttura.

Non voglio però un'architettura enterprise fatta di astrazioni inutili.

Evitiamo factory, generic repository, interfacce per ogni cosa e dependency injection artificiale se non portano un vantaggio reale.

Preferisco una soluzione semplice e comprensibile.

### Effect

La parte più importante del progetto, dal punto di vista tecnico, è imparare Effect.

Io però parto da zero e non conosco Effect.

Non voglio quindi che il progetto dia per scontato che io conosca già pattern, best practice o modi corretti di strutturare un'applicazione Effect.

Gli agent devono aiutarmi a capire:

- quali concetti di Effect stiamo usando;
- perché li stiamo usando;
- quale problema risolvono;
- quali alternative avremmo usando TypeScript normalmente;
- quali concetti vale la pena imparare e quali possiamo tranquillamente rimandare.

Effect va usato dove ha senso, non ovunque per forza.

Quando introduciamo un concetto importante, documentiamolo in docs/effect/ in modo semplice e concreto.

### Testing

Voglio avere dei test, ma non voglio che il progetto diventi un esercizio di coverage.

Il Test Architect deve aiutarmi a capire cosa è importante testare e come farlo.

In particolare voglio che mi consigli su:

- regole del dominio;
- matching;
- use case;
- edge case;
- gestione degli errori;
- parti che usano Effect.

Il codice deve essere progettato in modo che dominio e use case possano essere testati senza React.

### Agent

Il progetto utilizza questi agent. Non devono essere coinvolti tutti in ogni attività: vanno attivati in base al problema.

**Product Manager**
Tiene il focus su problema, utenti e MVP. Evita feature creep.

**Business Strategist**
Ragiona su valore del prodotto, modello, incentivi e principali assunzioni. Utile soprattutto nelle decisioni di prodotto.

**Requirements Analyst**
Trasforma le idee in requisiti concreti e individua ambiguità ed edge case.

**UX Designer**
Definisce user flow, interazioni e UI, tenendo conto di responsive e accessibilità.

**Architect**
Definisce dominio, struttura del progetto, Ports & Adapters, uso di Effect e dipendenze.

**Test Architect**
Consiglia cosa vale la pena testare e come farlo, soprattutto per dominio, use case ed Effect.

**Developer**
Implementa la soluzione mantenendo il codice semplice, leggibile e coerente con le decisioni prese.

**Code Reviewer**
Rivede il codice già implementato e segnala problemi di correttezza, architettura, test, leggibilità o uso di Effect.

### Come voglio lavorare

Quando propongo una nuova funzionalità o modifica:

1. capiamo cosa voglio ottenere;
2. gli agent evidenziano eventuali problemi o ambiguità;
3. definiamo uno scope ragionevole;
4. decidiamo la soluzione;
5. implementiamo;
6. facciamo i test necessari;
7. facciamo una review;
8. aggiorniamo documentazione e roadmap quando serve.

Gli agent non devono limitarsi a eseguire quello che chiedo.

Se vedono una soluzione troppo complessa, un requisito ambiguo, un edge case importante o una scelta che non ha senso, devono farmelo presente.

Allo stesso tempo non voglio trasformare ogni piccola modifica in una riunione: se la scelta è semplice e reversibile, prendiamo una decisione ragionevole e andiamo avanti.

Chiedetemi conferma solo quando c'è una decisione importante che non può essere presa ragionevolmente senza di me.

### Documentazione

Voglio mantenere:

- CLAUDE.md
- ROADMAP.md
- docs/product-brief.md
- docs/decisions.md
- docs/effect/

La documentazione deve essere breve e utile, non un esercizio di documentazione.

Il product-brief deve descrivere problema, utenti, MVP, user journey, dominio e matching.

decisions.md deve contenere le decisioni importanti e il motivo per cui sono state prese.

ROADMAP.md deve riflettere lo stato reale del progetto.

In docs/effect/ documentiamo solo i concetti di Effect che utilizziamo realmente.

### Primo avvio

Partendo dal repository vuoto, prima di iniziare a costruire tutto voglio:

1. definire il product brief;
2. definire il dominio;
3. proporre l'architettura;
4. definire una prima strategia di testing;
5. creare roadmap e decision log;
6. inizializzare il progetto;
7. costruire il primo vertical slice.

Non partire subito costruendo tutta la UI.

### Regola generale

La priorità è:

capire → mantenere semplice → scrivere buon codice → imparare Effect.

Non mi interessa avere un'architettura perfetta sulla carta.

Mi interessa capire perché stiamo facendo una cosa, poterla testare e poterla modificare senza paura.

Se per ottenere questo risultato dobbiamo rinunciare a un po' di sofisticazione, va benissimo.
