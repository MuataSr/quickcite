// QuickCite - Popup Interface
// Handles quote display, management, and user interactions

console.log('[Popup] Script loaded');

// ============================================================================
// DOM ELEMENT REFERENCES (initialized in initDOM)
// ============================================================================
let quoteList, emptyState, quoteCount, refreshBtn, exportBtn, clearAllBtn;
let quoteModal, closeModal, closeModalBtn, deleteQuoteBtn, notificationToast;
let modalQuoteText, modalSourceTitle, modalSourceUrl, modalAccessDate;
let modalTimestamp, modalCreationDate, modalCreationDateContainer;
let modalMlaCitation, modalApaCitation;
let bibliographyPreviewModal, closeBibliographyPreview, closePreviewBtn;
let downloadBibliographyBtn, bibliographyPreviewText;

let currentQuote = null;
let bibliographyPreviewContent = '';

// Initialize DOM references
function initDOM() {
  console.log('[Popup] Initializing DOM references...');
  console.log('[Popup] document.readyState:', document.readyState);
  console.log('[Popup] document exists:', !!document);

  if (!document || !document.getElementById) {
    console.error('[Popup] ERROR: document or getElementById not available!');
    return;
  }

  try {
    // Main elements
    quoteList = document.getElementById('quoteList');
    emptyState = document.getElementById('emptyState');
    quoteCount = document.getElementById('quoteCount');
    refreshBtn = document.getElementById('refreshBtn');
    exportBtn = document.getElementById('exportBtn');
    clearAllBtn = document.getElementById('clearAllBtn');
    quoteModal = document.getElementById('quoteModal');
    closeModal = document.getElementById('closeModal');
    closeModalBtn = document.getElementById('closeModalBtn');
    deleteQuoteBtn = document.getElementById('deleteQuoteBtn');
    notificationToast = document.getElementById('notificationToast');

    // Modal elements
    modalQuoteText = document.getElementById('modalQuoteText');
    modalSourceTitle = document.getElementById('modalSourceTitle');
    modalSourceUrl = document.getElementById('modalSourceUrl');
    modalAccessDate = document.getElementById('modalAccessDate');
    modalTimestamp = document.getElementById('modalTimestamp');
    modalCreationDate = document.getElementById('modalCreationDate');
    modalCreationDateContainer = document.getElementById('modalCreationDateContainer');
    modalMlaCitation = document.getElementById('modalMlaCitation');
    modalApaCitation = document.getElementById('modalApaCitation');

    // Bibliography preview modal elements
    bibliographyPreviewModal = document.getElementById('bibliographyPreviewModal');
    closeBibliographyPreview = document.getElementById('closeBibliographyPreview');
    closePreviewBtn = document.getElementById('closePreviewBtn');
    downloadBibliographyBtn = document.getElementById('downloadBibliographyBtn');
    bibliographyPreviewText = document.getElementById('bibliographyPreviewText');

    console.log('[Popup] DOM references initialized successfully');
  } catch (error) {
    console.error('[Popup] ERROR initializing DOM:', error);
  }
}

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
(function() {
  if (document.readyState === 'loading') {
    // DOM is still loading, wait for it
    document.addEventListener('DOMContentLoaded', async () => {
      initDOM();
      await loadQuotes();
      setupEventListeners();
    });
  } else {
    // DOM is already ready, initialize immediately
    (async () => {
      initDOM();
      await loadQuotes();
      setupEventListeners();
    })();
  }
})();

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

  // Bibliography preview modal controls
  closeBibliographyPreview.addEventListener('click', closeBibliographyPreviewModal);
  closePreviewBtn.addEventListener('click', closeBibliographyPreviewModal);
  downloadBibliographyBtn.addEventListener('click', downloadBibliographyFromPreview);

  // Click outside bibliography preview modal to close
  bibliographyPreviewModal.addEventListener('click', (e) => {
    if (e.target === bibliographyPreviewModal) {
      closeBibliographyPreviewModal();
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

  // Copy in-text citation buttons
  document.querySelectorAll('.copy-btn-small').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const intextType = e.target.dataset.intext;
      copyInTextCitation(intextType);
    });
  });

  // Copy signal phrase buttons (using event delegation since buttons are in modal)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-phrase-btn')) {
      const phraseTemplate = e.target.dataset.phrase;
      copySignalPhrase(phraseTemplate);
    }
  });

  // Search input - real-time filtering with debounce
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  let searchTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const searchTerm = e.target.value.trim();

    // Show/hide clear button
    clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';

    // Debounce search (300ms delay)
    searchTimeout = setTimeout(() => {
      loadQuotes();
    }, 300);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    loadQuotes();
  });

  // Source filter dropdown
  const sourceFilter = document.getElementById('sourceFilter');
  sourceFilter.addEventListener('change', () => {
    loadQuotes();
  });

  // Tag filter dropdown
  const tagFilter = document.getElementById('tagFilter');
  tagFilter.addEventListener('change', () => {
    loadQuotes();
  });

  // Tag input and add button
  const tagInput = document.getElementById('tagInput');
  const addTagBtn = document.getElementById('addTagBtn');

  addTagBtn.addEventListener('click', () => {
    addTagToCurrentQuote();
  });

  tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTagToCurrentQuote();
    }
  });

  // Tag suggestions on input
  tagInput.addEventListener('input', (e) => {
    showTagSuggestions(e.target.value);
  });
}

// Current filter state
let currentFilters = {
  search: '',
  source: 'all',
  tag: 'all'
};

// ============================================================================
// LOAD QUOTES: Fetch from storage and display
// ============================================================================
async function loadQuotes() {
  try {
    const result = await chrome.storage.local.get(['quotes']);
    let quotes = result.quotes || [];

    console.log(`Loaded ${quotes.length} quotes from storage`);

    // Get current filter values
    const searchInput = document.getElementById('searchInput');
    const sourceFilter = document.getElementById('sourceFilter');
    const tagFilter = document.getElementById('tagFilter');

    currentFilters.search = searchInput?.value?.trim().toLowerCase() || '';
    currentFilters.source = sourceFilter?.value || 'all';
    currentFilters.tag = tagFilter?.value || 'all';

    // Apply filters
    quotes = filterQuotes(quotes, currentFilters);

    // Sort quotes by timestamp (newest first)
    quotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    renderQuotes(quotes);

    // Update count to show filtered vs total
    const totalResult = await chrome.storage.local.get(['quotes']);
    const totalQuotes = totalResult.quotes?.length || 0;
    updateQuoteCount(quotes.length, totalQuotes);

    // Update tag filter dropdown with available tags
    updateTagFilterOptions();

  } catch (error) {
    console.error('Error loading quotes:', error);
    showToast('Error loading quotes');
  }
}

// ============================================================================
// FILTER QUOTES: Apply search and filter criteria
// ============================================================================
function filterQuotes(quotes, filters) {
  return quotes.filter(quote => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const textMatch = quote.text?.toLowerCase().includes(searchLower);
      const titleMatch = quote.sourceTitle?.toLowerCase().includes(searchLower);
      const authorMatch = quote.author?.toLowerCase().includes(searchLower);
      const urlMatch = quote.sourceUrl?.toLowerCase().includes(searchLower);
      const tagMatch = quote.tags?.some(tag => tag.toLowerCase().includes(searchLower));

      if (!textMatch && !titleMatch && !authorMatch && !urlMatch && !tagMatch) {
        return false;
      }
    }

    // Source type filter
    if (filters.source !== 'all') {
      const quoteCategory = quote.sourceCategory || quote.contentType || 'general';
      if (quoteCategory !== filters.source) {
        // Special handling for video
        if (filters.source === 'video' && !quote.isVideo) {
          return false;
        } else if (filters.source !== 'video' && quoteCategory !== filters.source) {
          return false;
        }
      }
    }

    // Tag filter
    if (filters.tag !== 'all') {
      if (!quote.tags || !quote.tags.includes(filters.tag)) {
        return false;
      }
    }

    return true;
  });
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
      <button class="action-btn delete-btn" title="Delete" data-quote-id="${quote.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </svg>
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
async function showQuoteDetails(quote) {
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

  // Display creation date if available
  if (quote.creationDate) {
    modalCreationDate.textContent = quote.creationDate;
    modalCreationDateContainer.style.display = 'block';
  } else {
    modalCreationDateContainer.style.display = 'none';
  }

  // Display source verification data
  displaySourceVerification(quote);

  // Display tags
  displayQuoteTags(quote);

  // Detect and display source type
  const sourceType = detectSourceType(quote.sourceTitle, quote.sourceUrl);
  console.log('[Popup] Detected source type:', sourceType);

  // Generate citations (rule-based since AI is disabled)
  console.log('Generating citations...');
  const mlaCitation = await generateMlaCitation(quote, false);  // AI disabled
  const apaCitation = await generateApaCitation(quote, false);  // AI disabled
  const chicagoCitation = await generateChicagoCitation(quote, false);  // Chicago style

  modalMlaCitation.innerHTML = mlaCitation;
  modalApaCitation.innerHTML = apaCitation;
  document.getElementById('modalChicagoCitation').innerHTML = chicagoCitation;

  // Generate and display in-text citations
  const mlaInText = generateMlaInText(quote);
  const apaInText = generateApaInText(quote);
  const chicagoInText = generateChicagoInText(quote);

  document.getElementById('mlaInTextPreview').textContent = mlaInText;
  document.getElementById('apaInTextPreview').textContent = apaInText;
  document.getElementById('chicagoInTextPreview').textContent = chicagoInText;

  // Show modal
  quoteModal.style.display = 'flex';
}

