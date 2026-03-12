// Popup script - UI avanzata con ricerca e gestione completa

let snippets = {};
let categories = ['Generale'];
let currentEditId = null;
let searchTerm = '';
let autoSaveInterval = null;

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  renderSnippets();
  updateStats();
  renderCategories();
  
  // Auto-save backup ogni 30 secondi (safety net)
  startAutoBackup();
});

// Auto-backup system per prevenire perdita dati
function startAutoBackup() {
  // Backup iniziale
  createBackup();
  
  // Backup periodico ogni 30 secondi
  autoSaveInterval = setInterval(() => {
    if (Object.keys(snippets).length > 0) {
      createBackup();
    }
  }, 30000);
}

function createBackup() {
  const backup = {
    snippets,
    categories,
    timestamp: Date.now(),
    version: '2.3'
  };
  
  // Salva in storage separato per backup
  chrome.storage.local.set({ 
    'snippets_backup': backup,
    'snippets_backup_time': new Date().toISOString()
  });
  
  console.log('[Snippets] Auto-backup created:', {
    count: Object.keys(snippets).length,
    time: new Date().toISOString()
  });
}

// Carica dati DIRETTAMENTE da storage (non dal background)
async function loadData() {
  // CRITICAL: Carica sempre da storage.local, MAI dalla memoria del background
  const data = await chrome.storage.local.get(['snippets', 'categories', 'snippets_backup']);
  snippets = data.snippets || {};
  categories = data.categories || ['Generale'];
  
  // Se non ci sono snippet ma c'è un backup, prova a recuperare
  if (Object.keys(snippets).length === 0 && data.snippets_backup) {
    const backup = data.snippets_backup;
    const backupAge = Date.now() - (backup.timestamp || 0);
    const backupAgeMinutes = Math.floor(backupAge / 60000);
    
    if (backup.snippets && Object.keys(backup.snippets).length > 0) {
      console.warn('[Snippets] Main data empty but backup found!', {
        backupSnippets: Object.keys(backup.snippets).length,
        backupAge: `${backupAgeMinutes} minutes ago`
      });
      
      // Chiedi all'utente se vuole recuperare
      if (confirm(
        `⚠️ ATTENZIONE: Nessuno snippet trovato!\n\n` +
        `Trovato backup di ${backupAgeMinutes} minuti fa con ${Object.keys(backup.snippets).length} snippet.\n\n` +
        `Vuoi recuperare dal backup?`
      )) {
        snippets = backup.snippets;
        categories = backup.categories || ['Generale'];
        
        // Salva immediatamente il ripristino
        await chrome.storage.local.set({ snippets, categories });
        
        showToast('✅ Dati recuperati dal backup!');
        console.log('[Snippets] Restored from backup successfully');
      }
    }
  }
  
  // Debug log per tracciare caricamenti
  console.log('[Snippets] Loaded from storage:', {
    snippetsCount: Object.keys(snippets).length,
    categoriesCount: categories.length,
    timestamp: new Date().toISOString()
  });
}

