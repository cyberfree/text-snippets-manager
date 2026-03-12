# 📝 Text Snippets Manager Pro

> Estensione Chrome/Edge professionale per gestire e incollare velocemente snippet di testo con ricerca, categorie, backup e conteggio caratteri.

[![Version](https://img.shields.io/badge/version-2.7-blue.svg)](https://github.com/yourusername/text-snippets-manager)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-76%2B-brightgreen.svg)](https://www.google.com/chrome/)

---

## ✨ Features

### 🎯 Core
- ✅ **Salva snippet illimitati** con titolo, categoria e testo
- ✅ **Ricerca in tempo reale** - Trova snippet istantaneamente
- ✅ **Categorie personalizzabili** - Organizza come preferisci
- ✅ **Incolla con 1 click** - Su Gemini, ChatGPT, Gmail, e qualsiasi editor
- ✅ **Shortcut tastiera** - `Ctrl+Shift+V` (Windows) / `Cmd+Shift+V` (Mac)

### 📊 Statistiche & Insights
- 📏 **Conteggio caratteri** in tempo reale
- 📝 **Conteggio parole** per ogni snippet
- 📄 **Conteggio righe** con formattazione
- 📈 **Dashboard statistiche** totali

### 💾 Backup & Sicurezza
- 💾 **Export/Import JSON** completo
- 🔄 **Auto-backup** ogni 30 secondi
- 🔒 **Storage locale sicuro** (~5MB)
- ⚡ **Recovery automatico** perdita dati

### 🎨 UX Professionale
- 🔍 **Menu intelligente** - Si adatta al numero di snippet
- 🎯 **Modifica inline** - Edit rapido senza ricaricare
- 🌈 **Feedback visivo** - Highlight verde su incolla
- 📱 **Design moderno** - Interfaccia pulita e responsive

---

## 🚀 Installazione

### Installazione Manuale

1. **Scarica l'ultima release**
   ```bash
   git clone https://github.com/yourusername/text-snippets-manager.git
   cd text-snippets-manager
   ```

2. **Apri Chrome Extensions**
   - Vai su `chrome://extensions/`
   - Attiva "Modalità sviluppatore" (toggle in alto a destra)

3. **Carica l'estensione**
   - Click su "Carica estensione non pacchettizzata"
   - Seleziona la cartella del progetto

4. **Pronto!** 🎉
   - L'icona apparirà nella toolbar
   - Usa `Ctrl+Shift+V` per aprire il popup

---

## 📖 Come si Usa

### Aggiungere Snippet
1. Click sull'icona estensione (o `Ctrl+Shift+V`)
2. Tab **"Aggiungi"**
3. Inserisci:
   - **Titolo**: es. "Email Rifiuto Gentile"
   - **Categoria**: es. "Lavoro"
   - **Testo**: Il contenuto da salvare
4. Click **"Salva Snippet"**

### Incollare Snippet

**Metodo 1: Popup (Consigliato)**
1. Click nel campo dove vuoi incollare
2. `Ctrl+Shift+V` → Cerca snippet → Click "Incolla"
3. Popup si chiude automaticamente

**Metodo 2: Menu Contestuale**
1. Click nel campo di testo
2. Tasto destro → "Incolla snippet" → Scegli snippet

### Gestire Snippet
- **Modifica**: Click ✏️ nel popup
- **Elimina**: Click 🗑️ (con conferma)
- **Ricerca**: Digita nella barra in alto
- **Backup**: Tab "Impostazioni" → "Esporta JSON"

---

## 🎯 Compatibilità

### ✅ Funziona su:
- Gmail, Outlook
- Gemini, ChatGPT, Claude.ai
- Google Docs, Notion
- WhatsApp Web, Slack, Discord
- Facebook, LinkedIn, Twitter/X
- Qualsiasi textarea/input standard

### 📦 Requisiti:
- Chrome 76+ / Edge 79+
- ~5MB spazio storage locale

---

## 🛠️ Sviluppo

### Tech Stack
- **Manifest V3** - Service Workers
- **Vanilla JavaScript** - No framework dependencies
- **Chrome Storage API** - Persistenza dati
- **Clipboard API** - Incolla moderno

### Struttura Progetto
```
text-snippets-manager/
├── manifest.json           # Configurazione estensione
├── background.js          # Service worker + paste logic
├── popup.html            # UI principale
├── popup.js              # Logica UI + gestione snippet
├── icons/               # Icone estensione
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── docs/                # Documentazione extra
│   ├── CHANGELOG.md
│   ├── TROUBLESHOOTING.md
│   └── MIGRATION.md
└── test-page.html      # Pagina test locale
```

### Setup Dev Environment
```bash
# Clone repo
git clone https://github.com/yourusername/text-snippets-manager.git
cd text-snippets-manager

# Nessuna build necessaria - carica direttamente in Chrome
# chrome://extensions/ → Modalità sviluppatore → Carica estensione
```

### Testing
```bash
# Apri test-page.html nel browser
open test-page.html

# Testa paste su diversi tipi di editor:
# - Textarea standard
# - ContentEditable
# - Input fields
# - Simulazioni Gemini/ChatGPT
```

---

## 🐛 Troubleshooting

### Incolla non funziona su sito X
1. Apri DevTools (F12) → Console
2. Cerca log `[Snippet]`
3. Verifica che il campo sia effettivamente editabile
4. Prova menu contestuale invece del popup

### Snippet scompaiono
- Controlla storage: `chrome.storage.local.get(null, console.log)`
- Usa Export/Import per backup manuale
- Verifica che l'estensione non sia stata disabilitata

### Clipboard API errori
- Assicurati che la page abbia focus
- Usa Chrome 76+ (required per ClipboardItem)
- Alcuni siti bloccano clipboard - fallback automatico attivo

**Vedi [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) per guida completa**

---

## 📝 Changelog

### v2.7 - Character Counter (Latest)
- ✅ Conteggio caratteri/parole/righe per ogni snippet
- ✅ Contatore live nei form
- ✅ Formattazione numeri con separatori

### v2.6.1 - Hotfix
- 🐛 Fix ReferenceError in pasteText injection
- ✅ Self-contained function per script injection

### v2.6 - Popup Close Fix
- 🐛 Fix focus loss - popup chiude prima di incollare
- ✅ Clipboard API ora funziona dal popup

### v2.3 - Data Persistence Fix
- 🐛 Fix service worker data loss
- ✅ Storage.local come single source of truth

### v2.0 - Major Upgrade
- ✅ Ricerca, categorie, backup
- ✅ UI professionale a 3 tab
- ✅ Shortcut tastiera

**Vedi [CHANGELOG.md](docs/CHANGELOG.md) per cronologia completa**

---

## 🤝 Contributing

Contributi benvenuti! Per favore:

1. **Fork** il repository
2. **Crea branch** per la feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** le modifiche (`git commit -m 'Add AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Apri Pull Request**

### Guidelines:
- Testa su Chrome latest
- Mantieni compatibilità Manifest V3
- Aggiungi console.log per debug
- Documenta breaking changes

---

## 📄 License

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

**TL;DR**: Puoi usare, modificare, distribuire liberamente. Solo menziona l'autore originale.

---

## 🙏 Acknowledgments

- Grazie a tutti gli utenti che hanno testato e dato feedback
- Ispirato da Text Blaze, AutoText Expander
- Built with ❤️ per chi lavora con testi ripetitivi

---

## 📞 Support & Contact

- 🐛 **Bug Report**: [Issues](https://github.com/yourusername/text-snippets-manager/issues)
- 💡 **Feature Request**: [Discussions](https://github.com/yourusername/text-snippets-manager/discussions)
- 📧 **Email**: cyberfree17@google.com
- 🌟 **Star** il progetto se ti è utile!

---

## 🗺️ Roadmap

### Planned Features
- [ ] Chrome.storage.sync per sincronizzazione multi-device
- [ ] Template con variabili (`Ciao {nome}`)
- [ ] Shortcut personalizzabili per snippet frequenti
- [ ] Dark mode
- [ ] Statistiche uso snippet
- [ ] Tag multipli
- [ ] Chrome Web Store publication

### Ideas Welcome
Apri una [Discussion](https://github.com/yourusername/text-snippets-manager/discussions) con le tue idee!

---

<div align="center">

**Made with 💙 for productivity enthusiasts**

⭐ **Star this repo if you find it useful!** ⭐

</div>
