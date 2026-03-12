// Background service worker - Gestione menu contestuali intelligente

let snippets = {};
let categories = [];

// ⚠️ CRITICAL: Load data on EVERY service worker startup
// Service workers can be terminated by Chrome after 30s of inactivity
// We must reload from storage each time it wakes up

// Inizializza all'avvio (solo prima installazione)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  loadData();
});

// ✅ FIX: Load data quando service worker si risveglia
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser startup - loading data');
  loadData();
});

// ✅ FIX: Garantisci che i dati siano sempre caricati
// Questa funzione viene chiamata anche dai message handlers
async function ensureDataLoaded() {
  if (Object.keys(snippets).length === 0 && Object.keys(categories).length === 0) {
    console.log('Data cache empty, reloading from storage');
    await loadData();
  }
}

// Carica dati salvati
async function loadData() {
  try {
    const data = await chrome.storage.local.get(['snippets', 'categories']);
    snippets = data.snippets || {};
    categories = data.categories || ['Generale'];
    console.log(`Loaded ${Object.keys(snippets).length} snippets and ${categories.length} categories`);
    updateContextMenus();
  } catch (error) {
    console.error('Failed to load data from storage:', error);
    snippets = {};
    categories = ['Generale'];
  }
}

// Aggiorna menu contestuali in modo intelligente
function updateContextMenus() {
  chrome.contextMenus.removeAll(() => {
    const snippetEntries = Object.entries(snippets);
    
    // Menu principale
    chrome.contextMenus.create({
      id: 'snippets-parent',
      title: 'Incolla snippet',
      contexts: ['editable']
    });

    if (snippetEntries.length === 0) {
      chrome.contextMenus.create({
        id: 'no-snippets',
        parentId: 'snippets-parent',
        title: '(Nessuno snippet - apri popup)',
        contexts: ['editable'],
        enabled: false
      });
      return;
    }

    // Raggruppa per categoria
    const categorized = {};
    snippetEntries.forEach(([id, snippet]) => {
      const cat = snippet.category || 'Generale';
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push([id, snippet]);
    });

    // Se troppi snippet (>15), mostra solo categorie
    if (snippetEntries.length > 15) {
      Object.keys(categorized).sort().forEach(category => {
        const categoryId = `category-${category}`;
        chrome.contextMenus.create({
          id: categoryId,
          parentId: 'snippets-parent',
          title: `📁 ${category} (${categorized[category].length})`,
          contexts: ['editable']
        });

        // Mostra max 10 snippet per categoria
        categorized[category].slice(0, 10).forEach(([id, snippet]) => {
          chrome.contextMenus.create({
            id: `snippet-${id}`,
            parentId: categoryId,
            title: truncate(snippet.title, 40),
            contexts: ['editable']
          });
        });

        if (categorized[category].length > 10) {
          chrome.contextMenus.create({
            id: `more-${category}`,
            parentId: categoryId,
            title: `... altri ${categorized[category].length - 10} (usa popup)`,
            contexts: ['editable'],
            enabled: false
          });
        }
      });
    } else {
      // Pochi snippet: mostra tutti direttamente
      snippetEntries
        .sort((a, b) => a[1].title.localeCompare(b[1].title))
        .forEach(([id, snippet]) => {
          chrome.contextMenus.create({
            id: `snippet-${id}`,
            parentId: 'snippets-parent',
            title: truncate(snippet.title, 50),
            contexts: ['editable']
          });
        });
    }

    // Separatore e link a popup
    chrome.contextMenus.create({
      id: 'separator',
      parentId: 'snippets-parent',
      type: 'separator',
      contexts: ['editable']
    });
    
    chrome.contextMenus.create({
      id: 'open-manager',
      parentId: 'snippets-parent',
      title: '⚙️ Gestisci snippet (Ctrl+Shift+V)',
      contexts: ['editable']
    });
  });
}

// Gestisci click menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // ✅ FIX: Ricarica dati se cache vuota (service worker morto e risvegliato)
  if (Object.keys(snippets).length === 0) {
    console.log('[Background] Context menu click - cache empty, reloading from storage');
    await loadData();
  }
  
  if (info.menuItemId.startsWith('snippet-')) {
    const snippetId = info.menuItemId.replace('snippet-', '');
    const snippet = snippets[snippetId];
    
    if (snippet) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pasteText,
        args: [snippet.text]
      });
    } else {
      console.error('[Background] Snippet not found:', snippetId);
    }
  } else if (info.menuItemId === 'open-manager') {
    chrome.action.openPopup();
  }
});