// Salva dati con verifica
async function saveData() {
  try {
    // Salva in storage.local
    await chrome.storage.local.set({ snippets, categories });
    
    // Verifica che sia stato salvato correttamente
    const verification = await chrome.storage.local.get(['snippets', 'categories']);
    const savedCount = Object.keys(verification.snippets || {}).length;
    const expectedCount = Object.keys(snippets).length;
    
    if (savedCount !== expectedCount) {
      console.error('[Snippets] SAVE MISMATCH!', {
        expected: expectedCount,
        saved: savedCount
      });
      throw new Error(`Save verification failed: expected ${expectedCount}, got ${savedCount}`);
    }
    
    // Notifica il background script per aggiornare i menu
    await chrome.runtime.sendMessage({ 
      action: 'updateSnippets', 
      snippets, 
      categories 
    });
    
    // Debug log
    console.log('[Snippets] Saved successfully:', {
      snippetsCount: expectedCount,
      categoriesCount: categories.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Snippets] SAVE ERROR:', error);
    alert('⚠️ ERRORE nel salvataggio!\n\n' + error.message + '\n\nI tuoi dati potrebbero non essere stati salvati.');
    throw error;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderSnippets();
  });
  
  // Character counter for add form
  const snippetTextArea = document.getElementById('snippetText');
  snippetTextArea.addEventListener('input', updateCharCounter);
  
  // Character counter for edit modal
  const editTextArea = document.getElementById('editText');
  editTextArea.addEventListener('input', updateEditCharCounter);
  
  // Form aggiungi
  document.getElementById('addForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addSnippet();
  });
  
  document.getElementById('clearForm').addEventListener('click', clearAddForm);
  
  // Form modifica
  document.getElementById('editForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveEdit();
  });
  
  document.getElementById('closeModal').addEventListener('click', closeEditModal);
  
  // Categorie
  document.getElementById('addCategory').addEventListener('click', addCategory);
  document.getElementById('newCategory').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCategory();
  });
  
  // Import/Export
  document.getElementById('exportData').addEventListener('click', exportData);
  document.getElementById('importData').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importData);
  document.getElementById('clearAll').addEventListener('click', clearAllData);
  
  // Chiudi modal cliccando fuori
  document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') closeEditModal();
  });
}

// Switch tab
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  if (tabName === 'settings') {
    updateStats();
    renderCategories();
  } else if (tabName === 'add') {
    updateCategorySelects();
  }
}

// Aggiungi snippet
async function addSnippet() {
  const title = document.getElementById('snippetTitle').value.trim();
  const text = document.getElementById('snippetText').value.trim();
  const category = document.getElementById('snippetCategory').value;
  
  if (!title || !text) {
    alert('Inserisci titolo e testo!');
    return;
  }
  
  const id = Date.now().toString();
  snippets[id] = { title, text, category, created: Date.now() };
  
  await saveData();
  clearAddForm();
  switchTab('list');
  renderSnippets();
  
  // Feedback
  showToast('✅ Snippet salvato!');
}

function clearAddForm() {
  document.getElementById('snippetTitle').value = '';
  document.getElementById('snippetText').value = '';
  document.getElementById('snippetCategory').value = 'Generale';
  updateCharCounter(); // Reset counter
}

// Update character counter for add form
function updateCharCounter() {
  const text = document.getElementById('snippetText').value;
  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const lineCount = text.split('\n').length;
  
  document.getElementById('charCount').textContent = charCount.toLocaleString();
  document.getElementById('wordCount').textContent = wordCount.toLocaleString();
  document.getElementById('lineCount').textContent = lineCount.toLocaleString();
}

// Update character counter for edit modal
function updateEditCharCounter() {
  const text = document.getElementById('editText').value;
  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const lineCount = text.split('\n').length;
  
  document.getElementById('editCharCount').textContent = charCount.toLocaleString();
  document.getElementById('editWordCount').textContent = wordCount.toLocaleString();
  document.getElementById('editLineCount').textContent = lineCount.toLocaleString();
}

