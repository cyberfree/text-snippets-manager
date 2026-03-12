# Contributing to Text Snippets Manager Pro

Grazie per l'interesse nel contribuire! 🎉

## 🚀 Come Contribuire

### Reporting Bugs

**Prima di aprire un issue**, controlla che non sia già stato riportato.

**Quando apri un bug report, includi**:
- Versione estensione (vedi manifest.json)
- Versione Chrome/Edge
- Descrizione dettagliata del problema
- Passi per riprodurre
- Screenshot se possibile
- Log console (F12 → Console → cerca `[Snippet]`)

### Suggesting Features

Apri una **Discussion** invece di un Issue per:
- Nuove idee
- Miglioramenti UX
- Domande generali

Usa **Issue** solo per:
- Bug confermati
- Feature già discusse e approvate

## 💻 Development Setup

### Prerequisites
- Git
- Chrome/Edge latest
- Editor di testo (VS Code consigliato)

### Setup
```bash
# Fork e clone
git clone https://github.com/YOUR-USERNAME/text-snippets-manager.git
cd text-snippets-manager

# Carica in Chrome
# chrome://extensions/ → Developer mode → Load unpacked
```

### Testing
1. Apri `test-page.html` nel browser
2. Testa paste su tutti i tipi di editor
3. Controlla console per errori
4. Verifica che funzioni anche dopo reload estensione

## 📝 Coding Guidelines

### JavaScript
- Usa `const`/`let`, mai `var`
- Arrow functions quando appropriato
- Commenti per logica complessa
- Console.log con prefix `[Snippet]` per debug

### CSS
- Mobile-first quando possibile
- Usa variabili CSS per colori
- Classi BEM-style preferite

### Commit Messages
```
feat: add dark mode support
fix: clipboard API on Safari
docs: update installation guide
refactor: simplify paste logic
```

Prefissi: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## 🔄 Pull Request Process

1. **Branch naming**: `feature/nome-feature` o `fix/nome-bug`
2. **Un PR = Una feature**: Non mischiare features non correlate
3. **Testa tutto**: Assicurati che nulla si rompa
4. **Descrizione chiara**: Spiega cosa hai cambiato e perché
5. **Screenshot**: Aggiungi se cambi UI

### PR Template
```markdown
## Descrizione
Breve descrizione del cambiamento

## Tipo di cambiamento
- [ ] Bug fix
- [ ] Nuova feature
- [ ] Breaking change
- [ ] Documentazione

## Testing
Come hai testato le modifiche?

## Screenshot
(se applicabile)
```

## 🐛 Debugging Tips

### Console Logging
Tutti i log devono iniziare con `[Snippet]`:
```javascript
console.log('[Snippet] Starting paste operation');
console.error('[Snippet] Failed:', error);
```

### Service Worker
Debug service worker:
- `chrome://extensions/` → "service worker" link
- I log appaiono in una finestra dedicata

### Storage Inspection
```javascript
// Console
chrome.storage.local.get(null, console.log);
```

## 📋 Checklist Prima del Commit

- [ ] Codice testato manualmente
- [ ] Nessun console.log dimenticato (tranne debug intenzionali)
- [ ] README aggiornato se necessario
- [ ] CHANGELOG aggiornato per breaking changes
- [ ] Funziona su Chrome latest
- [ ] Nessun errore console

## 🎯 Priority Areas

Aree dove contributi sono particolarmente benvenuti:

### High Priority
- 🐛 Bug fixes
- 📱 Mobile/tablet support
- 🌐 Compatibilità browser (Firefox, Safari)
- ♿ Accessibility improvements

### Medium Priority
- ✨ UI/UX enhancements
- 📊 Analytics/stats features
- 🎨 Themes/customization

### Low Priority
- 🔮 Experimental features
- 🧪 Advanced power user features

## ❓ Questions?

- Apri una **Discussion** per domande generali
- Tag [@maintainer] se hai dubbi su PR aperto
- Cerca nella documentazione esistente prima

## 🙏 Grazie!

Ogni contributo, piccolo o grande, è apprezzato. Dalle correzioni typo alle nuove features, tutto aiuta a rendere questo progetto migliore.

**Happy coding!** 🚀
