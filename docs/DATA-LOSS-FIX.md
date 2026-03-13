# 🐛 DATA LOSS BUG - Root Cause & Fix

## 🎯 Problema: "Dopo un po' mi scompaiono i dati caricati"

### Root Cause: Service Worker Lifecycle

Chrome termina automaticamente i **Service Workers** (background scripts in Manifest V3) dopo **30 secondi** di inattività per risparmiare risorse.

```
Timeline del problema:
─────────────────────────────────────────────────────────────────
t=0s    : Installi estensione
t=0.1s  : onInstalled → loadData() → snippets caricati in RAM ✅
t=5m    : Usi estensione normalmente → tutto ok ✅
t=5m30s : Nessuna attività per 30s
t=5m31s : Chrome TERMINA il service worker 💀
          └─> let snippets = {} ← PERSO dalla RAM
          └─> let categories = [] ← PERSO dalla RAM
t=10m   : Riapri estensione
          → Service worker si RISVEGLIA
          → MA onInstalled NON viene chiamato (solo alla prima install)
          → snippets = {} (vuoto)
          → Popup mostra "Nessuno snippet salvato" ❌
─────────────────────────────────────────────────────────────────
```

### Codice Problematico (v2.2):

```javascript
// background.js
let snippets = {};      // ← Variabile in MEMORIA RAM
let categories = [];

chrome.runtime.onInstalled.addListener(() => {
  loadData();  // ← Chiamato SOLO all'installazione
});

// Quando service worker muore → RAM persa
// Quando si risveglia → onInstalled NON chiamato
// → snippets rimane {}
```

---

## ✅ Fix Implementato (v2.3)

### 1. Load su OGNI risveglio del service worker

```javascript
// ✅ Ricarica all'installazione
chrome.runtime.onInstalled.addListener(() => {
  loadData();
});

// ✅ Ricarica al riavvio browser
chrome.runtime.onStartup.addListener(() => {
  loadData();
});

// ✅ Lazy loading quando serve
async function ensureDataLoaded() {
  if (Object.keys(snippets).length === 0) {
    await loadData();
  }
}
```

### 2. SEMPRE leggi da storage.local nel popup

```javascript
// popup.js - loadData()
async function loadData() {
  // PRIMA (ROTTO): Chiedeva al background script
  // const response = await chrome.runtime.sendMessage({ action: 'getData' });
  
  // DOPO (FUNZIONA): Legge DIRETTAMENTE da storage
  const data = await chrome.storage.local.get(['snippets', 'categories']);
  snippets = data.snippets || {};
  categories = data.categories || ['Generale'];
}
```

### 3. Background ricarica da storage quando richiesto

```javascript
// background.js - message handler
else if (request.action === 'getData') {
  // ✅ NON usare variabili in memoria
  // ✅ SEMPRE ricarica da storage.local
  chrome.storage.local.get(['snippets', 'categories'], (data) => {
    snippets = data.snippets || {};  // Aggiorna cache
    categories = data.categories || ['Generale'];
    sendResponse({ snippets, categories });
  });
}
```

---

## 🧪 Come Testare il Fix

### Test 1: Service Worker Termination

1. **Installa v2.3**
2. **Aggiungi 3 snippet** di test
3. **Chrome DevTools** → Tab "Extensions"
4. Trova "Text Snippets Manager Pro"
5. Click su **"service worker"** (link blu)
6. Si apre una finestra DevTools del background
7. **Click su "🔄 Terminate"** (uccidi il service worker)
8. **Riapri popup** (Ctrl+Shift+V)
9. ✅ **DOVREBBE** mostrare i 3 snippet ancora presenti

### Test 2: Chrome Restart

1. Aggiungi snippet
2. **Chiudi completamente Chrome** (Ctrl+Q / Cmd+Q)
3. **Riapri Chrome**
4. Apri estensione
5. ✅ Snippet dovrebbero essere ancora lì

### Test 3: Inattività Prolungata

1. Aggiungi snippet
2. **Lascia Chrome aperto** ma NON usare estensione
3. Aspetta **2-3 minuti**
4. Apri estensione
5. ✅ Snippet dovrebbero essere ancora lì

---

## 🔍 Debug Tools

### Console Logging (v2.3)

La v2.3 aggiunge logging esteso per capire cosa succede:

