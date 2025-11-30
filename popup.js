// Quote Saver & Citation Assistant - Popup Interface
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
// INITIALIZATION: Load quotes when popup opens
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
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

  // Copy citation buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const citationType = e.target.dataset.citation;
      copyCitation(citationType);
    });
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
        =A
      </button>
      <button class="action-btn delete-btn" title="Delete" data-quote-id="${quote.id}">
        =Ñ
      </button>
    </div>
  `;

  // Add click listeners for view and delete
  const viewBtn = item.querySelector('.view-btn');
  const deleteBtn = item.querySelector('.delete-btn');

  viewBtn.addEventListener('click', () => showQuoteDetails(quote));
  deleteBtn.addEventListener('click', () => deleteQuote(quote.id));

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
// EXPORT QUOTES: Download all quotes as JSON
// ============================================================================
async function exportQuotes() {
  try {
    const result = await chrome.storage.local.get(['quotes']);
    const quotes = result.quotes || [];

    if (quotes.length === 0) {
      showToast('No quotes to export');
      return;
    }

    // Prepare export data with metadata
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalQuotes: quotes.length,
      quotes: quotes
    };

    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Create and trigger download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-export-${new Date().toISOString().split('T')[0]}.json`;
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
    showToast(`${type.toUpperCase()} citation copied!`);

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

// Generate MLA citation format
function generateMlaCitation(quote) {
  const author = 'Unknown Author'; // We don't have author info
  const title = quote.sourceTitle;
  const url = quote.sourceUrl;
  const date = quote.accessDate;

  return `"${quote.text}" ${author}. ${title}. Accessed ${date}. ${url}.`;
}

// Generate APA citation format
function generateApaCitation(quote) {
  const author = 'Unknown Author';
  const date = `(${new Date(quote.timestamp).getFullYear()})`;
  const title = quote.sourceTitle;
  const url = quote.sourceUrl;

  return `${author} ${date}. ${title}. Retrieved ${quote.accessDate}, from ${url}`;
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
// BACKGROUND COMMUNICATION: Message handler
// ============================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'refreshQuotes') {
    loadQuotes();
  }
});
