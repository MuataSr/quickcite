// QuickCite - Service Worker (Manifest V3)
// This file handles context menu creation and quote capture functionality

// ============================================================================
// CONTEXT MENU: Create and manage context menu
// ============================================================================

function createContextMenu() {
  try {
    // Remove existing menu
    chrome.contextMenus.removeAll();

    // Create new menu
    chrome.contextMenus.create({
      id: 'saveQuote',
      title: 'Save Quote & Generate Citation',
      contexts: ['selection']
    });

    console.log('✅ Context menu created');
  } catch (error) {
    console.error('❌ Failed to create context menu:', error);
  }
}

// Create on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('📦 Extension installed');
  createContextMenu();
});

// Also create when service worker starts
createContextMenu();

// ============================================================================
// QUOTE CAPTURE HANDLER: Process context menu clicks
// ============================================================================
// ============================================================================
// TOAST CREATION: Function to inject toast into webpage
// ============================================================================
function createToast(message) {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span style="white-space: nowrap;">${message}</span>
  `;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 10);

  // Auto-remove
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2500);
}

// ============================================================================
// ARXIV SUPPORT: Detect arxiv URLs and fetch metadata from API
// ============================================================================

// Check if URL is from arxiv.org (PDF or abstract page)
function isArxivUrl(url) {
  return /arxiv\.org\/(abs|pdf)\//.test(url);
}

// Extract arxiv paper ID from URL
// Handles: arxiv.org/abs/2301.00001, arxiv.org/pdf/2301.00001.pdf, arxiv.org/pdf/2301.00001v2
function extractArxivId(url) {
  const match = url.match(/arxiv\.org\/(?:abs|pdf)\/([0-9]+\.[0-9]+(?:v[0-9]+)?)/);
  if (match) return match[1];

  // Also handle older format: arxiv.org/abs/cs/9901002
  const oldMatch = url.match(/arxiv\.org\/(?:abs|pdf)\/([a-z-]+\/[0-9]+(?:v[0-9]+)?)/);
  if (oldMatch) return oldMatch[1];

  return null;
}

// Fetch metadata from arxiv API
async function fetchArxivMetadata(arxivId) {
  try {
    const apiUrl = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
    console.log('Fetching arxiv metadata:', apiUrl);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Arxiv API error: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('Arxiv API response length:', xmlText.length);

    // Parse XML with regex (DOMParser not available in service workers)

    // Extract title - look for <title> inside <entry>
    const entryMatch = xmlText.match(/<entry>([\s\S]*?)<\/entry>/);
    if (!entryMatch) {
      console.error('No entry found in arxiv response');
      return null;
    }
    const entryXml = entryMatch[1];

    // Extract title (remove newlines and extra spaces)
    const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null;

    // Extract all authors
    const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
    const authors = [];
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entryXml)) !== null) {
      authors.push(authorMatch[1].trim());
    }
    const authorString = authors.length > 0 ? authors.join(' and ') : null;

    // Extract published date
    const publishedMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/);
    const published = publishedMatch ? publishedMatch[1].trim() : null;

    console.log('Arxiv metadata extracted:', { title, authors: authorString, published });

    return {
      title: title,
      author: authorString,
      published: published,
      source: 'arXiv'
    };
  } catch (error) {
    console.error('Error fetching arxiv metadata:', error);
    return null;
  }
}

// ============================================================================
// QUOTE CAPTURE HANDLER: Process context menu clicks
// ============================================================================

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Verify the correct menu item was clicked
  if (info.menuItemId === 'saveQuote') {
    try {
      // Extract the selected text from the context menu info
      const selectedText = info.selectionText;

      // Validate that text was actually selected
      if (!selectedText || selectedText.trim().length === 0) {
        throw new Error('No text selected');
      }

      // Initialize quote metadata with defaults
      let sourceTitle = tab.title;
      let author = null;
      let sourceName = null;

      // Check if this is an arxiv URL - fetch metadata from API
      if (isArxivUrl(tab.url)) {
        const arxivId = extractArxivId(tab.url);
        if (arxivId) {
          console.log('Detected arxiv paper:', arxivId);
          const arxivData = await fetchArxivMetadata(arxivId);
          if (arxivData) {
            sourceTitle = arxivData.title || sourceTitle;
            author = arxivData.author;
            sourceName = 'arXiv';
          }
        }
      }

      // If not arxiv or arxiv fetch failed, use standard extraction
      if (!author) {
        author = await extractAuthor(tab.id, tab.url, tab.title);
      }

      // Create quote object with the specified schema
      const quote = {
        id: crypto.randomUUID(), // Generate unique identifier
        text: selectedText.trim(), // Clean up whitespace
        sourceTitle: sourceTitle, // Paper title or page title
        sourceUrl: tab.url, // Current page URL
        author: author, // Extracted author name
        sourceName: sourceName, // e.g., "arXiv" for academic sources
        timestamp: new Date().toISOString(), // ISO 8601 timestamp
        accessDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) // Human-readable access date
      };

      // Save the quote to local storage
      await saveQuoteToStorage(quote);

      // Notify popup to refresh (if open)
      chrome.runtime.sendMessage({ action: 'refreshQuotes' }).catch(() => {
        // Popup might not be open, ignore error
      });

      // Show custom toast directly on the webpage (works even when popup is closed)
      const toastMessage = 'Source Saved';
      console.log('Showing toast:', toastMessage);

      try {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: createToast,
          args: [toastMessage]
        });
        console.log('Toast injected successfully');
      } catch (error) {
        console.error('Failed to inject toast:', error);
      }

      console.log('Quote saved:', quote.id);

    } catch (error) {
      console.error('Error saving quote:', error);
      // Show error notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'QuickCite',
        message: 'Error saving quote. Please try again.'
      });
    }
  }
});

// ============================================================================
// STORAGE LOGIC: Save quotes to chrome.storage.local
// ============================================================================
async function saveQuoteToStorage(quote) {
  try {
    // Retrieve existing quotes array from storage
    const result = await chrome.storage.local.get(['quotes']);

    // Get existing quotes or initialize empty array
    const existingQuotes = result.quotes || [];

    // Append new quote to the array
    existingQuotes.push(quote);

    // Save the updated array back to storage
    await chrome.storage.local.set({ quotes: existingQuotes });

    console.log(`Storage: Saved quote ${quote.id}. Total quotes: ${existingQuotes.length}`);

  } catch (error) {
    console.error('Storage error:', error);
    throw error; // Re-throw to be handled by caller
  }
}

// ============================================================================
// USER FEEDBACK: Show Chrome notification
// ============================================================================
// ============================================================================
// MESSAGE HANDLER: Handle requests from popup
// ============================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.action === 'getQuotes') {
    // Retrieve all quotes
    chrome.storage.local.get(['quotes']).then(result => {
      sendResponse({ success: true, quotes: result.quotes || [] });
    }).catch(error => {
      console.error('Error getting quotes:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Indicates async response

  } else if (message.action === 'deleteQuote') {
    // Delete a specific quote
    const quoteId = message.quoteId;
    chrome.storage.local.get(['quotes']).then(result => {
      const quotes = result.quotes || [];
      const updatedQuotes = quotes.filter(q => q.id !== quoteId);
      return chrome.storage.local.set({ quotes: updatedQuotes });
    }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error deleting quote:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;

  } else if (message.action === 'clearAllQuotes') {
    // Clear all quotes
    chrome.storage.local.set({ quotes: [] }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error clearing quotes:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;

  } else if (message.action === 'notifyQuoteSaved') {
    // Notify popup to refresh quotes
    chrome.runtime.sendMessage({ action: 'refreshQuotes' }).catch(() => {
      // Popup might not be open, ignore error
    });
    sendResponse({ success: true });
  }

  // Always return true for async message handling
  return true;
});

// ============================================================================
// AUTHOR EXTRACTION: Extract author name from page using content script
// ============================================================================

// Content script function to extract author from page DOM
function extractAuthorFromPage() {
  // Helper to clean author name
  const cleanAuthorName = (name) => {
    if (!name) return null;
    // Remove common prefixes
    name = name.replace(/^(by|written by|author:|posted by|published by)\s*/i, '');
    // Remove extra whitespace
    name = name.replace(/\s+/g, ' ').trim();
    // Skip if it looks like a URL, email, or is too short/long
    if (name.includes('@') || name.includes('http') || name.length < 2 || name.length > 50) {
      return null;
    }
    return name;
  };

  // 1. Try meta tags first (most reliable)
  const metaSelectors = [
    'meta[name="author"]',
    'meta[property="author"]',
    'meta[property="article:author"]',
    'meta[name="twitter:creator"]',
    'meta[property="og:article:author"]',
  ];

  for (const selector of metaSelectors) {
    const meta = document.querySelector(selector);
    if (meta) {
      const content = meta.getAttribute('content');
      const cleaned = cleanAuthorName(content);
      if (cleaned) return cleaned;
    }
  }

  // 2. Try JSON-LD structured data
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      // Handle array of schemas
      const schemas = Array.isArray(data) ? data : [data];
      for (const schema of schemas) {
        if (schema.author) {
          const author = schema.author;
          if (typeof author === 'string') {
            const cleaned = cleanAuthorName(author);
            if (cleaned) return cleaned;
          } else if (author.name) {
            const cleaned = cleanAuthorName(author.name);
            if (cleaned) return cleaned;
          } else if (Array.isArray(author) && author[0]) {
            const firstAuthor = author[0];
            const name = typeof firstAuthor === 'string' ? firstAuthor : firstAuthor.name;
            const cleaned = cleanAuthorName(name);
            if (cleaned) return cleaned;
          }
        }
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  // 3. Try common DOM selectors for author elements
  const domSelectors = [
    '[rel="author"]',
    '[itemprop="author"]',
    '.author-name',
    '.author',
    '.byline-name',
    '.byline a',
    '.byline',
    '.post-author',
    '.article-author',
    '.entry-author',
    'a[href*="/author/"]',
    '.writer-name',
    '.contributor-name',
  ];

  for (const selector of domSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Get text content, prioritizing nested links
      const link = element.querySelector('a');
      const text = link ? link.textContent : element.textContent;
      const cleaned = cleanAuthorName(text);
      if (cleaned) return cleaned;
    }
  }

  return null;
}

// Fallback: Extract author from title string
function extractAuthorFromTitle(title) {
  if (!title) return null;

  // Patterns to match author in title (case-insensitive, flexible spacing)
  const patterns = [
    /[-–—|]\s*(?:by|written by|author:?)\s+([A-Za-z][A-Za-z\s.'-]+)/i,
    /\s+(?:by|written by)\s+([A-Za-z][A-Za-z\s.'-]+?)(?:\s*[-–—|]|$)/i,
    /[-–—|]\s*([A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+){1,3})\s*$/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const author = match[1].trim();
      // Validate: should be 2-4 words, reasonable length
      const words = author.split(/\s+/);
      if (words.length >= 1 && words.length <= 4 && author.length <= 40) {
        return author;
      }
    }
  }
  return null;
}

// Fallback: Extract author from URL
function extractAuthorFromUrl(url) {
  if (!url) return null;

  const patterns = [
    /\/author\/([^\/\?#]+)/i,
    /\/by\/([^\/\?#]+)/i,
    /\/writers?\/([^\/\?#]+)/i,
    /\/contributors?\/([^\/\?#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      let author = decodeURIComponent(match[1]);
      author = author.replace(/[-_]/g, ' ');
      // Title case
      author = author.replace(/\b\w/g, l => l.toUpperCase());
      if (author.length >= 2 && author.length <= 40) {
        return author;
      }
    }
  }
  return null;
}

// Main author extraction function
async function extractAuthor(tabId, url, title) {
  try {
    // 1. Try content script injection to get author from page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: extractAuthorFromPage,
    });

    if (results && results[0] && results[0].result) {
      console.log('Author found via content script:', results[0].result);
      return results[0].result;
    }
  } catch (error) {
    console.log('Content script injection failed (may be restricted page):', error.message);
  }

  // 2. Fallback: Try title patterns
  const titleAuthor = extractAuthorFromTitle(title);
  if (titleAuthor) {
    console.log('Author found in title:', titleAuthor);
    return titleAuthor;
  }

  // 3. Fallback: Try URL patterns
  const urlAuthor = extractAuthorFromUrl(url);
  if (urlAuthor) {
    console.log('Author found in URL:', urlAuthor);
    return urlAuthor;
  }

  // 4. No author found
  console.log('No author found for:', title);
  return null;
}