// ============================================================================
// DISPLAY SOURCE VERIFICATION: Show reliability and metadata info
// ============================================================================
function displaySourceVerification(quote) {
  const section = document.getElementById('sourceVerificationSection');
  const badge = document.getElementById('verificationBadge');
  const indicator = document.getElementById('reliabilityIndicator');
  const label = document.getElementById('reliabilityLabel');
  const categorySpan = document.getElementById('sourceCategory');
  const contentTypeContainer = document.getElementById('contentTypeContainer');
  const contentTypeSpan = document.getElementById('contentType');
  const descContainer = document.getElementById('sourceDescriptionContainer');
  const descSpan = document.getElementById('sourceDescription');
  const warningsContainer = document.getElementById('sourceWarningsContainer');
  const warningsList = document.getElementById('sourceWarningsList');

  // Check if quote has verification data
  if (!quote.sourceReliability) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  // Set reliability badge styling
  const reliability = quote.sourceReliability;
  badge.className = `verification-badge ${reliability}`;
  indicator.className = `reliability-indicator ${reliability}`;

  // Set reliability label text
  const reliabilityLabels = {
    'high': 'High Reliability',
    'medium-high': 'Medium-High Reliability',
    'medium': 'Medium Reliability',
    'unverified': 'Unverified Source',
    'unknown': 'Unknown Reliability'
  };
  label.textContent = reliabilityLabels[reliability] || 'Unknown';

  // Set category
  const categoryLabels = {
    'academic': 'Academic/Research',
    'government': 'Government',
    'news': 'News Organization',
    'reference': 'Reference Site',
    'general': 'General Website',
    'unknown': 'Unknown'
  };
  categorySpan.textContent = categoryLabels[quote.sourceCategory] || quote.sourceCategory;

  // Set content type if available
  if (quote.contentType) {
    contentTypeContainer.style.display = 'block';
    const contentTypeLabels = {
      'article': 'Article',
      'academic': 'Academic Paper',
      'book': 'Book',
      'video': 'Video',
      'website': 'Website'
    };
    contentTypeSpan.textContent = contentTypeLabels[quote.contentType] || quote.contentType;
  } else {
    contentTypeContainer.style.display = 'none';
  }

  // Set description if available
  if (quote.sourceDescription) {
    descContainer.style.display = 'block';
    // Truncate long descriptions
    const desc = quote.sourceDescription;
    descSpan.textContent = desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
  } else {
    descContainer.style.display = 'none';
  }

  // Display warnings if any
  if (quote.sourceWarnings && quote.sourceWarnings.length > 0) {
    warningsContainer.style.display = 'block';
    warningsList.innerHTML = '';
    quote.sourceWarnings.forEach(warning => {
      const li = document.createElement('li');
      li.textContent = warning;
      warningsList.appendChild(li);
    });
  } else {
    warningsContainer.style.display = 'none';
  }

  console.log('[Popup] Source verification displayed:', {
    reliability: quote.sourceReliability,
    category: quote.sourceCategory,
    contentType: quote.contentType
  });
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
// GENERATE BIBLIOGRAPHY: Create preview of MLA Works Cited and APA References
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
    const exportPrefs = prefsResult.exportPreferences || { includeMLA: true, includeAPA: true, groupByType: true };

    // Build bibliography content
    bibliographyPreviewContent = `QUICKCITE - BIBLIOGRAPHY GENERATOR\n`;
    bibliographyPreviewContent += `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
    bibliographyPreviewContent += `Total Sources: ${quotes.length}\n`;
    bibliographyPreviewContent += `${'='.repeat(80)}\n\n`;

    // Group quotes by source category if enabled
    const groupedQuotes = groupQuotesByType(quotes);

    // Alphabetize quotes within each group by author last name
    const sortedQuotes = alphabetizeQuotes(quotes);

    // MLA Works Cited Section
    if (exportPrefs.includeMLA) {
      bibliographyPreviewContent += `                                    Works Cited\n\n`;

      if (exportPrefs.groupByType && Object.keys(groupedQuotes).length > 1) {
        // Group by source type
        const categoryOrder = ['academic', 'government', 'news', 'reference', 'general', 'unknown'];
        const categoryLabels = {
          'academic': 'Academic Sources',
          'government': 'Government Sources',
          'news': 'News Sources',
          'reference': 'Reference Works',
          'general': 'Web Sources',
          'unknown': 'Other Sources'
        };

        for (const category of categoryOrder) {
          if (groupedQuotes[category] && groupedQuotes[category].length > 0) {
            const sortedGroup = alphabetizeQuotes(groupedQuotes[category]);
            bibliographyPreviewContent += `--- ${categoryLabels[category]} ---\n\n`;

            for (const quote of sortedGroup) {
              const mlaCitation = await generateMlaCitation(quote, false);
              // Strip HTML tags for plain text output
              const plainCitation = stripHtmlTags(mlaCitation);
              bibliographyPreviewContent += `${plainCitation}\n\n`;
            }
          }
        }
      } else {
        // Simple alphabetical list
        for (const quote of sortedQuotes) {
          const mlaCitation = await generateMlaCitation(quote, false);
          const plainCitation = stripHtmlTags(mlaCitation);
          bibliographyPreviewContent += `${plainCitation}\n\n`;
        }
      }

      bibliographyPreviewContent += `${'='.repeat(80)}\n\n`;
    }

    // APA References Section
    if (exportPrefs.includeAPA) {
      bibliographyPreviewContent += `                                    References\n\n`;

      if (exportPrefs.groupByType && Object.keys(groupedQuotes).length > 1) {
        // Group by source type
        const categoryOrder = ['academic', 'government', 'news', 'reference', 'general', 'unknown'];
        const categoryLabels = {
          'academic': 'Academic Sources',
          'government': 'Government Sources',
          'news': 'News Sources',
          'reference': 'Reference Works',
          'general': 'Web Sources',
          'unknown': 'Other Sources'
        };

        for (const category of categoryOrder) {
          if (groupedQuotes[category] && groupedQuotes[category].length > 0) {
            const sortedGroup = alphabetizeQuotes(groupedQuotes[category]);
            bibliographyPreviewContent += `--- ${categoryLabels[category]} ---\n\n`;

            for (const quote of sortedGroup) {
              const apaCitation = await generateApaCitation(quote, false);
              const plainCitation = stripHtmlTags(apaCitation);
              bibliographyPreviewContent += `${plainCitation}\n\n`;
            }
          }
        }
      } else {
        // Simple alphabetical list
        for (const quote of sortedQuotes) {
          const apaCitation = await generateApaCitation(quote, false);
          const plainCitation = stripHtmlTags(apaCitation);
          bibliographyPreviewContent += `${plainCitation}\n\n`;
        }
      }
    }

    // Show preview modal instead of downloading immediately
    showBibliographyPreview();

  } catch (error) {
    console.error('Error generating bibliography preview:', error);
    showToast('Error generating bibliography preview');
  }
}

// ============================================================================
// GROUP QUOTES BY TYPE: Organize quotes by source category
// ============================================================================
function groupQuotesByType(quotes) {
  const groups = {
    academic: [],
    government: [],
    news: [],
    reference: [],
    general: [],
    unknown: []
  };

  for (const quote of quotes) {
    const category = quote.sourceCategory || detectSourceCategory(quote.sourceUrl);
    if (groups[category]) {
      groups[category].push(quote);
    } else {
      groups.general.push(quote);
    }
  }

  return groups;
}

// ============================================================================
// DETECT SOURCE CATEGORY: Fallback for quotes without category
// ============================================================================
function detectSourceCategory(url) {
  if (!url) return 'unknown';

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();

    // Academic
    if (domain.endsWith('.edu') || domain.includes('scholar.google') ||
        domain.includes('jstor') || domain.includes('arxiv') ||
        domain.includes('pubmed') || domain.includes('springer') ||
        domain.includes('wiley') || domain.includes('nature.com')) {
      return 'academic';
    }

    // Government
    if (domain.endsWith('.gov') || domain.endsWith('.mil') ||
        domain.includes('.gov.')) {
      return 'government';
    }

    // Major news
    if (domain.includes('nytimes') || domain.includes('washingtonpost') ||
        domain.includes('bbc.') || domain.includes('reuters') ||
        domain.includes('apnews') || domain.includes('theguardian') ||
        domain.includes('wsj.') || domain.includes('npr.org')) {
      return 'news';
    }

    // Reference
    if (domain.includes('wikipedia') || domain.includes('britannica') ||
        domain.includes('dictionary') || domain.includes('encyclopedia')) {
      return 'reference';
    }

    return 'general';
  } catch (e) {
    return 'unknown';
  }
}

// ============================================================================
// ALPHABETIZE QUOTES: Sort by author last name (MLA/APA standard)
// ============================================================================
function alphabetizeQuotes(quotes) {
  return [...quotes].sort((a, b) => {
    // Get author names, defaulting to title if no author
    const authorA = a.author || a.sourceTitle || '';
    const authorB = b.author || b.sourceTitle || '';

    // Extract last name for sorting
    // Handle formats: "Last, First", "First Last", "Organization Name"
    const lastNameA = getLastNameForSorting(authorA);
    const lastNameB = getLastNameForSorting(authorB);

    // Case-insensitive comparison
    return lastNameA.localeCompare(lastNameB, 'en', { sensitivity: 'base' });
  });
}

// ============================================================================
// GET LAST NAME FOR SORTING: Extract sortable last name from author string
// ============================================================================
function getLastNameForSorting(author) {
  if (!author) return '';

  // Handle "Last, First" format
  if (author.includes(',')) {
    return author.split(',')[0].trim().toLowerCase();
  }

  // Handle corporate authors (single words or organizations)
  // These sort as-is
  const words = author.trim().split(/\s+/);
  if (words.length === 1) {
    return author.toLowerCase();
  }

  // Handle "First Last" or "First Middle Last" format
  // Return the last word as the last name
  return words[words.length - 1].toLowerCase();
}

// ============================================================================
// STRIP HTML TAGS: Convert HTML citation to plain text
// ============================================================================
function stripHtmlTags(html) {
  // Replace <i> and <em> tags with nothing (italics don't transfer to plain text)
  // But add asterisks to indicate where italics would be
  let text = html.replace(/<(i|em)>/gi, '*').replace(/<\/(i|em)>/gi, '*');

  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&nbsp;/g, ' ');

  return text.trim();
}

// ============================================================================
// SHOW BIBLIOGRAPHY PREVIEW: Display modal with bibliography content
// ============================================================================
function showBibliographyPreview() {
  // Set the preview text
  bibliographyPreviewText.textContent = bibliographyPreviewContent;

  // Show the modal
  bibliographyPreviewModal.style.display = 'flex';
}

// ============================================================================
// CLOSE BIBLIOGRAPHY PREVIEW MODAL
// ============================================================================
function closeBibliographyPreviewModal() {
  bibliographyPreviewModal.style.display = 'none';
  bibliographyPreviewContent = '';
}

// ============================================================================
// DOWNLOAD BIBLIOGRAPHY FROM PREVIEW: Trigger file download
// ============================================================================
function downloadBibliographyFromPreview() {
  try {
    // Create and trigger download using the preview content
    const blob = new Blob([bibliographyPreviewContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickcite-bibliography-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Close the preview modal
    closeBibliographyPreviewModal();

    showToast('Bibliography downloaded successfully');

  } catch (error) {
    console.error('Error downloading bibliography:', error);
    showToast('Error downloading bibliography');
  }
}

// ============================================================================
// COPY CITATION: Copy MLA, APA, or Chicago citation to clipboard
// ============================================================================
async function copyCitation(type) {
  try {
    let citationText = '';
    if (type === 'mla') {
      citationText = modalMlaCitation.textContent;
    } else if (type === 'apa') {
      citationText = modalApaCitation.textContent;
    } else if (type === 'chicago') {
      citationText = document.getElementById('modalChicagoCitation').textContent;
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
// COPY IN-TEXT CITATION: Copy parenthetical citation to clipboard
// ============================================================================
async function copyInTextCitation(type) {
  try {
    let citationText = '';
    if (type === 'mla') {
      citationText = document.getElementById('mlaInTextPreview').textContent;
    } else if (type === 'apa') {
      citationText = document.getElementById('apaInTextPreview').textContent;
    } else if (type === 'chicago') {
      citationText = document.getElementById('chicagoInTextPreview').textContent;
    }

    await navigator.clipboard.writeText(citationText);
    showToast('In-text citation copied!');

    // Auto-hide after 2 seconds for copy feedback
    setTimeout(() => {
      notificationToast.classList.remove('show');
    }, 2000);

  } catch (error) {
    console.error('Error copying in-text citation:', error);
    showToast('Failed to copy');
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Update quote count display (with optional total for filtered view)
function updateQuoteCount(count, total = null) {
  if (total !== null && count !== total) {
    // Filtered view - show "X of Y quotes"
    quoteCount.textContent = `${count} of ${total} quotes`;
  } else {
    quoteCount.textContent = `${count} ${count === 1 ? 'quote' : 'quotes'}`;
  }

  // Update filter status
  const filterStatus = document.getElementById('filterStatus');
  if (filterStatus) {
    if (total !== null && count !== total) {
      filterStatus.textContent = `Showing ${count} of ${total}`;
      filterStatus.style.display = 'inline';
    } else {
      filterStatus.style.display = 'none';
    }
  }
}

// ============================================================================
// TAG MANAGEMENT FUNCTIONS
// ============================================================================

// Add tag to current quote
async function addTagToCurrentQuote() {
  if (!currentQuote) return;

  const tagInput = document.getElementById('tagInput');
  const tagText = tagInput.value.trim().toLowerCase();

  if (!tagText) {
    showToast('Enter a tag name');
    return;
  }

  // Max tag length
  if (tagText.length > 30) {
    showToast('Tag too long (max 30 chars)');
    return;
  }

  try {
    const result = await chrome.storage.local.get(['quotes']);
    const quotes = result.quotes || [];

    const quoteIndex = quotes.findIndex(q => q.id === currentQuote.id);
    if (quoteIndex === -1) {
      showToast('Quote not found');
      return;
    }

    // Initialize tags array if needed
    if (!quotes[quoteIndex].tags) {
      quotes[quoteIndex].tags = [];
    }

    // Check for duplicate tag
    if (quotes[quoteIndex].tags.includes(tagText)) {
      showToast('Tag already exists');
      return;
    }

    // Add tag
    quotes[quoteIndex].tags.push(tagText);

    // Save to storage
    await chrome.storage.local.set({ quotes: quotes });

    // Update current quote reference
    currentQuote.tags = quotes[quoteIndex].tags;

    // Clear input and refresh display
    tagInput.value = '';
    displayQuoteTags(currentQuote);
    hideTagSuggestions();

    showToast('Tag added');

  } catch (error) {
    console.error('Error adding tag:', error);
    showToast('Error adding tag');
  }
}

// Remove tag from current quote
async function removeTagFromQuote(tagToRemove) {
  if (!currentQuote) return;

  try {
    const result = await chrome.storage.local.get(['quotes']);
    const quotes = result.quotes || [];

    const quoteIndex = quotes.findIndex(q => q.id === currentQuote.id);
    if (quoteIndex === -1) return;

    // Remove tag
    quotes[quoteIndex].tags = quotes[quoteIndex].tags.filter(t => t !== tagToRemove);

    // Save to storage
    await chrome.storage.local.set({ quotes: quotes });

    // Update current quote reference
    currentQuote.tags = quotes[quoteIndex].tags;

    // Refresh display
    displayQuoteTags(currentQuote);

    showToast('Tag removed');

  } catch (error) {
    console.error('Error removing tag:', error);
  }
}

// Display tags in quote detail modal
function displayQuoteTags(quote) {
  const tagsContainer = document.getElementById('quoteTags');
  if (!tagsContainer) return;

  tagsContainer.innerHTML = '';

  if (!quote.tags || quote.tags.length === 0) {
    tagsContainer.innerHTML = '<span class="no-tags">No tags yet</span>';
    return;
  }

  quote.tags.forEach(tag => {
    const tagChip = document.createElement('span');
    tagChip.className = 'tag-chip';
    tagChip.innerHTML = `
      ${escapeHtml(tag)}
      <button class="tag-remove-btn" data-tag="${escapeHtml(tag)}" title="Remove tag">×</button>
    `;

    // Add click handler for remove button
    tagChip.querySelector('.tag-remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeTagFromQuote(tag);
    });

    tagsContainer.appendChild(tagChip);
  });
}

// Get all unique tags from all quotes
async function getAllTags() {
  try {
    const result = await chrome.storage.local.get(['quotes']);
    const quotes = result.quotes || [];

    const tagSet = new Set();
    quotes.forEach(quote => {
      if (quote.tags) {
        quote.tags.forEach(tag => tagSet.add(tag));
      }
    });

    return Array.from(tagSet).sort();
  } catch (error) {
    console.error('Error getting tags:', error);
    return [];
  }
}

// Update tag filter dropdown options
async function updateTagFilterOptions() {
  const tagFilter = document.getElementById('tagFilter');
  if (!tagFilter) return;

  const allTags = await getAllTags();

  // Preserve current selection
  const currentValue = tagFilter.value;

  // Clear and rebuild options
  tagFilter.innerHTML = '<option value="all">All Tags</option>';

  allTags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });

  // Restore selection if still valid
  if (allTags.includes(currentValue)) {
    tagFilter.value = currentValue;
  }
}

// Show tag suggestions based on input
async function showTagSuggestions(inputValue) {
  const suggestionsContainer = document.getElementById('tagSuggestions');
  if (!suggestionsContainer) return;

  if (!inputValue.trim()) {
    hideTagSuggestions();
    return;
  }

  const allTags = await getAllTags();
  const inputLower = inputValue.toLowerCase();

  // Filter tags that match input and aren't already on this quote
  const suggestions = allTags.filter(tag =>
    tag.includes(inputLower) &&
    (!currentQuote?.tags || !currentQuote.tags.includes(tag))
  );

  if (suggestions.length === 0) {
    hideTagSuggestions();
    return;
  }

  suggestionsContainer.innerHTML = '';
  suggestions.slice(0, 5).forEach(tag => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'tag-suggestion-item';
    suggestionItem.textContent = tag;
    suggestionItem.addEventListener('click', () => {
      document.getElementById('tagInput').value = tag;
      addTagToCurrentQuote();
    });
    suggestionsContainer.appendChild(suggestionItem);
  });

  suggestionsContainer.style.display = 'block';
}

// Hide tag suggestions
function hideTagSuggestions() {
  const suggestionsContainer = document.getElementById('tagSuggestions');
  if (suggestionsContainer) {
    suggestionsContainer.style.display = 'none';
  }
}

// ============================================================================
// PDF BIBLIOGRAPHY GENERATION
// ============================================================================

// Generate PDF bibliography
async function generatePDFBibliography(quotes, style = 'mla', sortBy = 'alphabetical') {
  try {
    // Sort quotes based on preference
    let sortedQuotes = [...quotes];
    if (sortBy === 'alphabetical') {
      sortedQuotes.sort((a, b) => {
        const authorA = a.author || 'Unknown';
        const authorB = b.author || 'Unknown';
        return authorA.localeCompare(authorB);
      });
    } else if (sortBy === 'date') {
      sortedQuotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set font
    doc.setFont('times', 'normal');

    // Title
    const title = style === 'mla' ? 'Works Cited' : (style === 'apa' ? 'References' : 'Bibliography');
    doc.setFontSize(16);
    doc.text(title, 105, 30, { align: 'center', baseline: 'middle' });

    // Date
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(dateStr, 105, 45, { align: 'center' });

    // Reset text color
    doc.setTextColor(0);

    let yPosition = 70;
    const lineHeight = 7;
    const marginLeft = 72; // 1 inch margin
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - marginLeft - 72; // Right margin

    // Process each quote
    for (let i = 0; i < sortedQuotes.length; i++) {
      const quote = sortedQuotes[i];

      // Generate citation based on style
      let citation = '';
      if (style === 'mla') {
        citation = generateMlaCitation(quote);
      } else if (style === 'apa') {
        citation = generateApaCitation(quote);
      } else if (style === 'chicago') {
        citation = generateChicagoCitation(quote);
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      // Add citation with hanging indent
      doc.setFontSize(12);

      // First line at normal position
      const lines = doc.splitTextToSize(citation, maxWidth);
      doc.text(lines[0], marginLeft, yPosition);

      // Remaining lines with hanging indent (0.5 inch)
      for (let j = 1; j < lines.length; j++) {
        doc.text(lines[j], marginLeft + 36, yPosition + (j * lineHeight));
      }

      // Move to next entry
      yPosition += lines.length * lineHeight + 5;
    }

    // Save PDF
    const filename = `quickcite-bibliography-${style}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    showToast(`PDF bibliography generated (${sortedQuotes.length} entries)`);

  } catch (error) {
    console.error('PDF generation error:', error);
    showToast('Failed to generate PDF');
  }
}

