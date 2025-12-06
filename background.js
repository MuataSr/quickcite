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
    <span style="font-size: 18px; font-weight: bold;">✓</span>
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

      // Extract author from page title and URL
      const author = await extractAuthor(tab.url, tab.title);

      // Create quote object with the specified schema
      const quote = {
        id: crypto.randomUUID(), // Generate unique identifier
        text: selectedText.trim(), // Clean up whitespace
        sourceTitle: tab.title, // Current page title
        sourceUrl: tab.url, // Current page URL
        author: author, // Extracted author name
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
// AUTHOR EXTRACTION: Extract author name from page
// ============================================================================
async function extractAuthor(url, title) {
  try {
    // Try to extract author from page title
    // Common patterns: "Title - By Author", "Title | By Author", "Title by Author"
    const authorPatterns = [
      /\s*[-–|]\s*By\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /\s*[-–|]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-–|]/,
    ];

    for (const pattern of authorPatterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no author found in title, try to extract from URL (for some sites)
    const urlPatterns = [
      /\/author\/([^\/\?#]+)/i,
      /\/by\/([^\/\?#]+)/i,
    ];

    for (const pattern of urlPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // Decode URL encoding and format the name
        let author = decodeURIComponent(match[1]);
        author = author.replace(/[-_]/g, ' ');
        // Capitalize properly
        author = author.replace(/\b\w/g, l => l.toUpperCase());
        return author;
      }
    }

    // If still no author found, return null (will display as "Unknown Author")
    return null;

  } catch (error) {
    console.error('Error extracting author:', error);
    return null;
  }
}