// Renderizza snippet con ricerca
function renderSnippets() {
  const container = document.getElementById('snippetList');
  const entries = Object.entries(snippets);
  
  // Filtra per ricerca
  const filtered = entries.filter(([id, snippet]) => {
    if (!searchTerm) return true;
    return snippet.title.toLowerCase().includes(searchTerm) ||
           snippet.text.toLowerCase().includes(searchTerm) ||
           snippet.category.toLowerCase().includes(searchTerm);
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div>${searchTerm ? 'Nessun risultato trovato' : 'Nessuno snippet salvato'}</div>
        ${!searchTerm ? '<div style="margin-top: 8px; font-size: 13px;">Vai nella tab "Aggiungi" per creare il primo!</div>' : ''}
      </div>
    `;
    return;
  }
  
  // Ordina per data (più recenti prima)
  filtered.sort((a, b) => (b[1].created || 0) - (a[1].created || 0));
  
  container.innerHTML = filtered.map(([id, snippet]) => {
    const preview = snippet.text.length > 120 
      ? snippet.text.substring(0, 120) + '...' 
      : snippet.text;
    
    // Calcola statistiche testo
    const charCount = snippet.text.length;
    const wordCount = snippet.text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const lineCount = snippet.text.split('\n').length;
    
    return `
      <div class="snippet-card" data-id="${id}">
        <div class="snippet-header">
          <div class="snippet-title">${escapeHtml(snippet.title)}</div>
          <div class="snippet-category">${escapeHtml(snippet.category || 'Generale')}</div>
        </div>
        <div class="snippet-preview">${escapeHtml(preview)}</div>
        <div class="snippet-stats">
          <span class="stat-item" title="Caratteri">📏 ${charCount.toLocaleString()}</span>
          <span class="stat-item" title="Parole">📝 ${wordCount.toLocaleString()}</span>
          <span class="stat-item" title="Righe">📄 ${lineCount.toLocaleString()}</span>
        </div>
        <div class="snippet-actions">
          <button class="btn-small btn-paste" data-action="paste" data-id="${id}">📋 Incolla</button>
          <button class="btn-small btn-edit" data-action="edit" data-id="${id}">✏️ Modifica</button>
          <button class="btn-small btn-delete" data-action="delete" data-id="${id}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Event delegation: gestisci click su bottoni
  container.querySelectorAll('.snippet-actions button').forEach(btn => {
    btn.addEventListener('click', handleSnippetAction);
  });
}

// Handler unificato per tutte le azioni snippet
function handleSnippetAction(e) {
  const action = e.currentTarget.dataset.action;
  const id = e.currentTarget.dataset.id;
  
  switch(action) {
    case 'paste':
      pasteSnippet(id);
      break;
    case 'edit':
      editSnippet(id);
      break;
    case 'delete':
      deleteSnippet(id);
      break;
  }
}

// Incolla snippet
async function pasteSnippet(id) {
  const snippet = snippets[id];
  if (!snippet) return;
  
  // ✅ CRITICAL FIX: Chiudi popup PRIMA di incollare
  // Questo restituisce il focus alla page, permettendo alla Clipboard API di funzionare
  
  // Store il testo da incollare
  const textToPaste = snippet.text;
  
  // Chiudi il popup immediatamente
  window.close();
  
  // Dopo la chiusura, il browser restituisce focus alla page
  // Mandiamo il messaggio in background che sarà processato quando la page ha focus
  await chrome.runtime.sendMessage({ 
    action: 'pasteSnippet', 
    text: textToPaste 
  });
  
  // Note: Non possiamo fare showToast dopo window.close() perché il popup non esiste più
  // Il feedback sarà dato dal background script con l'highlight verde
}

// Modifica snippet
function editSnippet(id) {
  currentEditId = id;
  const snippet = snippets[id];
  
  document.getElementById('editId').value = id;
  document.getElementById('editTitle').value = snippet.title;
  document.getElementById('editText').value = snippet.text;
  document.getElementById('editCategory').value = snippet.category || 'Generale';
  
  updateCategorySelects();
  updateEditCharCounter(); // Update counter with loaded text
  document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  currentEditId = null;
}

async function saveEdit() {
  const id = document.getElementById('editId').value;
  const title = document.getElementById('editTitle').value.trim();
  const text = document.getElementById('editText').value.trim();
  const category = document.getElementById('editCategory').value;
  
  if (!title || !text) {
    alert('Titolo e testo sono obbligatori!');
    return;
  }
  
  snippets[id] = {
    ...snippets[id],
    title,
    text,
    category,
    modified: Date.now()
  };
  
  await saveData();
  closeEditModal();
  renderSnippets();
  showToast('✅ Modifiche salvate!');
}

// Elimina snippet
async function deleteSnippet(id) {
  const snippet = snippets[id];
  if (!confirm(`Eliminare "${snippet.title}"?`)) return;
  
  delete snippets[id];
  await saveData();
  renderSnippets();
  updateStats();
  showToast('🗑️ Snippet eliminato');
}

// Gestione categorie
function renderCategories() {
  const container = document.getElementById('categoryList');
  container.innerHTML = categories.map(cat => `
    <div class="category-tag">
      ${escapeHtml(cat)}
      ${cat !== 'Generale' ? `<button class="delete-category-btn" data-category="${escapeHtml(cat)}">×</button>` : ''}
    </div>
  `).join('');
  
  // Event delegation per bottoni elimina categoria
  container.querySelectorAll('.delete-category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const category = e.currentTarget.dataset.category;
      deleteCategory(category);
    });
  });
  
  updateCategorySelects();
}