// Download bibliography as PDF from preview
async function downloadBibliographyFromPreview() {
  try {
    // Get all quotes
    const result = await chrome.storage.local.get(['quotes']);
    const quotes = result.quotes || [];

    if (quotes.length === 0) {
      showToast('No quotes to export');
      return;
    }

    // Get export preferences
    const prefsResult = await chrome.storage.local.get(['exportPreferences']);
    const exportPrefs = prefsResult.exportPreferences || { includeMLA: true, includeAPA: true };

    // Determine which style to use (default to MLA if both are enabled)
    let style = 'mla';
    if (exportPrefs.includeAPA && !exportPrefs.includeMLA) {
      style = 'apa';
    }

    // Close preview modal
    closeBibliographyPreviewModal();

    // Generate PDF
    await generatePDFBibliography(quotes, style, 'alphabetical');

  } catch (error) {
    console.error('Download error:', error);
    showToast('Failed to download PDF');
  }
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

// Helper function to parse source title and extract clean title + website name
function parseTitleAndWebsite(sourceTitle, sourceUrl, sourceName = null) {
  // Handle titles that include website info like "Title | Website Name | by Author"
  // or "Title - Website Name - by Author"

  let cleanTitle = sourceTitle;
  let websiteName = '';

  // If sourceName is provided (e.g., "arXiv" from API), use it directly
  if (sourceName) {
    websiteName = sourceName;
    return { cleanTitle, websiteName };
  }

  // Try to extract website name using common separators
  if (sourceTitle.includes('|')) {
    const parts = sourceTitle.split('|');
    cleanTitle = parts[0].trim();
    // Look for website in remaining parts
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part.toLowerCase().startsWith('by ') && part.length > 2) {
        websiteName = part;
        break;
      }
    }
  } else if (sourceTitle.includes(' - ')) {
    const parts = sourceTitle.split(' - ');
    cleanTitle = parts[0].trim();
    // Look for website in remaining parts
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part.toLowerCase().startsWith('by ') && part.length > 2) {
        websiteName = part;
        break;
      }
    }
  }

  // Clean up the website name - remove "by Author" if present
  if (websiteName) {
    websiteName = websiteName.replace(/\s*\|\s*by\s+.*$/i, '');
    websiteName = websiteName.replace(/\s*-\s*by\s+.*$/i, '');
    websiteName = websiteName.trim();
  }

  // Fallback: Extract website name from URL hostname if not found in title
  if (!websiteName && sourceUrl) {
    try {
      const urlObj = new URL(sourceUrl);
      let hostname = urlObj.hostname.replace(/^www\./, '');
      // Capitalize first letter of hostname for display
      websiteName = hostname.charAt(0).toUpperCase() + hostname.slice(1);
    } catch (e) {
      // Invalid URL, leave websiteName empty
    }
  }

  return { cleanTitle, websiteName };
}