// Funzione di incolla (iniettata nella pagina) - Multi-strategy autocontenuta
// IMPORTANTE: Questa funzione viene iniettata nella page, quindi deve essere self-contained
// Non può chiamare altre funzioni definite qui perché non vengono iniettate
function pasteText(text) {
  console.log('[Snippet] Starting paste operation');
  
  const activeElement = document.activeElement;
  if (!activeElement) {
    console.warn('[Snippet] No active element found');
    return;
  }
  
  console.log('[Snippet] Target element:', {
    tag: activeElement.tagName,
    contentEditable: activeElement.isContentEditable,
    type: activeElement.type
  });
  
  // Focus element
  try {
    activeElement.focus();
    console.log('[Snippet] Element focused');
  } catch (e) {
    console.warn('[Snippet] Could not focus element:', e);
  }
  
  // Helper function: Show feedback (inline)
  const showFeedback = (element) => {
    if (!element) return;
    element.style.transition = 'background-color 0.3s';
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#e8f5e9';
    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, 300);
  };
  
  // Helper function: Try direct insertion (inline)
  const tryDirectInsertion = (element) => {
    if (!element) return;
    
    console.log('[Snippet] tryDirectInsertion called');
    
    // Check shadow DOM
    let targetElement = element;
    if (element.shadowRoot) {
      const shadowInput = element.shadowRoot.querySelector('[contenteditable], textarea, input');
      if (shadowInput) {
        console.log('[Snippet] Found element in shadow DOM');
        targetElement = shadowInput;
      }
    }
    
    // Focus target
    try {
      targetElement.focus();
    } catch (e) {
      console.warn('[Snippet] Could not focus target element:', e);
    }
    
    // INPUT/TEXTAREA
    if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
      console.log('[Snippet] Using textarea/input insertion');
      const start = targetElement.selectionStart || 0;
      const end = targetElement.selectionEnd || 0;
      const currentValue = targetElement.value || '';
      
      targetElement.value = currentValue.substring(0, start) + text + currentValue.substring(end);
      targetElement.selectionStart = targetElement.selectionEnd = start + text.length;
      
      ['input', 'change', 'keyup', 'keydown'].forEach(eventType => {
        targetElement.dispatchEvent(new Event(eventType, { bubbles: true }));
      });
      
      targetElement.dispatchEvent(new InputEvent('input', { 
        bubbles: true, 
        inputType: 'insertText',
        data: text 
      }));
      
      showFeedback(targetElement);
      console.log('[Snippet] Direct insertion successful (textarea/input)');
      return true;
    }
    
    // ContentEditable
    if (targetElement.isContentEditable) {
      console.log('[Snippet] Using contentEditable insertion');
      
      const success = document.execCommand('insertText', false, text);
      console.log('[Snippet] execCommand insertText result:', success);
      
      if (!success) {
        console.log('[Snippet] execCommand failed, trying manual insertion');
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
          
          console.log('[Snippet] Manual insertion successful');
        } else {
          console.log('[Snippet] No selection, appending to end');
          targetElement.textContent += text;
        }
        
        ['input', 'change', 'beforeinput'].forEach(eventType => {
          targetElement.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
      
      showFeedback(targetElement);
      console.log('[Snippet] ContentEditable insertion completed');
      return true;
    }
    
    // Recursive search for editable child
    const editableChild = targetElement.querySelector('[contenteditable="true"], textarea, input');
    if (editableChild) {
      console.log('[Snippet] Found editable child, recursing');
      return tryDirectInsertion(editableChild);
    }
    
    // Search parent chain
    const editableParent = targetElement.closest('[contenteditable="true"]');
    if (editableParent && editableParent !== targetElement) {
      console.log('[Snippet] Found editable parent, recursing');
      return tryDirectInsertion(editableParent);
    }
    
    console.error('[Snippet] Unable to paste - no suitable element found');
    alert('❌ Impossibile incollare: elemento non compatibile.\n\nProva:\n1. Clicca nel campo di testo\n2. Usa il menu contestuale (tasto destro)');
    return false;
  };
  
  // Strategy 1: Clipboard API (for modern editors)
  if (activeElement.isContentEditable || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'INPUT') {
    
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      console.log('[Snippet] Trying Clipboard API');
      
      // Ensure document has focus
      if (document.hasFocus && !document.hasFocus()) {
        console.log('[Snippet] Document not focused, attempting to focus');
        window.focus();
        // Retry after focus settles
        setTimeout(() => {
          console.log('[Snippet] Retrying after focus');
          // Just use direct insertion after focus attempt
          tryDirectInsertion(activeElement);
        }, 100);
        return;
      }
      
      // Attempt clipboard paste
      const type = "text/plain";
      const blob = new Blob([text], { type });
      const clipboardItem = new ClipboardItem({ [type]: blob });
      
      navigator.clipboard.write([clipboardItem])
        .then(() => {
          console.log('[Snippet] Text written to clipboard successfully');
          
          // Trigger paste event
          try {
            const pasteEvent = new ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              composed: true
            });
            
            Object.defineProperty(pasteEvent, 'clipboardData', {
              value: {
                getData: () => text,
                types: ['text/plain'],
                items: []
              }
            });
            
            const dispatched = activeElement.dispatchEvent(pasteEvent);
            console.log('[Snippet] Paste event dispatched:', dispatched);
          } catch (e) {
            console.warn('[Snippet] Paste event failed:', e);
          }
          
          // Fallback: execCommand('paste')
          setTimeout(() => {
            try {
              activeElement.focus();
              const success = document.execCommand('paste');
              console.log('[Snippet] execCommand paste result:', success);
              
              if (!success) {
                setTimeout(() => {
                  const currentContent = activeElement.textContent || activeElement.value || '';
                  if (!currentContent.includes(text.substring(0, 20))) {
                    console.log('[Snippet] Paste failed, trying direct insertion');
                    tryDirectInsertion(activeElement);
                  } else {
                    console.log('[Snippet] Paste successful');
                    showFeedback(activeElement);
                  }
                }, 100);
              } else {
                showFeedback(activeElement);
              }
            } catch (e) {
              console.warn('[Snippet] execCommand paste failed:', e);
              tryDirectInsertion(activeElement);
            }
          }, 100);
        })
        .catch(err => {
          console.error('[Snippet] Clipboard write failed:', err);
          console.log('[Snippet] Error details:', {
            name: err.name,
            message: err.message,
            hasFocus: document.hasFocus ? document.hasFocus() : 'unknown'
          });
          
          // Fallback to direct insertion
          tryDirectInsertion(activeElement);
        });
      
      return;
    } else {
      console.log('[Snippet] Clipboard API not available, using fallback');
    }
  }
  
  // Fallback: Direct insertion
  console.log('[Snippet] Using direct insertion fallback');
  tryDirectInsertion(activeElement);
}

