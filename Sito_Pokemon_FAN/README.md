# 🎮 Pokédex Simulator & Battle Arena

Benvenuto al **Pokédex Simulator**, una web app interattiva scritta in puro HTML, CSS e Vanilla JavaScript che ti permette di esplorare i Pokémon della prima generazione, costruire le tue squadre personalizzate, affrontare la Lega Pokémon in giocatore singolo o sfidare i tuoi amici in tornei locali!

## 🚀 Prerequisiti

Essendo un progetto puramente frontend (Client-Side), non hai bisogno di installare Node.js, Python o alcun database per avviarlo. Tuttavia, ci sono un paio di requisiti fondamentali:

1. **Un Browser Moderno:** Chrome, Firefox, Safari o Edge aggiornati di recente.
2. **Connessione Internet Attiva:** Per funzionare, l'applicazione preleva tutti i dati dei Pokémon (statistiche, tipi, sprite e immagini) dalla [PokéAPI](https://pokeapi.co/) esterna. Senza connessione, l'applicazione non riuscirà a caricare il Pokédex.
3. **Un Local Web Server (Opzionale ma Fortemente Consigliato):** Sebbene tu possa avviare l'app semplicemente facendo doppio clic sul file `index.html`, alcuni browser potrebbero bloccare le funzionalità avanzate come il salvataggio locale (LocalStorage) o il prelievo asincrono delle API se apri il file come `file:///`. Ti consigliamo di usare l'estensione **Live Server** di VS Code, oppure avviare un server Python rapido digitando `python -m http.server` nella directory del progetto.

## 🛠️ Come Avviare il Progetto

1. Clona questa repository:
   ```bash
   git clone https://github.com/tuo-username/pokedex-simulator.git
   ```
2. Apri la cartella del progetto:
   ```bash
   cd pokedex-simulator
   ```
3. Avvia l'applicazione aprendo il file `index.html` col tuo web server locale.

---

## 🧠 Spiegazione della Logica del Progetto

Il cuore del progetto risiede nel file `app.js` e nella struttura a componenti nascosti in `index.html`. Ecco i pilastri su cui si fonda l'architettura:

### 1. Sistema di Navigazione (SPA Emulation)
Sebbene non utilizzi framework come React o Vue, l'applicazione simula una Single Page Application. In `index.html` sono stati inseriti vari contenitori `<main>` con classe `.view-section`. Il JavaScript cattura i click nella barra di navigazione per nascondere (`classList.add('hidden')`) o mostrare le relative viste (Pokédex, Squadre, Lega, Arena, ecc.).

### 2. Fetch dei Dati e PokéAPI
Al momento dell'inizializzazione (`initApp()`), una funzione asincrona interroga la **PokéAPI** in parallelo (utilizzando `Promise.all`), prelevando i dati dei primi 151 Pokémon. 
A questo fetch è legata una **creazione di mosse dinamica**: siccome la PokéAPI restituirebbe centinaia di mosse complesse da gestire, il codice include una funzione "generatore di mosse" che assegna a ciascun Pokémon un moveset bilanciato in base ai propri tipi elementali reali (Es. un Pokémon d'Erba/Veleno avrà sia mosse d'Erba, sia di Veleno o di tipo Normale).

### 3. Persistenza dei Dati (LocalStorage)
Tutto ciò che il giocatore crea è generato "in locale". Più nello specifico, la struttura delle squadre (il nome, l'ID della squadra, i Pokémon assegnati e fino a che punto della Lega si è arrivati con quel determinato raggruppamento) viene scritta costantemente nel `localStorage` del browser. Questo permette di mantenere i progressi e le squadre salvate anche in seguito all'arresto del browser.

### 4. Engine di Battaglia (Battle Logic)
L'Engine della Battaglia, costruito al 100% in JavaScript, è la parte più complessa. Gestisce:
* **Generazione Dinamica dell'HUD**: Calcola automaticamente la conversione degli HP massimi presi dall'API e monitora i punti Stamina (SP) per decidere se una mossa può essere effettuata.
* **Calcolo dei Danni**: Incorpora vere formule dei vecchi titoli (attacco base / difesa avversario + bonus). 
* **Tabella delle Resistenze e Debolezze (Efficacia dei Tipi)**: Esiste un vero moltiplicatore interno che incrocia i tipi dell'attaccante e del difensore, permettendo i bonus "Super Efficace" o le mancate colpite "Non ha alcun effetto!". Include anche lo STAB (Same-Type Attack Bonus).
* **Priorità delle Mosse**: Calcola dinamicamente chi dovrà agire prima incrociando i punti Velocità dei Pokémon in lotta e la priorità incondizionata che possono avere mosse come *Attacco Rapido*.

### 5. Intelligenza Artificiale della Lega
Quando si affronta la modalità **Lega** (Campagna in giocatore singolo), l'Engine di Battaglia delega all'avversario delle decisioni calcolate. Il computer analizza la debolezza del tipo del Pokémon in uso dal giocatore, simulando la probabilità di eseguire le mosse più dannose tra quelle a disposizione, mantenendosi casuale al 30% per impedire pattern di gioco monotoni.

---
*Progetto sviluppato come simulatore frontend interattivo. Gotta Catch 'Em All!*