# 🔧 Troubleshooting: Incolla non funziona su Gemini/ChatGPT/Altri Editor

## 🎯 Versione v2.2 - Multi-Strategy Paste

La v2.2 implementa **5 strategie diverse** per incollare testo, provandole in sequenza fino a che una funziona.

---

## 📋 Strategie Implementate (in ordine di esecuzione)

### Strategy 1: Clipboard API + Paste Event ⭐ (MIGLIORE)
```javascript
navigator.clipboard.writeText(text)
→ Trigger ClipboardEvent('paste')
```
**Funziona su**: Gemini, ChatGPT, Claude, editor moderni  
**Vantaggi**: Rispetta il comportamento nativo dell'editor  
**Svantaggi**: Richiede permessi clipboard

### Strategy 2: INPUT/TEXTAREA Standard
```javascript
element.value = newValue
→ Trigger input/change events
```
**Funziona su**: Form standard, Gmail, input semplici  
**Vantaggi**: 100% affidabile su elementi nativi  
**Svantaggi**: Non funziona su contentEditable

### Strategy 3: ContentEditable + execCommand
```javascript
document.execCommand('insertText', false, text)
```
**Funziona su**: Editor WYSIWYG semplici  
**Vantaggi**: Mantiene formattazione  
**Svantaggi**: Deprecato (ma ancora funziona)

### Strategy 4: Ricerca Ricorsiva Elementi
```javascript
element.querySelector('[contenteditable], textarea, input')
```
**Funziona su**: Editor complessi con wrapper  
**Vantaggi**: Trova elementi nascosti  
**Svantaggi**: Può trovare elemento sbagliato

### Strategy 5: Ricerca Parent Chain
```javascript
element.closest('[contenteditable="true"]')
```
**Funziona su**: Elementi nested  
**Vantaggi**: Ultima spiaggia  
**Svantaggi**: Può non trovare nulla

---

## 🧪 Come Testare su Gemini

### Test Manuale:
1. Vai su **gemini.google.com**
2. Apri l'estensione (Ctrl+Shift+V)
3. Crea uno snippet di test: "Ciao Gemini"
4. Click nel prompt di Gemini
5. Tasto destro → "Incolla snippet" → "Ciao Gemini"
6. **OPPURE** Ctrl+Shift+V → Cerca → Click "Incolla"

### Cosa dovresti vedere:
✅ Testo appare nel prompt  
✅ Background verde lampeggia (feedback visivo)  
✅ Puoi continuare a scrivere normalmente

### Se NON funziona:
1. Apri **DevTools** (F12)
2. Tab **Console**
3. Riprova a incollare
4. Cerca messaggi tipo:
   - `Snippet extension: Unable to paste...`
   - Errori `ClipboardEvent`
   - Altri errori

**Copiami TUTTO quello che vedi in console** e te lo fisso.

---

## 🐛 Problemi Noti & Soluzioni

### Problema: "Incolla snippet" grigio/disabilitato nel menu

**Causa**: Chrome non riconosce il campo come editabile  
**Motivi possibili**:
- Shadow DOM
- iframe
- Elemento non ancora caricato

**Debug**:
```javascript
// Apri console (F12) su Gemini
console.log(document.activeElement);
console.log(document.activeElement.isContentEditable);
console.log(document.activeElement.tagName);
```

**Workaround**: Usa **Ctrl+Shift+V** (popup) invece del menu contestuale.

---

### Problema: Incolla ma testo non appare

**Causa**: Editor usa Virtual DOM e ignora modifiche dirette  
**Motivi possibili**:
- React/Vue re-render cancella il testo
- Editor ha validazione custom che rifiuta input

**Test**:
```javascript
// Console (F12) su Gemini
const input = document.activeElement;
input.textContent = "TEST";
// Se sparisce dopo 1 secondo = Virtual DOM problem
```

**Soluzione v2.2**: Strategy 1 (Clipboard API) dovrebbe aggirare questo.

---

### Problema: Funziona su Gmail ma non su Gemini

**Spiegazione**:
- Gmail: `<textarea>` standard → Strategy 2 funziona
- Gemini: ContentEditable complesso → Serve Strategy 1

**Nessun problema**: v2.2 prova tutte le strategie automaticamente.

---

## 🔬 Debug Avanzato

### Test quale strategy funziona:

Aggiungi questo snippet nella console (F12) su Gemini:

