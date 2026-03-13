# 🚀 Guida Migrazione v1.0 → v2.0

## ⚠️ IMPORTANTE: Backup Prima di Aggiornare

Se stai usando la v1.0 e hai snippet salvati:

### PRIMA di installare v2.0:

1. Apri l'estensione v1.0
2. **COPIA MANUALMENTE** tutti i tuoi snippet in un file di testo
   (la v1.0 non aveva export, quindi devi farlo a mano)

### Dopo aver installato v2.0:

1. Inserisci nuovamente gli snippet usando il nuovo form
2. Assegna categorie appropriate
3. Vai in **Impostazioni** → **Esporta JSON** per creare il primo backup

---

## 🔄 Nota sulla Compatibilità Dati

**La v2.0 NON è retrocompatibile con i dati della v1.0** perché:

- v1.0: Usava titolo come chiave (`snippets[titolo] = testo`)
- v2.0: Usa ID univoci + oggetti (`snippets[id] = {title, text, category, ...}`)

**Non esiste migrazione automatica** - questo è stato fatto intenzionalmente per:
- Evitare corruzione dati
- Permettere struttura dati più robusta
- Aggiungere metadati (categoria, timestamp)

---

## 💡 Consigli per la Migrazione

### Se hai POCHI snippet (<10):
✅ Reinseriscili manualmente - ci metti 2 minuti e puoi organizzarli bene

### Se hai MOLTI snippet (>50):
✅ Opzione 1: Usa uno script Python per convertire
✅ Opzione 2: Reinserisci gradualmente i più usati
✅ Opzione 3: Contattami per aiuto con conversione

---

## 📦 Installazione Fresh v2.0

### Nuova installazione (nessuna v1.0 presente):
1. Estrai lo ZIP
2. Chrome → `chrome://extensions/`
3. "Carica estensione non pacchettizzata"
4. Seleziona la cartella

### Aggiornamento da v1.0:
1. **Backup manuale** dei tuoi snippet v1.0
2. Chrome → `chrome://extensions/`
3. **Rimuovi** l'estensione v1.0
4. Installa v2.0 come sopra
5. Reinserisci gli snippet

---

## ❓ FAQ Migrazione

**Q: Perdo i miei snippet aggiornando?**  
A: SÌ, non c'è migrazione automatica. Backup manuale prima.

**Q: Posso usare v1.0 e v2.0 insieme?**  
A: NO, Chrome non permette due estensioni con stesso ID.

**Q: Vale la pena migrare?**  
A: ASSOLUTAMENTE SÌ se:
- Hai >10 snippet
- Vuoi organizzazione
- Vuoi ricerca
- Vuoi backup automatici
- Vuoi shortcut tastiera

**Q: Posso tornare a v1.0?**  
A: Tecnicamente sì, ma perché dovresti? 😄

---

## 🎯 Checklist Post-Migrazione

- [ ] Tutti gli snippet reinseriti
- [ ] Categorie create e assegnate
- [ ] Primo backup esportato (Settings → Export)
- [ ] Shortcut testato (Ctrl+Shift+V)
- [ ] Ricerca testata
- [ ] Menu contestuale verificato

---

**Buona migrazione! 🚀**

Per problemi: crea un issue o contattami.