```javascript
// Apri DevTools del service worker:
// chrome://extensions/ → "service worker" link

// Dovresti vedere:
[Background] Loaded 5 snippets and 2 categories
[Background] getData - serving fresh data from storage: {...}
[Background] Context menu click - cache empty, reloading from storage
```

### Verifica Storage Manuale

```javascript
// Console (F12) su qualsiasi pagina Chrome:
chrome.storage.local.get(['snippets', 'categories'], (data) => {
  console.log('Snippet salvati:', Object.keys(data.snippets || {}).length);
  console.log('Dati completi:', data);
});
```

Questo ti dice cosa è **veramente salvato** su disco.

---

## 📊 Comparison: v2.2 vs v2.3

| Scenario | v2.2 | v2.3 |
|----------|------|------|
| **Service worker termina** | ❌ Dati persi | ✅ Ricarica auto |
| **Chrome riavvio** | ❌ Dati persi | ✅ onStartup |
| **Popup aperto** | ⚠️ Dati da background | ✅ Legge storage |
| **Menu contestuale click** | ❌ Cache vuota | ✅ Ricarica se vuota |
| **getData message** | ⚠️ RAM stale | ✅ Storage fresh |

---

## 🚨 Limitazioni Residue

### Caso 1: Storage.local corrupted
Se `chrome.storage.local` si corrompe (rarissimo), i dati sono persi.

**Soluzione**: Export regolari (tab Impostazioni → Esporta JSON)

### Caso 2: Extension disinstalled
Ovvio ma va detto: disinstallare = perdere tutto.

**Soluzione**: Export prima di disinstallare

### Caso 3: Chrome profile deleted
Se elimini il profilo Chrome, elimini anche storage.local.

**Soluzione**: Sync con chrome.storage.sync (TODO futura)

---

## 💡 Best Practices Implementate

### 1. **Single Source of Truth**
- `chrome.storage.local` = unica fonte di verità
- Variabili in RAM = solo cache temporanea
- SEMPRE rivalidare dalla storage quando in dubbio

### 2. **Defensive Loading**
```javascript
// Invece di assumere che i dati ci siano:
const snippet = snippets[id];

// Controlla e ricarica se necessario:
if (!snippet && Object.keys(snippets).length === 0) {
  await loadData();
}
```

### 3. **Explicit Logging**
Ogni operazione critica logga su console per debug.

### 4. **Graceful Degradation**
Se loadData() fallisce, non crasha → ritorna oggetti vuoti.

---

## 🔮 Future Improvements

### Opzione A: chrome.storage.sync
- Sincronizza tra dispositivi
- Limite: 100KB
- Pro: Non perdi mai dati
- Contro: Serve account Google

### Opzione B: IndexedDB
- Limite: GB di dati
- Pro: Performance migliore
- Contro: API più complessa

### Opzione C: Periodic backup reminder
- Notification ogni settimana: "Fai backup dei tuoi snippet!"
- Auto-download JSON backup

---

## 📞 Se Continua a Succedere

**DIMMI**:

1. **Quando esattamente**: Dopo quanto tempo? Cosa stai facendo?

2. **Verifica storage**:
```javascript
// F12 console su qualsiasi pagina:
chrome.storage.local.get(null, (data) => {
  console.log('TUTTO lo storage:', data);
});
```
Copiami l'output

3. **Service worker logs**:
- chrome://extensions/
- Click "service worker" link
- Aspetta che il bug si verifichi
- Copiami TUTTI i log

4. **Chrome version**:
```
chrome://version/
```
Copiami la versione

Con queste info posso fixare definitivamente.

---

## 🎓 Lezione Imparata

### Il problema delle variabili globali nei Service Workers

**NON fare mai questo**:
```javascript
let myData = [];  // ← VOLATILE

chrome.runtime.onInstalled.addListener(() => {
  myData = loadFromSomewhere();  // ← Perso quando worker muore
});
```

**Fai sempre questo**:
```javascript
// Usa storage come single source of truth
async function getData() {
  const data = await chrome.storage.local.get('myData');
  return data.myData || [];
}
```

### Service Workers ≠ Background Pages

In Manifest V2 (vecchio):
- Background page sempre attiva
- Variabili globali persistevano
- RAM sempre disponibile

In Manifest V3 (nuovo):
- Service worker termina dopo 30s
- Variabili globali PERSE
- DEVE rilegge da storage

---

**TL;DR**: Service worker muore dopo 30s → variabili RAM perse → v2.3 ricarica sempre da storage.local → problema risolto.