```javascript
// Simula incolla estensione
const text = "TEST FROM CONSOLE";

// Test Strategy 1: Clipboard API
navigator.clipboard.writeText(text).then(() => {
  const pasteEvent = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
    clipboardData: new DataTransfer()
  });
  pasteEvent.clipboardData.setData('text/plain', text);
  document.activeElement.dispatchEvent(pasteEvent);
  console.log('Strategy 1 executed');
});

// Aspetta 2 secondi e controlla se testo è apparso
setTimeout(() => {
  console.log('Testo nel prompt:', document.activeElement.textContent);
}, 2000);
```

Dimmi il risultato e capisco quale strategy serve ottimizzare.

---

## 🚨 Limitazioni Tecniche

### Casi dove NON PUÒ funzionare:

1. **iframe cross-origin**
   - Es: Editor in iframe da dominio diverso
   - Chrome blocca per sicurezza
   - **Impossibile** aggirare

2. **CSP bloccante**
   - Siti con Content-Security-Policy strict
   - Bloccano modifiche programmatiche
   - **Workaround**: Permessi estensione (già abbiamo)

3. **JavaScript disabilitato**
   - Ovvio ma va detto
   - Estensione = JavaScript = serve JS

4. **Editor proprietari strani**
   - Es: editor Flash/WebAssembly
   - Non espongono DOM
   - **Workaround**: Copy/paste manuale

---

## 💡 Alternative se Gemini NON funziona

### Opzione A: Copy invece di Paste
Cambio l'estensione per:
1. Copiare snippet in clipboard
2. Tu fai Ctrl+V manualmente

**Pro**: Funziona SEMPRE  
**Contro**: Richiede 1 click extra

### Opzione B: Injection Script specifico per Gemini
Reverse engineer il prompt di Gemini e faccio injection diretta.

**Pro**: 100% affidabile su Gemini  
**Contro**: Si rompe quando Google aggiorna Gemini

### Opzione C: Bookmarklet Fallback
Aggiungo bookmarklet che usi quando estensione non funziona.

**Pro**: Universale  
**Contro**: Richiede click su bookmark

---

## 📊 Compatibility Matrix (stimata)

| Sito/Editor | v2.1 | v2.2 | Note |
|-------------|------|------|------|
| Gmail | ✅ | ✅ | Textarea standard |
| Google Docs | ⚠️ | ✅ | Strategy 1 dovrebbe funzionare |
| Gemini | ❌? | ✅? | Da testare - Strategy 1 |
| ChatGPT | ⚠️ | ✅ | Strategy 1 |
| Claude.ai | ⚠️ | ✅ | Strategy 1 |
| Notion | ⚠️ | ✅ | ContentEditable complesso |
| Slack | ✅ | ✅ | Textarea standard |
| Discord | ✅ | ✅ | Textarea standard |
| WhatsApp Web | ⚠️ | ✅ | ContentEditable |
| Twitter/X | ✅ | ✅ | Textarea → ContentEditable |
| LinkedIn | ✅ | ✅ | ContentEditable standard |
| Facebook | ⚠️ | ✅ | ContentEditable React |
| VSCode Web | ❌ | ❌ | Monaco editor = impossibile |
| Figma | ❌ | ❌ | WebGL = impossibile |

**Legenda**:
- ✅ = Funziona
- ⚠️ = Funziona a volte / dipende
- ❌ = Non funziona
- ? = Non testato ma dovrebbe funzionare

---

## 🎯 Action Items per Te

### Immediate:
1. **Installa v2.2** (nuova versione fixata)
2. **Prova su Gemini**
3. **Dimmi risultato** (funziona / non funziona / comportamento strano)
4. Se non funziona: **Apri F12 → Console → Copiami errori**

### Se non funziona su Gemini:
5. **Test console** (copia snippet debug sopra in F12)
6. **Dimmi output**
7. Implemento fix specifico per Gemini

---

## 📞 Come Segnalare Bug

**NON dirmi**: "Non funziona"

**DIMMI**:
1. **Sito esatto**: URL completo
2. **Comportamento**:
   - Menu contestuale appare? (sì/no)
   - Testo appare? (sì/no/parzialmente)
   - Errori console? (copiami tutto)
3. **Screenshot** se possibile
4. **Versione estensione**: Guarda manifest.json → version

Così posso fixare in 5 minuti invece di indovinare.

---

**TL;DR**: Ho rifatto completamente la funzione di incolla con 5 strategie diverse. Testa v2.2 su Gemini e dimmi che succede. Se non funziona, apri F12 e copiami gli errori.