// Format URL for MLA (remove https:// and http://)
function formatUrlForMla(url) {
  return url.replace(/^https?:\/\//, '');
}

// Format date for MLA (Day Month Year, e.g., "15 Mar. 2024")
function formatDateForMla(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Format date for APA (Year, Month Day)
function formatDateForApa(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${year}, ${month} ${day}`;
}

// Convert title to sentence case for APA (capitalize first word, proper nouns remain)
function toSentenceCase(title) {
  if (!title) return title;
  // Lowercase everything, then capitalize first character
  const lower = title.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// Rule-based source type detection
function detectSourceType(title, url) {
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();

  // Government documents (check first - high priority)
  if (isGovernmentSource(urlLower, titleLower)) {
    return 'government';
  }

  // Legal cases
  if (isLegalCase(urlLower, titleLower)) {
    return 'legal';
  }

  // Patents
  if (isPatent(urlLower, titleLower)) {
    return 'patent';
  }

  // Standards
  if (isStandard(urlLower, titleLower)) {
    return 'standard';
  }

  // Video platforms detection
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be') ||
      urlLower.includes('vimeo.com') || urlLower.includes('dailymotion.com') ||
      urlLower.includes('ted.com/talks') || urlLower.includes('twitch.tv')) {
    return 'video';
  }

  // Social media detection
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com') ||
      urlLower.includes('facebook.com') || urlLower.includes('instagram.com') ||
      urlLower.includes('linkedin.com') || urlLower.includes('tiktok.com')) {
    return 'social_media';
  }

  // Academic sources
  if (urlLower.includes('arxiv.org') || urlLower.includes('doi.org') ||
      urlLower.includes('.edu') || titleLower.includes('journal') ||
      titleLower.includes('research') || titleLower.includes('study')) {
    return 'academic';
  }

  // Books
  if (titleLower.includes('book') || titleLower.includes('chapter') ||
      titleLower.includes('edition') || urlLower.includes('books.google')) {
    return 'book';
  }

  // News
  if (titleLower.includes('news') || titleLower.includes('report') ||
      titleLower.includes('breaking') || urlLower.includes('news') ||
      urlLower.includes('.com/news')) {
    return 'news';
  }

  // Default: website
  return 'website';
}

// Helper functions for enhanced source detection
function isGovernmentSource(url, title) {
  // Government domains
  const govDomains = ['.gov', '.mil', '.gov.uk', '.gouv.fr', '.gov.au', '.gc.ca'];
  if (govDomains.some(domain => url.includes(domain))) {
    return true;
  }

  // Government agency keywords
  const agencies = [
    'epa', 'fda', 'cdc', 'fbi', 'nasa', 'usda', 'dol', 'doj', 'dos', 'dot',
    'treasury', 'commerce', 'defense', 'energy', 'education', 'homeland',
    'housing', 'interior', 'labor', 'state', 'transportation', 'veterans',
    'irs', 'cia', 'congress.gov', 'senate.gov', 'house.gov',
    'who.int', 'worldbank.org', 'un.org', 'oecd.org', 'imf.org'
  ];

  if (agencies.some(agency => title.includes(agency) || url.includes(agency))) {
    return true;
  }

  // Government document keywords
  const govKeywords = ['report', 'regulation', 'policy', 'executive order', 'guideline',
                       'statute', 'code', 'federal register', 'congress', 'bill', 'act'];
  if (govKeywords.some(keyword => title.includes(keyword))) {
    return true;
  }

  return false;
}

function isLegalCase(url, title) {
  // Legal domains
  const legalDomains = ['courtlistener.com', 'justia.com', 'law.cornell.edu',
                        'supremecourt.gov', 'uscourts.gov', 'findlaw.com'];
  if (legalDomains.some(domain => url.includes(domain))) {
    return true;
  }

  // Case name patterns (v. vs. versus)
  if (/\b(v\.?|vs\.?|versus)\b/i.test(title)) {
    return true;
  }

  // Legal citation patterns
  const legalPatterns = [
    /\b\d+\s+U\.S\.\s+\d+\b/,  // 123 U.S. 456
    /\b\d+\s+F\.\d+d\s+\d+\b/, // 123 F.3d 456
    /\b\d+\s+S\.Ct\.\s+\d+\b/, // 123 S.Ct. 456
    /\b\d+\s+U\.S\.C\.\s+§\s*\d+\b/ // 123 U.S.C. § 456
  ];

  if (legalPatterns.some(pattern => pattern.test(title))) {
    return true;
  }

  // Legal keywords
  const legalKeywords = ['plaintiff', 'defendant', 'opinion', 'ruling', 'judge',
                         'court', 'tribunal', 'appeal', 'litigation'];
  if (legalKeywords.some(keyword => title.includes(keyword))) {
    return true;
  }

  return false;
}

function isPatent(url, title) {
  // Patent domains
  if (url.includes('patents.google.com') || url.includes('uspto.gov') ||
      url.includes('patft.uspto.gov') || url.includes('worldwide.espacenet.com')) {
    return true;
  }

  // Patent number patterns
  const patentPatterns = [
    /\b(US|EP|WO|GB|FR|DE|CN|JP)\s*\d{1,2}[,\s]*\d{3}[,\s]*\d{3}\b/i,
    /\bUS\s*\d{7,8}\b/i,  // US 12345678
    /\bPatent\s*(No\.?|Number)\s*[:\s]*\w*/i
  ];

  if (patentPatterns.some(pattern => pattern.test(title))) {
    return true;
  }

  // Patent keywords
  if (title.includes('patent') || title.includes('inventor') ||
      title.includes('issued') || title.includes('filed')) {
    return true;
  }

  return false;
}

function isStandard(url, title) {
  // Standards domains
  if (url.includes('standards.ieee.org') || url.includes('ansi.org') ||
      url.includes('astm.org') || url.includes('iso.org') ||
      url.includes('nist.gov') || url.includes('iec.ch')) {
    return true;
  }

  // Standard number patterns
  const standardPatterns = [
    /\b(IEEE|ISO|ANSI|ASTM|IEC|NIST|IETF|W3C)\s+\w+[\d\.]*\b/i,
    /\bStandard\s+\w+/i,
    /\bSpec(ification)?\s+\w+/i
  ];

  if (standardPatterns.some(pattern => pattern.test(title))) {
    return true;
  }

  // Standards keywords
  if (title.includes('standard') || title.includes('specification') ||
      title.includes('guideline') || title.includes('code')) {
    return true;
  }

  return false;
}

// Rule-based corporate author detection
function isCorporateAuthor(author) {
  if (!author) return false;

  const authorLower = author.toLowerCase();
  const corporateIndicators = [
    'inc', 'inc.', 'llc', 'l.l.c.', 'corp', 'corp.', 'corporation',
    'ltd', 'ltd.', 'limited', 'company', 'co.', 'co', 'university',
    'college', 'institute', 'organization', 'org', 'foundation',
    'agency', 'administration', 'bureau', 'department', 'ministry',
    'committee', 'association', 'society', 'center', 'centre',
    'epa', 'fda', 'cdc', 'nasa', 'fbi', 'who', 'un', 'world bank'
  ];

  return corporateIndicators.some(indicator => authorLower.includes(indicator));
}

// Parse authors from author string (global function for MLA/APA)
function parseAuthors(authorString) {
  if (!authorString || authorString === 'Unknown Author') {
    return { authors: [], isCorporate: true, count: 0 };
  }

  // Check if corporate author
  const isCorp = isCorporateAuthor(authorString);
  if (isCorp) {
    return { authors: [authorString], isCorporate: true, count: 1 };
  }

  // Split authors by "and", "&", or ","
  let authorParts = [];
  if (authorString.includes(' and ')) {
    authorParts = authorString.split(' and ');
  } else if (authorString.includes(' & ')) {
    authorParts = authorString.split(' & ');
  } else {
    // Split by comma, but preserve full names
    authorParts = authorString.split(',').map(part => part.trim()).filter(part => part);
  }

  // If only one part but contains multiple names, try to split differently
  if (authorParts.length === 1 && authorParts[0].includes(' ')) {
    // Check if it's actually multiple authors separated by semicolons
    if (authorString.includes(';')) {
      authorParts = authorString.split(';').map(part => part.trim());
    }
  }

  const count = authorParts.length;

  return {
    authors: authorParts,
    isCorporate: false,
    count: count
  };
}

// Generate MLA citation format with hanging indent
async function generateMlaCitation(quote, useAI = false) {
  // Use extracted author or fallback to "Unknown Author"
  const authorFull = quote.author || 'Unknown Author';
  const url = formatUrlForMla(quote.sourceUrl);

  // MLA requires BOTH dates:
  // - Publication date (creationDate if available, otherwise no publication date)
  // - Access date (always include for online sources)
  const publicationDate = quote.creationDate ? formatDateForMla(quote.creationDate) : null;
  const accessDate = formatDateForMla(quote.timestamp);

  // Parse title to extract clean title and website name
  const { cleanTitle, websiteName } = parseTitleAndWebsite(quote.sourceTitle, quote.sourceUrl, quote.sourceName);

  // Rule-based source type detection
  const sourceType = detectSourceType(quote.sourceTitle, quote.sourceUrl);

  // Parse author name based on rule-based detection
  const authorInfo = parseAuthors(authorFull);
  const authorFormatted = formatMlaAuthors(authorInfo);

  function formatMlaAuthors(authorInfo) {
    if (authorInfo.count === 0) {
      return 'Unknown Author';
    }

    // Single author
    if (authorInfo.count === 1) {
      const author = authorInfo.authors[0];
      const parts = author.split(' ');
      if (parts.length >= 2) {
        const lastName = parts.pop();
        const firstNames = parts.join(' ');
        return `${lastName}, ${firstNames}`;
      }
      return author;
    }

    // Two authors
    if (authorInfo.count === 2) {
      const author1 = authorInfo.authors[0];
      const author2 = authorInfo.authors[1];

      // Format first author
      let formatted1 = author1;
      const parts1 = author1.split(' ');
      if (parts1.length >= 2) {
        const lastName1 = parts1.pop();
        const firstNames1 = parts1.join(' ');
        formatted1 = `${lastName1}, ${firstNames1}`;
      }

      // Format second author (normal order for second author)
      let formatted2 = author2;
      const parts2 = author2.split(' ');
      if (parts2.length >= 2) {
        const lastName2 = parts2.pop();
        const firstNames2 = parts2.join(' ');
        formatted2 = `${firstNames2} ${lastName2}`;
      }

      return `${formatted1}, and ${formatted2}`;
    }

    // Three or more authors
    if (authorInfo.count >= 3) {
      // First author + et al.
      const firstAuthor = authorInfo.authors[0];
      const parts = firstAuthor.split(' ');
      if (parts.length >= 2) {
        const lastName = parts.pop();
        const firstNames = parts.join(' ');
        return `${lastName}, ${firstNames}, et al.`;
      }
      return `${firstAuthor}, et al.`;
    }
  }

  // MLA 9th edition format (enhanced with rule-based detection)
  // MLA Rules:
  // - Article/page titles: in "quotation marks"
  // - Container titles (websites, newspapers, journals, books): in italics
  // - URLs: omit https://, citation ends with period
  let citation = '';

  // Format based on source type (enhanced with government, legal, patent, standard)
  if (sourceType === 'government') {
    // Government: Government Agency. "Title." Agency, Date, URL.
    citation = `${authorFormatted}. "${cleanTitle}."`;
    if (websiteName) {
      citation += ` <em>${websiteName}</em>,`;
    }
    if (publicationDate) {
      citation += ` ${publicationDate},`;
    }
    citation += ` ${url}.`;
  } else if (sourceType === 'legal') {
    // Legal Case: Plaintiff v. Defendant. Court, Volume. Reporter Page (Year). URL.
    citation = `${authorFormatted}. "${cleanTitle}."`;
    if (websiteName) {
      citation += ` <em>${websiteName}</em>,`;
    }
    if (publicationDate) {
      citation += ` ${publicationDate},`;
    }
    citation += ` ${url}.`;
  } else if (sourceType === 'patent') {
    // Patent: Inventor. "Patent Title." Patent No. XXX, Date. URL.
    citation = `${authorFormatted}. "${cleanTitle}."`;
    if (publicationDate) {
      citation += ` ${publicationDate},`;
    }
    citation += ` ${url}.`;
  } else if (sourceType === 'standard') {
    // Standard: Organization. Standard Title. Standard No., Date, URL.
    citation = `${authorFormatted}. <em>${cleanTitle}</em>.`;
    if (publicationDate) {
      citation += ` ${publicationDate},`;
    }
    citation += ` ${url}.`;
  } else if (sourceType === 'video' || quote.isVideo) {
    // Video: Creator/Channel. "Video Title." Platform, uploaded by Uploader, Date, URL.
    // MLA format for online video
    const platform = quote.videoPlatform || websiteName || 'Online Video';
    const uploadDate = quote.videoUploadDate ? formatDateForMla(quote.videoUploadDate) : publicationDate;

    citation = `${authorFormatted}. "${cleanTitle}."`;
    citation += ` <em>${platform}</em>,`;
    if (uploadDate) {
      citation += ` ${uploadDate},`;
    }
    citation += ` ${url}.`;
  } else if (sourceType === 'social_media') {
    // Social Media: @handle. "Post text..." Platform, Date, URL.
    citation = `${authorFormatted}. "${cleanTitle}."`;
    if (websiteName) {
      citation += ` <em>${websiteName}</em>,`;
    }
    if (publicationDate) {
      citation += ` ${publicationDate},`;
    }
    citation += ` ${url}.`;
  } else if (sourceType === 'book') {
    // Book: Author. Title of Book. Publisher, Year, URL.
    // Book titles are italicized, not in quotes
    citation = `${authorFormatted}. <em>${cleanTitle}</em>.`;
    if (websiteName) {
      citation += ` ${websiteName},`; // Publisher not italicized
    }
    if (publicationDate) {
      citation += ` ${publicationDate},`;
    }
    citation += ` ${url}.`;
  } else if (sourceType === 'academic' || sourceType === 'arxiv') {
    // Academic/Journal: Author. "Article Title." Journal Name, vol. X, no. Y, Date, pp. X-Y. DOI/URL.
    // Article in quotes, journal name italicized
    citation = `${authorFormatted}. "${cleanTitle}."`;
    if (websiteName) {
      citation += ` <em>${websiteName}</em>,`;
    }
    // Add volume and issue
    if (quote.volume) {
      citation += ` vol. ${quote.volume},`;
    }
    if (quote.issue) {
      citation += ` no. ${quote.issue},`;
    }
    // Add pages
    if (quote.pages) {
      citation += ` pp. ${quote.pages},`;
    }
    if (publicationDate) {
      citation += ` ${publicationDate},`;
    }
    // Add DOI if available, otherwise URL
    if (quote.doi) {
      citation += ` https://doi.org/${quote.doi}.`;
    } else {
      citation += ` ${url}.`;
    }
  } else if (sourceType === 'news') {
    // Newspaper: Author. "Article Title." Newspaper Name, Date, URL.
    // Article in quotes, newspaper name italicized
    citation = `${authorFormatted}. "${cleanTitle}."`;
    if (websiteName) {
      citation += ` <em>${websiteName}</em>,`;
    }
    if (publicationDate) {
      citation += ` ${publicationDate},`;
    }
    citation += ` ${url}.`;
  } else {
    // Website (default): Author. "Page Title." Website Name, Date, URL.
    // Page title in quotes, website name italicized
    citation = `${authorFormatted}. "${cleanTitle}."`;
    if (websiteName) {
      citation += ` <em>${websiteName}</em>,`;
    }
    if (publicationDate) {
      citation += ` ${publicationDate},`;
    }
    citation += ` ${url}.`;
  }

  // MLA requires "Accessed" date for ALL online sources
  citation += ` Accessed ${accessDate}.`;

  return citation;
}

