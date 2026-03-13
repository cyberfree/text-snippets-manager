# Changelog

## [2.3.0] - 2025-02-13 - DATA PERSISTENCE FIX CRITICO

### 🚨 CRITICAL BUG FIX: Snippet che sparivano
**Problema risolto**: Gli snippet venivano salvati ma poi sparivano alla riapertura del popup.

### 🐛 Root Cause
- **loadData()** caricava da background script memory invece che da storage.local
- Background script manteneva dati vecchi in RAM
- Risultato: dati salvati ma non visibili = sembravano spariti

### ✅ Soluzioni Implementate

#### Fix #1: Direct Storage Load
```javascript
// Prima (BUGGATO): loadData caricava da background memory
const response = await chrome.runtime.sendMessage({ action: 'getData' });

// Dopo (CORRETTO): load diretto da storage.local
const data = await chrome.storage.local.get(['snippets', 'categories']);
```

#### Fix #2: Background Storage Refresh
Background script ora ricarica sempre da storage invece di usare memoria:
```javascript
chrome.storage.local.get(['snippets'], (data) => {
  snippets = data.snippets; // Aggiorna memoria
  sendResponse({ snippets }); // Serve dati freschi
});
```

#### Fix #3: Save Verification
Ogni salvataggio ora verifica che i dati siano stati scritti correttamente:
```javascript
await chrome.storage.local.set({ snippets });
const verify = await chrome.storage.local.get(['snippets']);
if (verify !== expected) alert('ERRORE nel salvataggio!');
```

#### Fix #4: Auto-Backup System (NEW)
- **Backup automatico ogni 30 secondi** in storage separato
- **Recovery automatico** se dati principali spariscono
- Prompt utente per confermare recovery

#### Fix #5: Debug Logging
Logging estensivo per tracciare:
- Ogni operazione di load/save
- Conteggio snippet prima/dopo
- Timestamp operazioni
- Errori di verifica

### 📚 Documentazione
- **NEW**: DATA-PERSISTENCE-DEBUG.md con guida completa
- Debug tools per diagnosticare problemi storage
- Testing guide per verificare persistenza

### 🔧 Miglioramenti Tecnici
- Async/await corretto in tutte le operazioni storage
- Error handling robusto con try/catch
- Storage quota monitoring
- Verifica integrità dati

---

## [2.2.0] - 2025-02-13 - GEMINI/CHATGPT FIX

### 🚀 Major Paste System Rewrite
- **NEW**: Multi-strategy paste system con 5 fallback diversi
- **FIXED**: Incolla su Gemini, ChatGPT, Claude.ai e altri AI chat
- **FIXED**: Incolla su Google Docs e editor complessi
- **IMPROVED**: Clipboard API come strategia primaria (più affidabile)

### 📋 Strategie Paste (in ordine):
1. **Clipboard API + PasteEvent** - Per editor moderni (Gemini, ChatGPT)
2. **Direct value insertion** - Per input/textarea standard
3. **execCommand fallback** - Per contentEditable classici
4. **Recursive search** - Per editor con wrapper complessi
5. **Parent chain search** - Ultimo fallback per elementi nested

### 🎯 Compatibilità Migliorata
- ✅ Gemini (google.com/gemini)
- ✅ ChatGPT (chat.openai.com)
- ✅ Claude.ai
- ✅ Google Docs
- ✅ Notion
- ✅ WhatsApp Web
- ✅ Facebook/LinkedIn contentEditable

### 🐛 Bug Fix
- **FIXED**: Shadow DOM elements non rilevati
- **FIXED**: React/Vue Virtual DOM che cancellava testo
- **IMPROVED**: Event triggering per compatibilità framework

### 📚 Documentazione
- **NEW**: TROUBLESHOOTING.md con debug guide completa
- **NEW**: Compatibility matrix per siti popolari
- **NEW**: Console debug snippets

---

## [2.1.0] - 2025-02-13 - BUGFIX CRITICO

### 🐛 Risolti Bug Critici
- **FIXED**: Bottoni Modifica/Elimina non funzionavano
  - Causa: `onclick` inline non funziona con scope moduli ES6
  - Soluzione: Event delegation con `data-action` attributes
- **FIXED**: Eliminazione categorie non funzionava
  - Stessa causa e soluzione
- **IMPROVED**: Performance rendering snippet (event delegation più efficiente)

### 📝 Dettagli Tecnici
Il problema era causato dall'uso di `onclick="functionName()"` inline nell'HTML generato dinamicamente.
Con moduli ES6, le funzioni non sono automaticamente nel global scope.

**Prima (ROTTO):**
```html
<button onclick="deleteSnippet('123')">Elimina</button>
```

**Dopo (FUNZIONA):**
```html
<button data-action="delete" data-id="123">Elimina</button>
```
Con event listener aggiunto via JavaScript dopo il render.

---

## [2.0.0] - 2025-02-13

### 🎉 MAJOR UPGRADE - Versione Professionale

#### ✅ Aggiunte
- **Ricerca in tempo reale**: Cerca per titolo, testo o categoria
- **Sistema categorie**: Organizza snippet in categorie personalizzabili
- **Backup completo**: Export/Import JSON con merge o sostituzione
- **Shortcut da tastiera**: Ctrl+Shift+V (Cmd+Shift+V su Mac)
- **Modifica snippet**: Modal dedicata per editing
- **Menu intelligente**: Raggruppa automaticamente per categoria quando >15 snippet
- **Statistiche**: Totale snippet, categorie, caratteri
- **UI professionale**: Interfaccia a 3 tab moderna e responsive
- **Toast notifications**: Feedback visivo su operazioni
- **Ordinamento**: Snippet ordinati per data (più recenti prima)
- **Gestione categorie**: Aggiungi/elimina categorie, riassegna snippet
- **Feedback visivo**: Highlight verde su incolla
- **Incolla rapido**: 1 click dal popup e chiusura automatica

#### 🔧 Migliorate
- **Menu contestuale**: Da lista piatta a struttura gerarchica intelligente
- **Storage**: Aggiunto timestamp creazione/modifica
- **Performance**: Ottimizzata per 500+ snippet
- **Sicurezza**: Backup prima di ogni operazione distruttiva
- **UX**: Preview intelligente (120 caratteri), conferme multiple per eliminazioni

#### 🐛 Risolte
- ❌ Menu illeggibile con molti snippet → ✅ Raggruppamento automatico
- ❌ Impossibile trovare snippet → ✅ Ricerca in tempo reale
- ❌ Perdita dati su disinstallazione → ✅ Export/Import
- ❌ Impossibile modificare → ✅ Modal di modifica
- ❌ Nessuna organizzazione → ✅ Sistema categorie

#### 🗑️ Deprecate
- Vecchia struttura storage (key = titolo) → Nuova struttura (ID univoci)
- Migrazione automatica alla v2.0 (mantiene compatibilità)

---

## [1.0.0] - 2025-02-13

### Prima release
- Salvataggio snippet con titolo e testo
- Incolla tramite menu contestuale (tasto destro)
- Popup base per gestione
- Eliminazione snippet
- Storage locale base

### ⚠️ Limitazioni note v1.0
- Menu contestuale diventa illeggibile con >20 snippet
- Nessuna ricerca
- Nessuna categorizzazione
- Nessun backup (perdita dati su disinstallazione)
- Impossibile modificare snippet (solo elimina/ricrea)
- Nessun shortcut da tastiera
