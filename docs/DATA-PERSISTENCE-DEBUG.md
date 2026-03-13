# 🔍 DEBUG: Snippet Spariscono

## 🚨 PROBLEMA IDENTIFICATO E RISOLTO

### Bug trovato: **Stale Memory in Background Script**

**Cosa succedeva (v2.2)**:
```
1. User crea snippet → Salva in storage.local ✅
2. User chiude popup
3. Background script mantiene vecchi dati in memoria ❌
4. User riapre popup → loadData chiama background.getData()
5. Background ritorna dati vecchi dalla memoria ❌
6. User vede snippet spariti ❌
```

**Root cause**:
```javascript
// CODICE BUGGATO (v2.2)
async function loadData() {
  const response = await chrome.runtime.sendMessage({ action: 'getData' });
  // ↑ Questo chiedeva al background script, che aveva dati vecchi in RAM
  snippets = response.snippets || {};
}
```

---

## ✅ SOLUZIONI IMPLEMENTATE (v2.3)

### Fix #1: Load direttamente da storage
```javascript
// CODICE CORRETTO (v2.3)
async function loadData() {
  const data = await chrome.storage.local.get(['snippets', 'categories']);
  // ↑ Ora carica SEMPRE da storage.local, mai dalla memoria
  snippets = data.snippets || {};
}
```

### Fix #2: Background script ricarica da storage
```javascript
// Anche quando background risponde, ricarica prima
else if (request.action === 'getData') {
  chrome.storage.local.get(['snippets'], (data) => {
    snippets = data.snippets || {}; // Aggiorna memoria
    sendResponse({ snippets }); // Ritorna dati freschi
  });
}
```

### Fix #3: Verifica dopo salvataggio
```javascript
async function saveData() {
  await chrome.storage.local.set({ snippets });
  
  // NUOVO: Verifica che sia salvato
  const verify = await chrome.storage.local.get(['snippets']);
  if (Object.keys(verify.snippets).length !== Object.keys(snippets).length) {
    alert('⚠️ ERRORE nel salvataggio!');
  }
}
```

### Fix #4: Auto-backup ogni 30 secondi
```javascript
// Safety net - backup automatico
setInterval(() => {
  chrome.storage.local.set({ 
    'snippets_backup': { snippets, timestamp: Date.now() }
  });
}, 30000);
```

### Fix #5: Recovery da backup
```javascript
// Se dati vuoti ma backup presente, offri recupero
if (snippetsCount === 0 && backupExists) {
  if (confirm('Trovato backup. Recuperare?')) {
    snippets = backup.snippets;
    saveData();
  }
}
```

---

## 🧪 TESTING GUIDE

### Test 1: Persistenza base
```
1. Crea snippet "Test 1"
2. Chiudi popup (X)
3. Riapri popup (Ctrl+Shift+V)
4. ✅ DEVE esserci "Test 1"
```

### Test 2: Persistenza dopo riavvio Chrome
```
1. Crea snippet "Test 2"
2. Chiudi Chrome completamente
3. Riapri Chrome
4. Apri estensione
5. ✅ DEVE esserci "Test 2"
```

### Test 3: Persistenza dopo crash
```
1. Crea 5 snippet
2. Chrome → Task Manager → Termina processo Chrome
3. Riapri Chrome
4. Apri estensione
5. ✅ DEVONO esserci tutti e 5 gli snippet
```

### Test 4: Recovery da backup
```
1. Crea snippet "Test Backup"
2. Aspetta 30 secondi (auto-backup)
3. Apri F12 → Console
4. Esegui: chrome.storage.local.remove('snippets')
5. Ricarica popup
6. ✅ DEVE apparire prompt di recovery
7. Accetta → snippet ritorna
```

---

## 🔬 DEBUG TOOLS

### Check storage content
Apri Console (F12) nel popup e esegui:

```javascript
// Vedi tutto lo storage
chrome.storage.local.get(null, (data) => {
  console.log('FULL STORAGE:', data);
  console.log('Main snippets:', Object.keys(data.snippets || {}).length);
  console.log('Backup snippets:', Object.keys(data.snippets_backup?.snippets || {}).length);
  console.log('Backup age:', data.snippets_backup_time);
});
```

### Monitor save operations
```javascript
// Override saveData per vedere quando salva
const originalSave = saveData;
window.saveData = async function() {
  console.log('SAVING:', Object.keys(snippets).length, 'snippets');
  await originalSave();
  console.log('SAVED CONFIRMED');
};
```

### Test backup system
```javascript
// Forza creazione backup
createBackup();

// Controlla se backup è stato creato
chrome.storage.local.get('snippets_backup', (data) => {
  console.log('Backup:', data.snippets_backup);
});
```

### Clear all storage (ATTENZIONE)
```javascript
// SOLO PER DEBUG - Cancella tutto
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});
```

---

## 📊 STORAGE STRUCTURE

### Main storage
```javascript
{
  "snippets": {
    "1707851234567": {
      "title": "Ricetta Patate",
      "text": "Ingredienti...",
      "category": "Ricette",
      "created": 1707851234567,
      "modified": 1707851234567
    }
  },
  "categories": ["Generale", "Ricette", "Lavoro"]
}
```