// Generate APA citation format with hanging indent
async function generateApaCitation(quote, useAI = false) {
  // Use extracted author or fallback to "Unknown Author"
  const authorFull = quote.author || 'Unknown Author';

  // Smart date selection: Use creation date for year (crucial for APA!)
  let timestamp, year;
  if (quote.creationDate) {
    timestamp = new Date(quote.creationDate);
    year = timestamp.getUTCFullYear();
  } else {
    timestamp = new Date(quote.timestamp);
    year = timestamp.getUTCFullYear();
  }

  const url = quote.sourceUrl; // APA keeps https://

  // Parse title to extract clean title and website name
  const { cleanTitle, websiteName } = parseTitleAndWebsite(quote.sourceTitle, quote.sourceUrl, quote.sourceName);

  // Rule-based source type detection
  const sourceType = detectSourceType(quote.sourceTitle, quote.sourceUrl);

  // Convert title to sentence case for APA
  const titleSentenceCase = toSentenceCase(cleanTitle);

  // Parse author name based on rule-based detection
  const authorInfo = parseAuthors(authorFull);
  const authorFormatted = formatApaAuthors(authorInfo);

  function formatApaAuthors(authorInfo) {
    if (authorInfo.count === 0) {
      return 'Unknown Author';
    }

    // Single author
    if (authorInfo.count === 1) {
      const author = authorInfo.authors[0];
      const parts = author.split(' ');
      if (parts.length >= 2) {
        const lastName = parts.pop();
        const firstInitial = parts[0].charAt(0) + '.';
        return `${lastName}, ${firstInitial}`;
      }
      return author;
    }

    // Two authors
    if (authorInfo.count === 2) {
      const author1 = authorInfo.authors[0];
      const author2 = authorInfo.authors[1];

      // Format first author
      let formatted1 = author1;
      const parts1 = author1.split(' ');
      if (parts1.length >= 2) {
        const lastName1 = parts1.pop();
        const firstInitial1 = parts1[0].charAt(0) + '.';
        formatted1 = `${lastName1}, ${firstInitial1}`;
      }

      // Format second author
      let formatted2 = author2;
      const parts2 = author2.split(' ');
      if (parts2.length >= 2) {
        const lastName2 = parts2.pop();
        const firstInitial2 = parts2[0].charAt(0) + '.';
        formatted2 = `${firstInitial2} ${lastName2}`;
      }

      return `${formatted1}, & ${formatted2}`;
    }

    // Three or more authors
    if (authorInfo.count >= 3) {
      // First author + et al.
      const firstAuthor = authorInfo.authors[0];
      const parts = firstAuthor.split(' ');
      if (parts.length >= 2) {
        const lastName = parts.pop();
        const firstInitial = parts[0].charAt(0) + '.';
        return `${lastName}, ${firstInitial}, et al.`;
      }
      return `${firstAuthor}, et al.`;
    }
  }

  // APA 7th edition format (enhanced with rule-based detection)
  // APA Rules:
  // - Book/report titles: italicized, sentence case
  // - Article titles: NOT italicized, sentence case, no quotes
  // - Journal/newspaper names: italicized, title case
  // - Website names: NOT italicized
  // - URLs: include https://, NO trailing period after URL
  let citation = '';

  if (sourceType === 'government') {
    // Government: Agency. (Year). Title. Agency. URL
    citation = `${authorFormatted} (${year}). <em>${titleSentenceCase}</em>.`;
    if (websiteName) {
      citation += ` ${websiteName}.`;
    }
    citation += ` ${url}`;
  } else if (sourceType === 'legal') {
    // Legal: Plaintiff v. Defendant. (Year). Court. URL
    citation = `${authorFormatted} (${year}). <em>${titleSentenceCase}</em>.`;
    if (websiteName) {
      citation += ` ${websiteName}.`;
    }
    citation += ` ${url}`;
  } else if (sourceType === 'patent') {
    // Patent: Inventor. (Year). Title (Patent No. XXX). URL
    citation = `${authorFormatted} (${year}). <em>${titleSentenceCase}</em>.`;
    citation += ` ${url}`;
  } else if (sourceType === 'standard') {
    // Standard: Organization. (Year). Standard title. URL
    citation = `${authorFormatted} (${year}). <em>${titleSentenceCase}</em>.`;
    citation += ` ${url}`;
  } else if (sourceType === 'video' || quote.isVideo) {
    // Video: Channel. (Year, Month Day). Title [Video]. Platform. URL
    // APA 7th format for online videos
    const platform = quote.videoPlatform || websiteName || 'Online Video';
    let videoDate = year;
    if (quote.videoUploadDate) {
      videoDate = formatDateForApa(quote.videoUploadDate);
    }

    citation = `${authorFormatted} (${videoDate}). <em>${titleSentenceCase}</em> [Video]. ${platform}. ${url}`;
  } else if (sourceType === 'social_media') {
    // Social Media: Author [@handle]. (Year, Month Day). Post text [Type of post]. Platform. URL
    const fullDate = formatDateForApa(quote.timestamp);
    citation = `${authorFormatted} (${fullDate}). <em>${titleSentenceCase}</em> [Post].`;
    if (websiteName) {
      citation += ` ${websiteName}.`;
    }
    citation += ` ${url}`;
  } else if (sourceType === 'book') {
    // Book: Author. (Year). Book title in sentence case. Publisher.
    // Book title italicized
    citation = `${authorFormatted} (${year}). <em>${titleSentenceCase}</em>.`;
    if (websiteName) {
      citation += ` ${websiteName}.`; // Publisher not italicized
    }
  } else if (sourceType === 'academic' || sourceType === 'arxiv') {
    // Journal: Author. (Year). Article title. Journal Name, vol(issue), pages. DOI/URL
    // Article NOT italicized, journal name italicized
    citation = `${authorFormatted} (${year}). ${titleSentenceCase}.`;
    if (websiteName) {
      citation += ` <em>${websiteName}</em>`;
      // Add volume and issue
      if (quote.volume || quote.issue) {
        let volIssue = '';
        if (quote.volume && quote.issue) {
          volIssue = `, ${quote.volume}(${quote.issue})`;
        } else if (quote.volume) {
          volIssue = `, ${quote.volume}`;
        } else if (quote.issue) {
          volIssue = `, ${quote.issue}`;
        }
        citation += volIssue;
      }
      // Add pages
      if (quote.pages) {
        citation += `, ${quote.pages}`;
      }
      citation += '.';
    }
    // Add DOI if available, otherwise URL
    if (quote.doi) {
      citation += ` https://doi.org/${quote.doi}`;
    } else {
      citation += ` ${url}`;
    }
  } else if (sourceType === 'news') {
    // Newspaper: Author. (Year, Month Day). Article title. Newspaper Name. URL
    // Article NOT italicized, newspaper name italicized
    const fullDate = formatDateForApa(quote.timestamp);
    citation = `${authorFormatted} (${fullDate}). ${titleSentenceCase}.`;
    if (websiteName) {
      citation += ` <em>${websiteName}</em>.`;
    }
    citation += ` ${url}`;
  } else {
    // Website: Author. (Year, Month Day). Page title. Site Name. URL
    // Page title italicized for standalone pages, site name NOT italicized
    citation = `${authorFormatted} (${year}). <em>${titleSentenceCase}</em>.`;
    if (websiteName) {
      citation += ` ${websiteName}.`;
    }
    citation += ` ${url}`;
  }

  return citation;
}

