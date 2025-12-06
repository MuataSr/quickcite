// QuickCite - Popup Interface
// Handles quote display, management, and user interactions

// ============================================================================
// DOM ELEMENT REFERENCES
// ============================================================================
const quoteList = document.getElementById('quoteList');
const emptyState = document.getElementById('emptyState');
const quoteCount = document.getElementById('quoteCount');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const quoteModal = document.getElementById('quoteModal');
const closeModal = document.getElementById('closeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const deleteQuoteBtn = document.getElementById('deleteQuoteBtn');
const notificationToast = document.getElementById('notificationToast');

// Modal elements
const modalQuoteText = document.getElementById('modalQuoteText');
const modalSourceTitle = document.getElementById('modalSourceTitle');
const modalSourceUrl = document.getElementById('modalSourceUrl');
const modalAccessDate = document.getElementById('modalAccessDate');
const modalTimestamp = document.getElementById('modalTimestamp');
const modalMlaCitation = document.getElementById('modalMlaCitation');
const modalApaCitation = document.getElementById('modalApaCitation');

let currentQuote = null;

// ============================================================================
// SAMPLE DATA: For manual testing (remove in production)
// ============================================================================
/*
const SAMPLE_QUOTES = [
  {
    id: 'sample-1',
    text: 'The only way to do great work is to love what you do.',
    sourceTitle: 'Steve Jobs Biography',
    sourceUrl: 'https://example.com/steve-jobs',
    timestamp: '2024-01-15T10:30:00.000Z',
    accessDate: 'January 15, 2024'
  },
  {
    id: 'sample-2',
    text: 'Innovation distinguishes between a leader and a follower.',
    sourceTitle: 'Steve Jobs Biography',
    sourceUrl: 'https://example.com/steve-jobs-2',
    timestamp: '2024-01-14T14:20:00.000Z',
    accessDate: 'January 14, 2024'
  },
  {
    id: 'sample-3',
    text: 'Life is what happens to you while you\'re busy making other plans.',
    sourceTitle: 'Beautiful Boy - John Lennon',
    sourceUrl: 'https://example.com/john-lennon',
    timestamp: '2024-01-13T09:15:00.000Z',
    accessDate: 'January 13, 2024'
  }
];

// Uncomment to load sample data for testing
// chrome.storage.local.set({ quotes: SAMPLE_QUOTES });
*/

// ============================================================================
// INITIALIZATION: Load quotes when popup opens
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  await loadQuotes();
  setupEventListeners();
});

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================
function setupEventListeners() {
  // Refresh button
  refreshBtn.addEventListener('click', loadQuotes);

  // Export button
  exportBtn.addEventListener('click', exportQuotes);

  // Bibliography button
  const bibliographyBtn = document.getElementById('bibliographyBtn');
  if (bibliographyBtn) {
    bibliographyBtn.addEventListener('click', generateBibliography);
  }

  // Clear all button
  clearAllBtn.addEventListener('click', clearAllQuotes);

  // Modal controls
  closeModal.addEventListener('click', closeQuoteModal);
  closeModalBtn.addEventListener('click', closeQuoteModal);
  deleteQuoteBtn.addEventListener('click', deleteCurrentQuote);

  // Click outside modal to close
  quoteModal.addEventListener('click', (e) => {
    if (e.target === quoteModal) {
      closeQuoteModal();
    }
  });

  // Tab switching
  const quotesTab = document.getElementById('quotesTab');
  const settingsTab = document.getElementById('settingsTab');
  const quotesTabContent = document.getElementById('quotesTabContent');
  const settingsTabContent = document.getElementById('settingsTabContent');

  quotesTab.addEventListener('click', () => switchTab('quotes'));
  settingsTab.addEventListener('click', () => switchTab('settings'));

  // Modal tab switching
  const modalInfoTab = document.getElementById('modalInfoTab');
  const modalCitationsTab = document.getElementById('modalCitationsTab');

  if (modalInfoTab) {
    modalInfoTab.addEventListener('click', () => switchModalTab('info'));
  }
  if (modalCitationsTab) {
    modalCitationsTab.addEventListener('click', () => switchModalTab('citations'));
  }

  // Settings controls
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');

  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);

  // Copy citation buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const citationType = e.target.dataset.citation;
      copyCitation(citationType);
    });
  });

  // Copy signal phrase buttons (using event delegation since buttons are in modal)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-phrase-btn')) {
      const phraseTemplate = e.target.dataset.phrase;
      copySignalPhrase(phraseTemplate);
    }
  });
}