async function addCategory() {
  const input = document.getElementById('newCategory');
  const category = input.value.trim();
  
  if (!category) return;
  
  if (categories.includes(category)) {
    alert('Questa categoria esiste già!');
    return;
  }
  
  categories.push(category);
  categories.sort();
  await saveData();
  
  input.value = '';
  renderCategories();
  updateStats();
  showToast('✅ Categoria aggiunta!');
}

async function deleteCategory(category) {
  if (!confirm(`Eliminare la categoria "${category}"?\nGli snippet verranno spostati in "Generale".`)) {
    return;
  }
  
  // Sposta snippet in Generale
  Object.keys(snippets).forEach(id => {
    if (snippets[id].category === category) {
      snippets[id].category = 'Generale';
    }
  });
  
  categories = categories.filter(c => c !== category);
  await saveData();
  
  renderCategories();
  renderSnippets();
  showToast('🗑️ Categoria eliminata');
}

function updateCategorySelects() {
  const selects = ['snippetCategory', 'editCategory'];
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = categories.map(cat => 
      `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`
    ).join('');
    
    if (categories.includes(currentValue)) {
      select.value = currentValue;
    }
  });
}

// Statistiche
function updateStats() {
  const totalChars = Object.values(snippets).reduce((sum, s) => sum + s.text.length, 0);
  
  document.getElementById('totalSnippets').textContent = Object.keys(snippets).length;
  document.getElementById('totalCategories').textContent = categories.length;
  document.getElementById('totalChars').textContent = totalChars.toLocaleString();
}

// Export/Import
function exportData() {
  const data = {
    snippets,
    categories,
    version: '2.0',
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `snippets-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('💾 Backup esportato!');
}

async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.snippets) {
      alert('File non valido!');
      return;
    }
    
    const merge = confirm(
      `Trovati ${Object.keys(data.snippets).length} snippet.\n\n` +
      `Vuoi UNIRE con i dati esistenti?\n` +
      `(Annulla = SOSTITUISCI tutto)`
    );
    
    if (merge) {
      snippets = { ...snippets, ...data.snippets };
      categories = [...new Set([...categories, ...(data.categories || [])])];
    } else {
      snippets = data.snippets;
      categories = data.categories || ['Generale'];
    }
    
    await saveData();
    renderSnippets();
    renderCategories();
    updateStats();
    showToast('✅ Dati importati!');
    
  } catch (error) {
    alert('Errore nell\'importazione: ' + error.message);
  }
  
  e.target.value = ''; // Reset input
}

async function clearAllData() {
  if (!confirm('⚠️ ATTENZIONE!\n\nQuesto eliminerà TUTTI gli snippet e le categorie.\n\nSei sicuro?')) {
    return;
  }
  
  if (!confirm('Ultima conferma: eliminare davvero tutto?')) {
    return;
  }
  
  snippets = {};
  categories = ['Generale'];
  await saveData();
  
  renderSnippets();
  renderCategories();
  updateStats();
  showToast('🗑️ Tutti i dati eliminati');
}

// Utility
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Aggiungi stili animazione
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