### Backup storage
```javascript
{
  "snippets_backup": {
    "snippets": { /* same as above */ },
    "categories": [ /* same as above */ ],
    "timestamp": 1707851234567,
    "version": "2.3"
  },
  "snippets_backup_time": "2025-02-13T10:30:45.123Z"
}
```

---

## 🚨 TROUBLESHOOTING

### Problema: Snippet ancora spariscono

**Diagnosi**:
1. Apri F12 nel popup
2. Crea uno snippet
3. Guarda console per:
   ```
   [Snippets] Saved successfully: { snippetsCount: X, ... }
   ```
4. Chiudi e riapri popup
5. Guarda console per:
   ```
   [Snippets] Loaded from storage: { snippetsCount: X, ... }
   ```
6. I numeri devono essere uguali

**Se diversi**:
- Copiami entrambi i log
- Copiami output di `chrome.storage.local.get(null, console.log)`
- Fixo immediatamente

---

### Problema: "Save verification failed"

**Significa**: Storage.local ha rifiutato il salvataggio

**Possibili cause**:
1. **Storage pieno** (limit 5MB)
   - Soluzione: Esporta JSON, elimina vecchi snippet
2. **Quota exceeded**
   - Soluzione: Riduci numero snippet o dimensione testi
3. **Permessi mancanti**
   - Soluzione: Reinstalla estensione

**Debug**:
```javascript
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log('Storage used:', bytes, 'bytes');
  console.log('Storage used:', (bytes / 1024 / 1024).toFixed(2), 'MB');
  console.log('Limit:', '~5 MB');
});
```

---

### Problema: Backup recovery non appare

**Causa**: Backup non creato o troppo vecchio

**Check**:
```javascript
chrome.storage.local.get('snippets_backup', (data) => {
  if (!data.snippets_backup) {
    console.log('NO BACKUP FOUND');
  } else {
    const age = Date.now() - data.snippets_backup.timestamp;
    console.log('Backup age:', Math.floor(age / 60000), 'minutes');
    console.log('Backup has:', Object.keys(data.snippets_backup.snippets).length, 'snippets');
  }
});
```

**Trigger manual backup**:
```javascript
createBackup();
console.log('Manual backup created');
```

---

## 🎯 PREVENTION TIPS

### Best practices per non perdere dati:

1. **Export regolarmente**
   - Tab Impostazioni → Export JSON
   - Almeno 1 volta a settimana

2. **Controlla auto-backup**
   - Dopo ogni sessione, verifica che backup esista
   - Console: `chrome.storage.local.get('snippets_backup_time', console.log)`

3. **Non chiudere durante salvataggio**
   - Aspetta il toast "Snippet salvato!" prima di chiudere

4. **Usa Chrome Sync (futuro)**
   - v3.0 userà chrome.storage.sync per sincronizzazione cloud

5. **Monitor console**
   - Se vedi errori rossi, segnala immediatamente

---

## 📈 STORAGE LIMITS

| Type | Limit | Current Usage |
|------|-------|---------------|
| storage.local | ~5 MB | Check con getBytesInUse |
| Max items | Unlimited | Limited only by space |
| Max value size | ~5 MB | Per singolo snippet |
| Backup retention | None | Sovrascritto ogni 30s |

**Calcolo approssimativo**:
- 1 snippet medio = ~500 bytes
- 5 MB = ~10,000 snippet possibili
- Uso realistico = 100-500 snippet = ~50-250 KB

---

## 🔮 FUTURE IMPROVEMENTS (v3.0)

Possibili migliorie se il problema persiste:

1. **IndexedDB invece di storage.local**
   - Limite maggiore
   - Più robusto
   - Transazioni ACID

2. **Chrome Storage Sync**
   - Sincronizzazione cross-device
   - Limite 100KB (ridotto)
   - Backup cloud automatico

3. **Multi-tier backup**
   - Backup locale (attuale)
   - Backup in file (download auto)
   - Backup cloud (opzionale)

4. **Versioning completo**
   - History di ogni modifica
   - Rollback a versioni precedenti
   - Conflict resolution

---

## 📞 SEGNALA SE:

1. ✅ **Snippet salvati ma spariscono dopo X minuti/ore/giorni**
   - Dimmi esattamente quando spariscono
   - Copiami log console
   
2. ✅ **Alert "ERRORE nel salvataggio" appare**
   - Screenshot dell'alert
   - Console log
   
3. ✅ **Backup recovery non funziona**
   - Console log di `chrome.storage.local.get('snippets_backup')`
   
4. ✅ **Storage pieno**
   - Output di `getBytesInUse`
   - Quanti snippet hai

---

**TL;DR v2.3 Changes**:
1. ✅ Load sempre da storage.local (non memoria background)
2. ✅ Verifica dopo ogni save
3. ✅ Auto-backup ogni 30 secondi
4. ✅ Recovery automatico se dati persi
5. ✅ Debug logging estensivo

**Testa ora e dimmi se funziona o se continui a perdere dati.**