// ============================================================================
// LOAD QUOTES: Fetch from storage and display
// ============================================================================
async function loadQuotes() {
  try {
    const result = await chrome.storage.local.get(['quotes']);
    const quotes = result.quotes || [];

    console.log(`Loaded ${quotes.length} quotes from storage`);

    // Sort quotes by timestamp (newest first)
    quotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    renderQuotes(quotes);
    updateQuoteCount(quotes.length);

  } catch (error) {
    console.error('Error loading quotes:', error);
    showToast('Error loading quotes');
  }
}

// ============================================================================
// RENDER QUOTES: Display quotes in the list
// ============================================================================
function renderQuotes(quotes) {
  // Clear existing quotes
  quoteList.innerHTML = '';

  if (quotes.length === 0) {
    // Show empty state
    quoteList.appendChild(emptyState);
    emptyState.style.display = 'flex';
    return;
  }

  // Hide empty state
  emptyState.style.display = 'none';

  // Create and append quote items
  quotes.forEach(quote => {
    const quoteItem = createQuoteItem(quote);
    quoteList.appendChild(quoteItem);
  });
}

// ============================================================================
// CREATE QUOTE ITEM: Generate HTML for a single quote
// ============================================================================
function createQuoteItem(quote) {
  const item = document.createElement('div');
  item.className = 'quote-item';
  item.dataset.quoteId = quote.id;

  // Truncate quote text for preview (max 120 chars)
  const previewText = quote.text.length > 120
    ? quote.text.substring(0, 117) + '...'
    : quote.text;

  // Format timestamp
  const date = new Date(quote.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  item.innerHTML = `
    <div class="quote-preview">
      <p class="quote-text">"${escapeHtml(previewText)}"</p>
    </div>
    <div class="quote-source">
      <div class="source-title">${escapeHtml(quote.sourceTitle)}</div>
      <div class="source-meta">
        <span class="source-url">${escapeHtml(getDomainFromUrl(quote.sourceUrl))}</span>
        <span class="separator">"</span>
        <span class="quote-date">${formattedDate}</span>
      </div>
    </div>
    <div class="quote-actions">
      <button class="action-btn view-btn" title="View Details" data-quote-id="${quote.id}">
        <i data-lucide="eye"></i>
      </button>
      <button class="action-btn delete-btn" title="Delete" data-quote-id="${quote.id}">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `;

  // Add click listeners for view and delete
  const viewBtn = item.querySelector('.view-btn');
  const deleteBtn = item.querySelector('.delete-btn');

  viewBtn.addEventListener('click', () => showQuoteDetails(quote));
  deleteBtn.addEventListener('click', () => deleteQuote(quote.id));

  // Initialize Lucide icons for dynamically created elements
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  return item;
}

// ============================================================================
// SHOW QUOTE DETAILS: Display modal with full quote information
// ============================================================================
function showQuoteDetails(quote) {
  currentQuote = quote;

  // Fill in quote text
  modalQuoteText.textContent = `"${quote.text}"`;

  // Fill in metadata
  modalSourceTitle.textContent = quote.sourceTitle;
  modalSourceTitle.href = quote.sourceUrl;

  // Fill in author
  const modalAuthor = document.getElementById('modalAuthor');
  modalAuthor.textContent = quote.author || 'Unknown Author';

  modalSourceUrl.textContent = quote.sourceUrl;
  modalSourceUrl.href = quote.sourceUrl;

  modalAccessDate.textContent = quote.accessDate;

  // Format timestamp
  const timestamp = new Date(quote.timestamp);
  const formattedTimestamp = timestamp.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  modalTimestamp.textContent = formattedTimestamp;

  // Generate citation formats
  const mlaCitation = generateMlaCitation(quote);
  const apaCitation = generateApaCitation(quote);

  modalMlaCitation.textContent = mlaCitation;
  modalApaCitation.textContent = apaCitation;

  // Show modal
  quoteModal.style.display = 'flex';
}

// ============================================================================
// CLOSE QUOTE MODAL
// ============================================================================
function closeQuoteModal() {
  quoteModal.style.display = 'none';
  currentQuote = null;
}

// ============================================================================
// DELETE QUOTE: Remove a single quote
// ============================================================================
async function deleteQuote(quoteId) {
  if (!confirm('Are you sure you want to delete this quote?')) {
    return;
  }

  try {
    const result = await chrome.storage.local.get(['quotes']);
    const quotes = result.quotes || [];
    const updatedQuotes = quotes.filter(q => q.id !== quoteId);

    await chrome.storage.local.set({ quotes: updatedQuotes });

    // Refresh the display
    await loadQuotes();

    // Close modal if viewing the deleted quote
    if (currentQuote && currentQuote.id === quoteId) {
      closeQuoteModal();
    }

    showToast('Quote deleted successfully');

  } catch (error) {
    console.error('Error deleting quote:', error);
    showToast('Error deleting quote');
  }
}

// ============================================================================
// DELETE CURRENT QUOTE: Delete the quote currently being viewed
// ============================================================================
function deleteCurrentQuote() {
  if (currentQuote) {
    deleteQuote(currentQuote.id);
  }
}

// ============================================================================
// CLEAR ALL QUOTES: Remove all saved quotes
// ============================================================================
async function clearAllQuotes() {
  if (!confirm('Are you sure you want to delete ALL quotes? This cannot be undone.')) {
    return;
  }

  try {
    await chrome.storage.local.set({ quotes: [] });

    // Refresh the display
    await loadQuotes();

    // Close modal if open
    if (quoteModal.style.display === 'flex') {
      closeQuoteModal();
    }

    showToast('All quotes deleted');

  } catch (error) {
    console.error('Error clearing quotes:', error);
    showToast('Error clearing quotes');
  }
}

// ============================================================================
// EXPORT QUOTES: Download all quotes as formatted TXT
// ============================================================================
async function exportQuotes() {
  try {
    const result = await chrome.storage.local.get(['quotes']);
    const quotes = result.quotes || [];

    if (quotes.length === 0) {
      showToast('No quotes to export');
      return;
    }

    // Get user preferences for export format
    const prefsResult = await chrome.storage.local.get(['exportPreferences']);
    const preferences = prefsResult.exportPreferences || { includeMLA: true, includeAPA: true, includeMetadata: true };

    // Build formatted text content
    let textContent = `QUICKCITE - EXPORT\n`;
    textContent += `Exported: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    textContent += `Total Quotes: ${quotes.length}\n`;
    textContent += `${'='.repeat(80)}\n\n`;

    quotes.forEach((quote, index) => {
      // Quote number and source
      textContent += `QUOTE ${index + 1}\n`;
      textContent += `${'-'.repeat(80)}\n\n`;

      // Quote text
      textContent += `Quote:\n`;
      textContent += `"${quote.text}"\n\n`;

      // Metadata
      if (preferences.includeMetadata) {
        textContent += `Source: ${quote.sourceTitle}\n`;
        textContent += `URL: ${quote.sourceUrl}\n`;
        textContent += `Saved: ${quote.accessDate}\n`;
        textContent += `Timestamp: ${quote.timestamp}\n\n`;
      }

      // MLA Citation
      if (preferences.includeMLA) {
        textContent += `MLA Format:\n`;
        const mlaCitation = generateMlaCitation(quote);
        textContent += `  ${mlaCitation}\n\n`;
      }

      // APA Citation
      if (preferences.includeAPA) {
        textContent += `APA Format:\n`;
        const apaCitation = generateApaCitation(quote);
        textContent += `  ${apaCitation}\n\n`;
      }

      textContent += `${'='.repeat(80)}\n\n`;
    });

    // Create and trigger download as TXT
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${quotes.length} quotes`);

  } catch (error) {
    console.error('Error exporting quotes:', error);
    showToast('Error exporting quotes');
  }
}