// Generate Chicago citation format (Notes-Bibliography style)
async function generateChicagoCitation(quote, useAI = false) {
  // Use extracted author or fallback to "Unknown Author"
  const authorFull = quote.author || 'Unknown Author';

  // Smart date selection: Use creation date if available
  let dateStr = '';
  if (quote.creationDate) {
    dateStr = formatDateForChicago(quote.creationDate);
  } else {
    // Use "Accessed [date]" format when no publication date
    dateStr = `Accessed ${formatDateForChicago(quote.timestamp)}`;
  }

  const url = quote.sourceUrl; // Chicago keeps full URL

  // Parse title to extract clean title and website name
  const { cleanTitle, websiteName } = parseTitleAndWebsite(quote.sourceTitle, quote.sourceUrl, quote.sourceName);

  // Rule-based source type detection
  const sourceType = detectSourceType(quote.sourceTitle, quote.sourceUrl);

  // Parse author name based on rule-based detection
  const authorInfo = parseAuthors(authorFull);
  const authorFormatted = formatChicagoAuthors(authorInfo);

  function formatChicagoAuthors(authorInfo) {
    if (authorInfo.count === 0) {
      return null; // Chicago omits author and starts with title
    }

    // Corporate author - use as-is
    if (authorInfo.isCorporate) {
      return authorInfo.authors[0];
    }

    // Single author: Lastname, Firstname
    if (authorInfo.count === 1) {
      const author = authorInfo.authors[0];
      const parts = author.split(' ');
      if (parts.length >= 2) {
        const lastName = parts.pop();
        const firstNames = parts.join(' ');
        return `${lastName}, ${firstNames}`;
      }
      return author;
    }

    // Two authors: Lastname, Firstname, and Firstname Lastname
    if (authorInfo.count === 2) {
      const author1 = authorInfo.authors[0];
      const author2 = authorInfo.authors[1];

      // Format first author (inverted)
      let formatted1 = author1;
      const parts1 = author1.split(' ');
      if (parts1.length >= 2) {
        const lastName1 = parts1.pop();
        const firstNames1 = parts1.join(' ');
        formatted1 = `${lastName1}, ${firstNames1}`;
      }

      // Format second author (normal order)
      let formatted2 = author2;

      return `${formatted1}, and ${formatted2}`;
    }

    // 3+ authors: Lastname, Firstname, et al.
    const firstAuthor = authorInfo.authors[0];
    const parts = firstAuthor.split(' ');
    if (parts.length >= 2) {
      const lastName = parts.pop();
      const firstNames = parts.join(' ');
      return `${lastName}, ${firstNames}, et al.`;
    }
    return `${firstAuthor}, et al.`;
  }

  // Build citation based on source type
  let citation = '';

  if (sourceType === 'video' || quote.isVideo) {
    // Video: Author/Channel. "Video Title." Platform. Date. URL.
    // Chicago Notes-Bibliography format for online videos
    const platform = quote.videoPlatform || websiteName || 'Online Video';
    let videoDate = dateStr;
    if (quote.videoUploadDate) {
      videoDate = formatDateForChicago(quote.videoUploadDate);
    }

    if (authorFormatted) {
      citation = `${authorFormatted}. `;
    }
    citation += `"${cleanTitle}." ${platform}. ${videoDate}. ${url}.`;
  } else if (sourceType === 'academic' || quote.doi) {
    // Academic source: Author. "Title." Journal Name vol, no (Year): pages. DOI/URL.
    if (authorFormatted) {
      citation = `${authorFormatted}. `;
    }
    citation += `"${cleanTitle}."`;

    if (websiteName) {
      citation += ` ${websiteName}`;
    }

    // Add volume/issue if available
    if (quote.volume || quote.issue) {
      if (quote.volume) {
        citation += ` ${quote.volume}`;
      }
      if (quote.issue) {
        citation += `, no. ${quote.issue}`;
      }
    }

    // Add year in parentheses for journals
    if (quote.creationDate) {
      const year = new Date(quote.creationDate).getFullYear();
      citation += ` (${year})`;
    }

    // Add pages
    if (quote.pages) {
      citation += `: ${quote.pages}`;
    }

    citation += '.';

    // DOI or URL
    if (quote.doi) {
      citation += ` https://doi.org/${quote.doi}.`;
    } else {
      citation += ` ${url}.`;
    }
  } else if (sourceType === 'government') {
    // Government source
    if (authorFormatted) {
      citation = `${authorFormatted}. `;
    }
    citation += `"${cleanTitle}."`;
    if (websiteName) {
      citation += ` ${websiteName}.`;
    }
    citation += ` ${dateStr}. ${url}.`;
  } else {
    // Website (default): Author. "Page Title." Website Name. Date. URL.
    // Chicago: Page title in quotes, website name in roman (not italicized)
    if (authorFormatted) {
      citation = `${authorFormatted}. `;
    }
    citation += `"${cleanTitle}."`;
    if (websiteName) {
      citation += ` ${websiteName}.`;
    }
    citation += ` ${dateStr}. ${url}.`;
  }

  return citation;
}