function showFeedback(element) {
  if (!element) return;
  element.style.transition = 'background-color 0.3s';
  const originalBg = element.style.backgroundColor;
  element.style.backgroundColor = '#e8f5e9';
  setTimeout(() => {
    element.style.backgroundColor = originalBg;
  }, 300);
}


// Messaggi dal popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSnippets') {
    snippets = request.snippets;
    categories = request.categories || categories;
    updateContextMenus();
    sendResponse({ success: true });
  } else if (request.action === 'getData') {
    // ✅ CRITICAL FIX: SEMPRE ricarica da storage, MAI fidarsi della memoria
    // Service worker può morire e perdere le variabili in RAM
    chrome.storage.local.get(['snippets', 'categories'], (data) => {
      const freshSnippets = data.snippets || {};
      const freshCategories = data.categories || ['Generale'];
      
      // Aggiorna anche la cache in memoria del background
      snippets = freshSnippets;
      categories = freshCategories;
      
      console.log('[Background] getData - serving fresh data from storage:', {
        snippetsCount: Object.keys(freshSnippets).length,
        categoriesCount: freshCategories.length,
        timestamp: new Date().toISOString()
      });
      
      sendResponse({ snippets: freshSnippets, categories: freshCategories });
    });
    return true; // Required for async sendResponse
  } else if (request.action === 'pasteSnippet') {
    // ✅ CRITICAL FIX: Delay per permettere al popup di chiudersi
    // e alla page di recuperare il focus PRIMA di tentare l'incolla
    console.log('[Background] pasteSnippet request received, waiting for popup to close...');
    
    // Wait 100ms per permettere:
    // 1. Popup chiusura completa
    // 2. Browser restituisce focus alla page
    // 3. Clipboard API può funzionare
    setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          console.log('[Background] Injecting paste script into tab:', tabs[0].id);
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: pasteText,
            args: [request.text]
          });
        } else {
          console.error('[Background] No active tab found');
        }
      });
    }, 100);
    
    sendResponse({ success: true });
  }
  return true;
});

// Utility
function truncate(str, max) {
  return str.length > max ? str.substring(0, max) + '...' : str;
}