// ============================================================================
// GENERATE BIBLIOGRAPHY: Create MLA Works Cited and APA References page
// ============================================================================
async function generateBibliography() {
  try {
    const result = await chrome.storage.local.get(['quotes']);
    const quotes = result.quotes || [];

    if (quotes.length === 0) {
      showToast('No quotes to generate bibliography');
      return;
    }

    // Get user preferences
    const prefsResult = await chrome.storage.local.get(['userPreferences', 'exportPreferences']);
    const userPrefs = prefsResult.userPreferences || {};
    const exportPrefs = prefsResult.exportPreferences || { includeMLA: true, includeAPA: true };

    // Build bibliography content
    let bibliographyContent = `QUICKCITE - BIBLIOGRAPHY GENERATOR\n`;
    bibliographyContent += `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    bibliographyContent += `Total Sources: ${quotes.length}\n`;
    bibliographyContent += `${'='.repeat(80)}\n\n`;

    // Sort quotes by author for bibliography
    const sortedQuotes = [...quotes].sort((a, b) => {
      const authorA = (a.author || 'Unknown Author').split(' ').pop().toLowerCase();
      const authorB = (b.author || 'Unknown Author').split(' ').pop().toLowerCase();
      return authorA.localeCompare(authorB);
    });

    // MLA Works Cited Section
    if (exportPrefs.includeMLA) {
      bibliographyContent += `MLA WORKS CITED\n`;
      bibliographyContent += `${'='.repeat(80)}\n\n`;

      sortedQuotes.forEach((quote, index) => {
        const author = quote.author || 'Unknown Author';
        const title = quote.sourceTitle;
        const url = quote.sourceUrl;
        const accessDate = quote.accessDate;

        // MLA format: Author. "Title." Website, Accessed Date. URL.
        const mlaEntry = `${author}. "${title}." Accessed ${accessDate}. ${url}.\n\n`;

        // Add hanging indent (0.5") using tabs for simplicity
        // In a real document, this would be formatted with proper paragraph styles
        bibliographyContent += mlaEntry;
      });

      bibliographyContent += `\n${'='.repeat(80)}\n\n`;
    }

    // APA References Section
    if (exportPrefs.includeAPA) {
      bibliographyContent += `APA REFERENCES\n`;
      bibliographyContent += `${'='.repeat(80)}\n\n`;

      sortedQuotes.forEach((quote, index) => {
        const author = quote.author || 'Unknown Author';
        const title = quote.sourceTitle;
        const url = quote.sourceUrl;
        const year = new Date(quote.timestamp).getFullYear();

        // APA format: Author, A. A. (Year). Title. Website. URL
        const apaEntry = `${author} (${year}). ${title}. Retrieved ${quote.accessDate}, from ${url}.\n\n`;

        // Add hanging indent
        bibliographyContent += apaEntry;
      });
    }

    // Create and trigger download
    const blob = new Blob([bibliographyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickcite-bibliography-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Bibliography generated for ${quotes.length} sources`);

  } catch (error) {
    console.error('Error generating bibliography:', error);
    showToast('Error generating bibliography');
  }
}