// Format date for Chicago style (Month Day, Year)
function formatDateForChicago(dateInput) {
  try {
    const date = new Date(dateInput);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateInput; // Return as-is if parsing fails
  }
}

// ============================================================================
// IN-TEXT CITATION GENERATORS
// ============================================================================

// Generate MLA in-text citation: (Author Page) or (Author)
function generateMlaInText(quote) {
  const authorInfo = parseAuthors(quote.author || 'Unknown Author');

  // Get author for in-text
  let authorText = '';
  if (authorInfo.count === 0 || (authorInfo.count === 1 && authorInfo.authors[0] === 'Unknown Author')) {
    // No author - use shortened title in quotes
    const shortTitle = shortenTitle(quote.sourceTitle);
    authorText = `"${shortTitle}"`;
  } else if (authorInfo.count === 1) {
    // Single author - last name only
    const parts = authorInfo.authors[0].split(' ');
    authorText = parts[parts.length - 1];
  } else if (authorInfo.count === 2) {
    // Two authors: Smith and Jones
    const lastName1 = authorInfo.authors[0].split(' ').pop();
    const lastName2 = authorInfo.authors[1].split(' ').pop();
    authorText = `${lastName1} and ${lastName2}`;
  } else {
    // 3+ authors: Smith et al.
    const lastName = authorInfo.authors[0].split(' ').pop();
    authorText = `${lastName} et al.`;
  }

  // MLA doesn't use page numbers for web sources (no "p.")
  return `(${authorText})`;
}

// Generate APA in-text citation: (Author, Year) or (Author, Year, p. X)
function generateApaInText(quote) {
  const authorInfo = parseAuthors(quote.author || 'Unknown Author');

  // Get year
  let year;
  if (quote.creationDate) {
    year = new Date(quote.creationDate).getFullYear();
  } else {
    year = new Date(quote.timestamp).getFullYear();
  }

  // Get author for in-text
  let authorText = '';
  if (authorInfo.count === 0 || (authorInfo.count === 1 && authorInfo.authors[0] === 'Unknown Author')) {
    // No author - use shortened title in quotes
    const shortTitle = shortenTitle(quote.sourceTitle);
    authorText = `"${shortTitle}"`;
  } else if (authorInfo.count === 1) {
    // Single author - last name only
    const parts = authorInfo.authors[0].split(' ');
    authorText = parts[parts.length - 1];
  } else if (authorInfo.count === 2) {
    // Two authors: Smith & Jones
    const lastName1 = authorInfo.authors[0].split(' ').pop();
    const lastName2 = authorInfo.authors[1].split(' ').pop();
    authorText = `${lastName1} & ${lastName2}`;
  } else {
    // 3+ authors: Smith et al.
    const lastName = authorInfo.authors[0].split(' ').pop();
    authorText = `${lastName} et al.`;
  }

  return `(${authorText}, ${year})`;
}

// Generate Chicago in-text citation: (Author Year) or footnote superscript
function generateChicagoInText(quote) {
  const authorInfo = parseAuthors(quote.author || 'Unknown Author');

  // Get year
  let year;
  if (quote.creationDate) {
    year = new Date(quote.creationDate).getFullYear();
  } else {
    year = new Date(quote.timestamp).getFullYear();
  }

  // Get author for in-text
  let authorText = '';
  if (authorInfo.count === 0 || (authorInfo.count === 1 && authorInfo.authors[0] === 'Unknown Author')) {
    // No author - use shortened title in quotes
    const shortTitle = shortenTitle(quote.sourceTitle);
    authorText = `"${shortTitle}"`;
  } else if (authorInfo.count === 1) {
    // Single author - last name only
    const parts = authorInfo.authors[0].split(' ');
    authorText = parts[parts.length - 1];
  } else if (authorInfo.count === 2) {
    // Two authors: Smith and Jones
    const lastName1 = authorInfo.authors[0].split(' ').pop();
    const lastName2 = authorInfo.authors[1].split(' ').pop();
    authorText = `${lastName1} and ${lastName2}`;
  } else {
    // 3+ authors: Smith et al.
    const lastName = authorInfo.authors[0].split(' ').pop();
    authorText = `${lastName} et al.`;
  }

  return `(${authorText} ${year})`;
}

// Shorten title for in-text citation (first few words)
function shortenTitle(title) {
  if (!title) return 'Untitled';
  const words = title.split(' ');
  if (words.length <= 4) return title;
  return words.slice(0, 4).join(' ') + '...';
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