// ============================================================================
// COPY CITATION: Copy MLA or APA citation to clipboard
// ============================================================================
async function copyCitation(type) {
  try {
    let citationText = '';
    if (type === 'mla') {
      citationText = modalMlaCitation.textContent;
    } else if (type === 'apa') {
      citationText = modalApaCitation.textContent;
    }

    await navigator.clipboard.writeText(citationText);
    showToast('Copied!');

    // Auto-hide after 2 seconds for copy feedback
    setTimeout(() => {
      notificationToast.classList.remove('show');
    }, 2000);

  } catch (error) {
    console.error('Error copying citation:', error);
    showToast('Failed to copy citation');
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Update quote count display
function updateQuoteCount(count) {
  quoteCount.textContent = `${count} ${count === 1 ? 'quote' : 'quotes'}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Extract domain from URL
function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return url;
  }
}

// Generate MLA citation format with hanging indent
function generateMlaCitation(quote) {
  // Use extracted author or fallback to "Unknown Author"
  const author = quote.author || 'Unknown Author';
  const title = quote.sourceTitle;
  const url = quote.sourceUrl;
  const date = quote.accessDate;
  const quoteText = quote.text;

  // MLA 9th edition format (Purdue OWL)
  // Format: "Quote." Author. Website Title, URL, Accessed Date.
  // Note: MLA recommends including article titles in quotes for specific articles
  // and italics for the website/container name
  return `"${quoteText}" ${author}. "${title}." Accessed ${date}. ${url}.`;
}

// Generate APA citation format with hanging indent
function generateApaCitation(quote) {
  // Use extracted author or fallback to "Unknown Author"
  const author = quote.author || 'Unknown Author';
  const date = `(${new Date(quote.timestamp).getFullYear()})`;
  const title = quote.sourceTitle;
  const url = quote.sourceUrl;

  // APA 7th edition format (Purdue OWL)
  // Format: Author, A. A. (Year). Title of article. Website Title. URL
  // Note: Article titles are not italicized in APA 7th edition (only journal/book titles)
  // URLs should end with a period
  return `${author} ${date}. ${title}. Retrieved ${quote.accessDate}, from ${url}.`;
}

// Show toast notification
function showToast(message) {
  const toastMessage = document.getElementById('toastMessage');
  toastMessage.textContent = message;
  notificationToast.classList.add('show');

  // Auto-hide after 3 seconds
  setTimeout(() => {
    notificationToast.classList.remove('show');
  }, 3000);
}

// ============================================================================
// SIGNAL PHRASE: Copy signal phrase templates
// ============================================================================
async function copySignalPhrase(phraseTemplate) {
  try {
    // Replace placeholders with actual values
    const author = currentQuote?.author || 'Unknown Author';
    const title = currentQuote?.sourceTitle || 'Article Title';
    const quote = currentQuote?.text || 'direct quote';

    const phraseText = phraseTemplate
      .replace('${author}', author)
      .replace('${title}', title)
      .replace('${quote}', quote);

    await navigator.clipboard.writeText(phraseText);
    showToast('Signal phrase copied!');

  } catch (error) {
    console.error('Error copying signal phrase:', error);
    showToast('Failed to copy signal phrase');
  }
}

// ============================================================================
// BACKGROUND COMMUNICATION: Message handler
// ============================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'refreshQuotes') {
    loadQuotes();
  }
});

// ============================================================================
// SETTINGS & USER PREFERENCES
// ============================================================================

// Default user preferences
const DEFAULT_PREFERENCES = {
  includeMLA: true,
  includeAPA: true,
  includeMetadata: true,
  sortOrder: 'newest', // 'newest' or 'oldest'
  notificationsEnabled: true,
  autoRefresh: true
};

// Load user preferences
async function loadPreferences() {
  try {
    const result = await chrome.storage.local.get(['userPreferences']);
    const preferences = result.userPreferences || DEFAULT_PREFERENCES;
    return preferences;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

// Save user preferences
async function savePreferences(preferences) {
  try {
    await chrome.storage.local.set({ userPreferences: preferences });
    console.log('Preferences saved:', preferences);
    return true;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return false;
  }
}

// Update specific preference
async function updatePreference(key, value) {
  try {
    const preferences = await loadPreferences();
    preferences[key] = value;
    await savePreferences(preferences);
    return true;
  } catch (error) {
    console.error('Error updating preference:', error);
    return false;
  }
}

// Reset preferences to default
async function resetPreferences() {
  try {
    await chrome.storage.local.set({ userPreferences: DEFAULT_PREFERENCES });
    console.log('Preferences reset to default');
    return true;
  } catch (error) {
    console.error('Error resetting preferences:', error);
    return false;
  }
}

// ============================================================================
// TAB SWITCHING: Handle tab navigation with active states
// ============================================================================
function switchTab(tabName) {
  const quotesTab = document.getElementById('quotesTab');
  const settingsTab = document.getElementById('settingsTab');
  const quotesTabContent = document.getElementById('quotesTabContent');
  const settingsTabContent = document.getElementById('settingsTabContent');

  // Remove active class from all tabs and content
  quotesTab.classList.remove('active');
  settingsTab.classList.remove('active');
  quotesTabContent.classList.remove('active');
  settingsTabContent.classList.remove('active');

  // Add active class to selected tab and content
  if (tabName === 'quotes') {
    quotesTab.classList.add('active');
    quotesTabContent.classList.add('active');
  } else if (tabName === 'settings') {
    settingsTab.classList.add('active');
    settingsTabContent.classList.add('active');
    // Load settings when opening settings tab
    loadSettingsUI();
  }
}

// ============================================================================
// MODAL TAB SWITCHING: Handle tab navigation in quote modal
// ============================================================================
function switchModalTab(tabName) {
  const modalInfoTab = document.getElementById('modalInfoTab');
  const modalCitationsTab = document.getElementById('modalCitationsTab');
  const modalInfoContent = document.getElementById('modalInfoContent');
  const modalCitationsContent = document.getElementById('modalCitationsContent');

  // Remove active class from all tabs and content
  modalInfoTab.classList.remove('active');
  modalCitationsTab.classList.remove('active');
  modalInfoContent.classList.remove('active');
  modalCitationsContent.classList.remove('active');

  // Add active class to selected tab and content
  if (tabName === 'info') {
    modalInfoTab.classList.add('active');
    modalInfoContent.classList.add('active');
  } else if (tabName === 'citations') {
    modalCitationsTab.classList.add('active');
    modalCitationsContent.classList.add('active');
  }
}

// ============================================================================
// SETTINGS UI MANAGEMENT
// ============================================================================

// Load settings from storage to UI
async function loadSettingsUI() {
  try {
    const preferences = await loadPreferences();

    // Update form fields
    document.getElementById('includeMLA').checked = preferences.includeMLA;
    document.getElementById('includeAPA').checked = preferences.includeAPA;
    document.getElementById('includeMetadata').checked = preferences.includeMetadata;
    document.getElementById('sortOrder').value = preferences.sortOrder;
    document.getElementById('autoRefresh').checked = preferences.autoRefresh;

    console.log('Settings UI loaded from storage');
  } catch (error) {
    console.error('Error loading settings UI:', error);
  }
}

// Save settings from UI to storage
async function saveSettings() {
  try {
    // Get values from UI
    const settings = {
      includeMLA: document.getElementById('includeMLA').checked,
      includeAPA: document.getElementById('includeAPA').checked,
      includeMetadata: document.getElementById('includeMetadata').checked,
      sortOrder: document.getElementById('sortOrder').value,
      autoRefresh: document.getElementById('autoRefresh').checked
    };

    // Save to storage
    await savePreferences(settings);

    // Also update exportPreferences for backward compatibility
    await chrome.storage.local.set({
      exportPreferences: {
        includeMLA: settings.includeMLA,
        includeAPA: settings.includeAPA,
        includeMetadata: settings.includeMetadata
      }
    });

    showToast('Settings saved successfully');

    console.log('Settings saved:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings');
  }
}

// Reset settings to default
async function resetSettings() {
  if (!confirm('Reset all settings to default values?')) {
    return;
  }

  try {
    await resetPreferences();

    // Reload UI with default values
    await loadSettingsUI();

    showToast('Settings reset to default');
    console.log('Settings reset to default');
  } catch (error) {
    console.error('Error resetting settings:', error);
    showToast('Error resetting settings');
  }
}
